-- Nur für TikTok: Schnitt-Notizen pro Satz/Aufnahme (was im Video gezeigt werden soll).
-- folge = Folgen- oder Themen-ID, satz = Satz-ID (Videos) bzw. Aufnahme-ID n<zeit> (Themen).
create table if not exists public.notizen (
  folge text not null references public.folgen(id) on delete cascade,
  satz text not null,
  text text not null,
  at timestamptz not null default now(),
  primary key (folge, satz)
);
alter table public.notizen enable row level security;

-- Ideen & Feedback (Reiter "Ideen"): eine feste Zeile, damit notizen/aufnahmen darauf zeigen können
insert into public.folgen (id, titel, art, info, rang, saetze, archiv)
values ('ideen', 'Ideen & Feedback', 'ideen', 'Videoideen, Verbesserungen, Feedback', 0, '[]', false)
on conflict (id) do nothing;
