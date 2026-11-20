# Sprechkabine

Nur für TikTok (@legendarysidequest): Handy-Seite zum Einsprechen. Aufnahmen gehen privat an eine Supabase-Funktion, der Schlüssel steckt im Link und nicht im Repo.

- **Themen**: Thema wählen (z. B. "How to start a fight in a pub"), oben steht kurz, worum es geht, dann beliebig viele Sprüche nacheinander aufnehmen. Jede Aufnahme wird beim Stopp sofort gespeichert. Die besten werden später ausgesucht.
- **Eigene Themen**: „+ Eigenes Thema“ legt ein neues Thema an (Titel + kurze Info), gespeichert in Supabase.
- **Videos**: die festen Sätze pro Folge (Day 3, Day 4 ...) wie bisher.

Themen sind Zeilen in `folgen` mit `art = 'thema'` (`info` = Kurzbeschreibung, `rang` = Reihenfolge, `saetze` = Vorschläge). Aufnahmen landen in `aufnahmen` mit `folge` = Themen-ID, `satz` = `n<Zeitstempel>`, `hash` = `wer:<Name>`.

## Notizen (seit 2026-11-08)

- **Schnitt-Notiz pro Satz**: Beim aktiven Satz (Videos) und bei jeder Aufnahme (Themen) gibt es ein Feld „📝 Was soll man hier sehen?“ (Szene, Meme, Clip, Kamera). Speichert automatisch.
- **Ideen**: Reiter für Videoideen, Verbesserungen, Feedback. Tippen, mit der Handy-Tastatur diktieren oder als Sprachnotiz aufnehmen.
- Gespeichert in Tabelle `notizen(folge, satz, text, at)`: Videos `satz` = Satz-ID, Themen `satz` = Aufnahme-ID, Ideen `folge = 'ideen'`, `satz = i<zeit>` (Text) bzw. Sprachnotiz in `aufnahmen` mit `folge = 'ideen'`.
- Für den Schnitt holen: `select satz, text from notizen where folge = '<folge>' order by satz`.
- Backend-Quelle: `supabase/kabine/index.ts` (Aktion `notiz`, leerer Text löscht), Migration `supabase/migrations/20261108_notizen.sql`.
- Wiedergabe am iPhone: Mikro wird nach jeder Aufnahme freigegeben, damit Abspielen normal laut ist (nicht Telefon-Lautsprecher).

## Sounds (seit 2026-11-16)

- Reiter **Sounds**: alle bisher benutzten Soundeffekte mit Namen, Dauer, Folge, Einsatz und Lizenz; Antippen spielt ab, nochmal antippen stoppt. Suchfeld oben. Braucht keinen Schlüssel.
- **Filter (seit 2026-11-20)**: Suchleiste (Name, Folge, Einsatz, Quelle, Tags), Chips für Stimmung (witzig, schock, angst, freude, traurig, spannung, episch, cringe, wut, ruhig) und Thema (Meme, Film & TV, Gaming, Minecraft, Dating-App, Kampf, Kneipe, Tiere, Ansage, Fail, Technik, Geld, Musik, Schnitt, Alarm, Stimme), mehrere Chips = UND. Sortierung: neueste, kürzeste, längste, A–Z.
- Selbst gebaute Sounds (Lizenztext enthält "selbst gebaut") sind standardmäßig ausgeblendet, Knopf „Selbst gebaute zeigen“ blendet sie ein (wird im Browser gemerkt).
- Tags: `soundeffekte/tags.json` (`id → {stimmung[], themen[]}`) für die Repo-Sounds, bei Sounds aus der Datenbank direkt in deren Spalten.
- **Neue Sounds automatisch**: Tabelle `sounds` in Supabase (mp3 + Quelle + Tags), Funktion `kabine` Aktionen `soundneu` (Upload, Token nötig), `soundliste`/`soundton` (öffentlich, für die Seite). Hochladen mit `werkzeug/kabine.py sound ...`. Neu hochgeladene erscheinen mit Label „neu“, ohne Deploy/PR.
- Dateien: `soundeffekte/<id>.mp3` (mono, klein, ca. 1 MB gesamt) und `soundeffekte/sounds.json`, abgeleitet aus Mac `clips/sounds/sounds.json`. Neuer Sound = mp3 + Eintrag in `sounds.json`.

## Claude-Zugang (seit 2026-11-20)

Eigener, widerrufbarer Token nur für Claude (`einstellungen.claude_token`, gleiche Rechte wie Nicos Schlüssel, aber getrennt). Er steht nicht im Repo. `werkzeug/kabine.py` liest ihn selbst (Umgebungsvariable `KABINE_TOKEN`, `.kabine_token` neben dem Skript oder `~/Projects/.kabine_zugang` am Mac), er wird nie als Argument übergeben. Widerrufen: `update einstellungen set wert = <neu> where name = 'claude_token'`.
