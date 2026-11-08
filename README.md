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
