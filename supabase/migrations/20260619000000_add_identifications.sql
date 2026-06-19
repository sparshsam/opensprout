-- OpenSprout v0.8: Plant identification and diagnosis history

create table if not exists public.identifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  photo_path text not null,
  results jsonb not null default '[]',
  selected_species_id uuid references public.plant_species(id) on delete set null,
  selected_name text,
  confidence numeric(5,2),
  diagnosis jsonb default null,
  source text not null default 'plantnet',
  created_at timestamptz not null default now()
);

alter table public.identifications enable row level security;

create policy "Users manage their identifications"
  on public.identifications
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index identifications_user_idx on public.identifications(user_id, created_at desc);

grant select, insert, update, delete on public.identifications to authenticated;
