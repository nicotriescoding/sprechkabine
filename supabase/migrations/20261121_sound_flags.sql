-- Aussortieren (Haken) und Favoriten (Stern) pro Sound, gilt für Repo-Sounds und Sounds aus der Tabelle sounds.
create table if not exists public.sound_flags (
  id text primary key,
  ausgeblendet boolean,   -- null = Standard (selbst gebaute ausgeblendet), true = aussortiert, false = bewusst behalten
  favorit boolean not null default false,
  at timestamptz not null default now()
);
alter table public.sound_flags enable row level security;
-- Zugriff nur über die Edge Function (Service-Role).
