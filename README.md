# Sprechkabine

Nur für TikTok (@legendarysidequest): Handy-Seite zum Einsprechen. Aufnahmen gehen privat an eine Supabase-Funktion, der Schlüssel steckt im Link und nicht im Repo.

- **Themen**: Thema wählen (z. B. "How to start a fight in a pub"), oben steht kurz, worum es geht, dann beliebig viele Sprüche nacheinander aufnehmen. Jede Aufnahme wird beim Stopp sofort gespeichert. Die besten werden später ausgesucht.
- **Videos**: die festen Sätze pro Folge (Day 3, Day 4 ...) wie bisher.

Themen sind Zeilen in `folgen` mit `art = 'thema'` (`info` = Kurzbeschreibung, `rang` = Reihenfolge, `saetze` = Vorschläge). Aufnahmen landen in `aufnahmen` mit `folge` = Themen-ID, `satz` = `n<Zeitstempel>`, `hash` = `wer:<Name>`.
