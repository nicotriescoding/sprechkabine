#!/usr/bin/env python3
"""Claude-Werkzeug für die Sprechkabine (nur TikTok). Nur Standardbibliothek + ffmpeg.

Der Claude-Token wird NIE als Argument übergeben oder angezeigt. Er wird gelesen aus:
  1. Umgebungsvariable KABINE_TOKEN
  2. Datei .kabine_token neben diesem Skript
  3. Datei ../.kabine_zugang relativ zum Skript bzw. ~/Projects/.kabine_zugang (Mac, außerhalb aller Repos)

Befehle:
  kabine.py ton <folge> <satz> <ziel>          Aufnahme aus der Sprechkabine holen
  kabine.py liste                               Folgen, Aufnahmen, Aufträge als JSON
  kabine.py sound <datei> --id x --name "..." --quelle URL [--einsatz ..] [--lizenz ..]
                  [--folgen day15,day16] [--stimmung witzig,schock] [--themen Meme,Kampf]
        Sound zu mp3 (mono) wandeln und in den Reiter Sounds hochladen.
        Mit --sql wird statt Hochladen eine SQL-Datei geschrieben (für Umgebungen ohne
        Zugriff auf supabase.co, z. B. Cloud-Threads: Inhalt per Supabase-MCP execute_sql).
  kabine.py sound-tags <id> --stimmung .. --themen .. (nur Angaben ändern)

Stimmung: witzig, schock, angst, freude, traurig, spannung, episch, cringe, wut, ruhig
Themen:   Meme, Film & TV, Gaming, Minecraft, Dating-App, Kampf, Kneipe, Tiere, Ansage,
          Fail, Technik, Geld, Musik, Schnitt, Alarm, Stimme
"""
import argparse, json, os, subprocess, sys, tempfile, urllib.parse, urllib.request

API = "https://opqahbmbrvtbsxnxdjvw.supabase.co/functions/v1/kabine"


def token():
    t = os.environ.get("KABINE_TOKEN")
    if t:
        return t.strip()
    here = os.path.dirname(os.path.abspath(__file__))
    for p in (os.path.join(here, ".kabine_token"), os.path.join(here, "..", ".kabine_zugang"),
              os.path.expanduser("~/Projects/.kabine_zugang")):
        if os.path.exists(p):
            return open(p).read().strip()
    sys.exit("Kein Claude-Token gefunden (KABINE_TOKEN, .kabine_token oder ~/Projects/.kabine_zugang).")


def call(aktion, params, body=None, method="GET"):
    q = urllib.parse.urlencode({"k": token(), "aktion": aktion, **params})
    req = urllib.request.Request(f"{API}?{q}", data=body, method=method,
                                 headers={"Content-Type": "application/octet-stream"} if body else {})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def zu_mp3(src):
    out = tempfile.mktemp(suffix=".mp3")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-ac", "1", "-ar", "44100", "-b:a", "64k", out], check=True)
    dauer = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                           "-of", "default=nw=1:nk=1", out]).decode().strip())
    return out, round(dauer, 2)


def sq(s):
    return "'" + str(s).replace("'", "''") + "'"


def arr(s):
    items = [x.strip() for x in (s or "").split(",") if x.strip()]
    return "array[" + ",".join(sq(x) for x in items) + "]::text[]" if items else "'{}'::text[]"


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    t = sub.add_parser("ton"); t.add_argument("folge"); t.add_argument("satz"); t.add_argument("ziel")
    sub.add_parser("liste")
    for n in ("sound", "sound-tags"):
        s = sub.add_parser(n)
        s.add_argument("datei" if n == "sound" else "id")
        if n == "sound": s.add_argument("--id", required=True)
        s.add_argument("--name"); s.add_argument("--quelle"); s.add_argument("--einsatz"); s.add_argument("--lizenz")
        s.add_argument("--folgen"); s.add_argument("--stimmung"); s.add_argument("--themen")
        s.add_argument("--sql", help="SQL-Datei schreiben statt hochladen")
    a = ap.parse_args()

    if a.cmd == "ton":
        open(a.ziel, "wb").write(call("ton", {"folge": a.folge, "satz": a.satz})); print("ok", a.ziel)
    elif a.cmd == "liste":
        print(json.dumps(json.loads(call("liste", {})), ensure_ascii=False, indent=1))
    elif a.cmd == "sound":
        mp3, dauer = zu_mp3(a.datei)
        if a.sql:
            import base64
            b = base64.b64encode(open(mp3, "rb").read()).decode()
            sql = (f"insert into sounds (id,name,dauer_s,einsatz,quelle,lizenz,folgen,stimmung,themen,daten) values ("
                   f"{sq(a.id)},{sq(a.name or a.id)},{dauer},{sq(a.einsatz or '')},{sq(a.quelle or '')},{sq(a.lizenz or '')},"
                   f"{arr(a.folgen)},{arr(a.stimmung)},{arr(a.themen)},decode('{b}','base64')) "
                   "on conflict (id) do update set name=excluded.name,dauer_s=excluded.dauer_s,einsatz=excluded.einsatz,"
                   "quelle=excluded.quelle,lizenz=excluded.lizenz,folgen=excluded.folgen,stimmung=excluded.stimmung,"
                   "themen=excluded.themen,daten=excluded.daten,at=now();")
            open(a.sql, "w").write(sql); print("SQL geschrieben:", a.sql, f"({len(sql)//1024} KB, Projekt opqahbmbrvtbsxnxdjvw)")
        else:
            p = {"id": a.id, "name": a.name or a.id, "dauer_s": dauer}
            for k in ("einsatz", "quelle", "lizenz", "folgen", "stimmung", "themen"):
                if getattr(a, k) is not None: p[k] = getattr(a, k)
            print(call("soundneu", p, open(mp3, "rb").read(), "POST").decode())
    else:
        p = {"id": a.id}
        for k in ("name", "einsatz", "quelle", "lizenz", "folgen", "stimmung", "themen"):
            if getattr(a, k) is not None: p[k] = getattr(a, k)
        print(call("soundneu", p, b"", "POST").decode())


if __name__ == "__main__":
    main()
