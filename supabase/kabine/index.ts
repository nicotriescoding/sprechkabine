// Nur für TikTok: Backend der Sprechkabine (Supabase Edge Function "kabine").
// Jede Anfrage (außer Sounds ansehen/abspielen) braucht den geheimen Schlüssel ?k=...:
// entweder Nicos Schlüssel (im Link der Seite) oder den Claude-Token (einstellungen.claude_token).
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

let schluessel: string[] | null = null;
async function erlaubt(k: string | null) {
  if (!schluessel) {
    const { data } = await sb.from("einstellungen").select("wert").in("name", ["schluessel", "claude_token"]);
    schluessel = (data ?? []).map((r) => r.wert).filter(Boolean);
  }
  return !!k && schluessel.includes(k);
}
const liste = (v: string | null) => (v ?? "").split(",").map((x) => x.trim()).filter(Boolean).slice(0, 12);
const fromHex = (h: unknown) => {
  const hex = String(h).replace(/^\\x/, "");
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const url = new URL(req.url);
  const aktion = url.searchParams.get("aktion") ?? "liste";

  // Sounds ansehen/abspielen braucht keinen Schlüssel (Reiter Sounds), nur Hochladen.
  if (req.method === "GET" && aktion === "soundliste") {
    const r = await sb.from("sounds").select("id, name, dauer_s, einsatz, quelle, lizenz, folgen, stimmung, themen, at").order("at");
    if (r.error) return json({ fehler: r.error.message }, 500);
    return json(r.data);
  }
  if (req.method === "GET" && aktion === "soundton") {
    const { data, error } = await sb.from("sounds").select("daten").eq("id", url.searchParams.get("id") ?? "").single();
    if (error || !data?.daten) return json({ fehler: "Kein Sound" }, 404);
    return new Response(fromHex(data.daten), { headers: { ...CORS, "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=3600" } });
  }

  if (!(await erlaubt(url.searchParams.get("k")))) return json({ fehler: "Falscher Schlüssel" }, 403);

  if (req.method === "POST" && aktion === "soundneu") {
    // Neuer Fremd-Sound (mp3 im Body) mit Quelle und Tags. Ohne Body werden nur die Angaben geändert.
    const q = url.searchParams, id = q.get("id") ?? "";
    if (!/^[\w-]{2,60}$/.test(id)) return json({ fehler: "Ungültige id" }, 400);
    const body = new Uint8Array(await req.arrayBuffer());
    if (body.length > 0 && (body.length < 500 || body.length > 3_000_000)) return json({ fehler: "Sound leer oder zu groß (max 3 MB)" }, 400);
    const row: Record<string, unknown> = { id, at: new Date().toISOString() };
    const t = (n: string, max: number) => (q.get(n) ?? "").trim().slice(0, max);
    if (t("name", 80)) row.name = t("name", 80);
    for (const n of ["einsatz", "quelle", "lizenz"]) if (q.has(n)) row[n] = t(n, 400);
    for (const n of ["folgen", "stimmung", "themen"]) if (q.has(n)) row[n] = liste(q.get(n));
    if (q.get("dauer_s")) row.dauer_s = Number(q.get("dauer_s"));
    if (body.length > 0) row.daten = "\\x" + Array.from(body, (b) => b.toString(16).padStart(2, "0")).join("");
    if (!row.name && body.length > 0) row.name = id;
    const r = await sb.from("sounds").upsert(row);
    if (r.error) return json({ fehler: r.error.message }, 500);
    return json({ ok: true, id });
  }

  if (req.method === "GET" && aktion === "liste") {
    const [f, a, j, n] = await Promise.all([
      sb.from("folgen").select("*").eq("archiv", false),
      sb.from("aufnahmen").select("folge, satz, pfad, hash, at, typ"),
      sb.from("auftraege").select("*"),
      sb.from("notizen").select("folge, satz, text, at"),
    ]);
    if (f.error || a.error || j.error) return json({ fehler: (f.error ?? a.error ?? j.error)!.message }, 500);
    // notizen ist optional: fehlt die Tabelle, bleibt die Liste leer und der Rest geht weiter
    return json({ folgen: f.data, aufnahmen: a.data, auftraege: j.data, notizen: n.error ? [] : n.data });
  }

  if (req.method === "GET" && aktion === "ton") {
    const { data, error } = await sb.from("aufnahmen").select("daten, typ")
      .eq("folge", url.searchParams.get("folge") ?? "").eq("satz", url.searchParams.get("satz") ?? "").single();
    if (error || !data?.daten) return json({ fehler: "Keine Aufnahme" }, 404);
    const hex = String(data.daten).replace(/^\\x/, "");
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    return new Response(bytes, { headers: { ...CORS, "Content-Type": data.typ || "audio/webm", "Cache-Control": "no-store" } });
  }

  if (req.method === "POST" && aktion === "aufnahme") {
    const folge = url.searchParams.get("folge") ?? "", satz = url.searchParams.get("satz") ?? "";
    const hash = url.searchParams.get("hash") ?? "", endung = url.searchParams.get("endung") ?? "webm";
    if (!/^[\w-]{1,40}$/.test(folge) || !/^[\w-]{1,10}$/.test(satz) || !/^(webm|m4a|mp4|ogg)$/.test(endung)) {
      return json({ fehler: "Ungültige Angaben" }, 400);
    }
    const body = new Uint8Array(await req.arrayBuffer());
    if (body.length < 500 || body.length > 15_000_000) return json({ fehler: "Aufnahme leer oder zu groß" }, 400);
    const pfad = `${folge}/${satz}_${Date.now()}.${endung}`;
    const typ = req.headers.get("content-type") || "application/octet-stream";
    const hex = "\\x" + Array.from(body, (b) => b.toString(16).padStart(2, "0")).join("");
    const row = await sb.from("aufnahmen").upsert({ folge, satz, pfad, hash, typ, daten: hex, at: new Date().toISOString() });
    if (row.error) return json({ fehler: row.error.message }, 500);
    return json({ ok: true, pfad });
  }

  if (req.method === "POST" && aktion === "notiz") {
    // Schnitt-Notiz pro Satz (Videos) oder pro Aufnahme (Themen). Leerer Text löscht die Notiz.
    const folge = url.searchParams.get("folge") ?? "", satz = url.searchParams.get("satz") ?? "";
    if (!/^[\w-]{1,40}$/.test(folge) || !/^[\w-]{1,10}$/.test(satz)) return json({ fehler: "Ungültige Angaben" }, 400);
    let text = "";
    try { text = String((await req.json())?.text ?? "").trim().slice(0, 2000); } catch { return json({ fehler: "Text fehlt" }, 400); }
    const r = text
      ? await sb.from("notizen").upsert({ folge, satz, text, at: new Date().toISOString() })
      : await sb.from("notizen").delete().eq("folge", folge).eq("satz", satz);
    if (r.error) return json({ fehler: r.error.message }, 500);
    return json({ ok: true });
  }

  if (req.method === "POST" && aktion === "thema") {
    // Eigenes Thema aus der Seite anlegen (nur Titel + kurze Info, keine Vorschläge)
    const titel = (url.searchParams.get("titel") ?? "").trim().slice(0, 80);
    const info = (url.searchParams.get("info") ?? "").trim().slice(0, 400);
    if (titel.length < 2) return json({ fehler: "Titel fehlt" }, 400);
    const id = "t_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const thema = { id, titel, info: info || null, art: "thema", rang: 50, archiv: false, saetze: [] };
    const r = await sb.from("folgen").insert(thema);
    if (r.error) return json({ fehler: r.error.message }, 500);
    return json({ ok: true, thema });
  }

  if (req.method === "POST" && aktion === "bauen") {
    const folge = url.searchParams.get("folge") ?? "";
    const r = await sb.from("auftraege").upsert({ folge, status: "bestellt", at: new Date().toISOString(), meldung: null });
    if (r.error) return json({ fehler: r.error.message }, 500);
    return json({ ok: true });
  }

  return json({ fehler: "Unbekannte Aktion" }, 404);
});
