-- Sounds aus dem Internet, die nach Benutzung automatisch hochgeladen werden (Reiter Sounds).
-- Statische Sounds liegen weiter in soundeffekte/ (Repo); neue landen hier.
create table if not exists public.sounds (
  id text primary key,
  name text not null,
  dauer_s numeric,
  einsatz text,
  quelle text,
  lizenz text,
  folgen text[] not null default '{}',
  stimmung text[] not null default '{}',
  themen text[] not null default '{}',
  daten bytea,
  at timestamptz not null default now()
);
alter table public.sounds enable row level security;
-- Zugriff nur über die Edge Function (Service-Role), keine öffentlichen Policies.

-- Eigener, widerrufbarer Schlüssel nur für Claude (Threads und Mac-Sitzungen).
-- Der Wert steht NICHT im Repo: Supabase einstellungen.claude_token + Projektordner tiktok/werkzeug/.
insert into public.einstellungen (name, wert)
select 'claude_token', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
where not exists (select 1 from public.einstellungen where name = 'claude_token');
