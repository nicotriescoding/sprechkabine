// Nur für TikTok: Backend der Sprechkabine (Supabase Edge Function "kabine").
// Jede Anfrage braucht den geheimen Schlüssel ?k=..., der im Link der Seite steckt.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

let schluessel: string | null = null;
async function erlaubt(k: string | null) {
  if (!schluessel) {
    const { data } = await sb.from("einstellungen").select("wert").eq("name", "schluessel").single();
    schluessel = data?.wert ?? null;
  }
  return !!k && !!schluessel && k === schluessel;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const url = new URL(req.url);
  if (!(await erlaubt(url.searchParams.get("k")))) return json({ fehler: "Falscher Schlüssel" }, 403);
  const aktion = url.searchParams.get("aktion") ?? "liste";

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
