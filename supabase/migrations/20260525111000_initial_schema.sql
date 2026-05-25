create extension if not exists pgcrypto;
create extension if not exists citext;

create type public.care_type as enum (
  'water',
  'fertilize',
  'mist',
  'rotate',
  'prune',
  'repot',
  'inspect',
  'custom'
);

create type public.task_status as enum (
  'pending',
  'done',
  'skipped',
  'snoozed',
  'cancelled'
);

create type public.transfer_kind as enum ('export', 'import');
create type public.transfer_status as enum ('queued', 'running', 'succeeded', 'failed', 'cancelled');

create or replace function public.touch_sync_columns()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  new.last_modified_at = now();
  new.sync_version = coalesce(old.sync_version, 0) + 1;
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'UTC',
  units text not null default 'metric' check (units in ('metric', 'imperial')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  species text,
  cultivar text,
  nickname text,
  location text,
  acquired_on date,
  notes text,
  cover_photo_path text,
  health_status text check (health_status in ('unknown', 'thriving', 'stable', 'watch', 'struggling')),
  archived_at timestamptz,
  client_id text,
  client_created_at timestamptz,
  client_updated_at timestamptz,
  sync_version bigint not null default 1,
  last_modified_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_id)
);

create table public.care_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plant_id uuid not null references public.plants(id) on delete cascade,
  care_type public.care_type not null,
  custom_label text,
  cadence_value int not null check (cadence_value > 0),
  cadence_unit text not null check (cadence_unit in ('day', 'week', 'month')),
  start_date date not null default current_date,
  due_time time,
  timezone text not null default 'UTC',
  active boolean not null default true,
  notes text,
  last_completed_at timestamptz,
  next_due_at timestamptz,
  client_id text,
  client_created_at timestamptz,
  client_updated_at timestamptz,
  sync_version bigint not null default 1,
  last_modified_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_id)
);

create table public.task_instances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plant_id uuid not null references public.plants(id) on delete cascade,
  schedule_id uuid references public.care_schedules(id) on delete set null,
  care_type public.care_type not null,
  due_at timestamptz not null,
  status public.task_status not null default 'pending',
  completed_log_id uuid,
  completed_at timestamptz,
  skipped_at timestamptz,
  snoozed_until timestamptz,
  schedule_version bigint,
  notes text,
  client_id text,
  client_created_at timestamptz,
  client_updated_at timestamptz,
  sync_version bigint not null default 1,
  last_modified_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_id),
  unique (user_id, schedule_id, due_at)
);

create table public.care_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plant_id uuid not null references public.plants(id) on delete cascade,
  schedule_id uuid references public.care_schedules(id) on delete set null,
  task_instance_id uuid references public.task_instances(id) on delete set null,
  care_type public.care_type not null,
  occurred_at timestamptz not null default now(),
  amount_ml numeric(8,2),
  fertilizer_name text,
  fertilizer_strength text,
  notes text,
  client_id text,
  client_created_at timestamptz,
  client_updated_at timestamptz,
  sync_version bigint not null default 1,
  last_modified_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_id)
);

alter table public.task_instances
  add constraint task_instances_completed_log_fk
  foreign key (completed_log_id) references public.care_logs(id) on delete set null;

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plant_id uuid not null references public.plants(id) on delete cascade,
  title text,
  body text,
  observed_at timestamptz not null default now(),
  health_score int check (health_score between 1 and 5),
  tags text[] not null default '{}',
  client_id text,
  client_created_at timestamptz,
  client_updated_at timestamptz,
  sync_version bigint not null default 1,
  last_modified_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_id)
);

create table public.journal_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plant_id uuid not null references public.plants(id) on delete cascade,
  journal_entry_id uuid references public.journal_entries(id) on delete cascade,
  bucket_id text not null default 'plant-photos',
  object_path text not null,
  content_type text,
  width int,
  height int,
  size_bytes bigint,
  checksum_sha256 text,
  taken_at timestamptz,
  sort_order int not null default 0,
  alt_text text,
  client_id text,
  client_created_at timestamptz,
  client_updated_at timestamptz,
  sync_version bigint not null default 1,
  last_modified_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, object_path),
  unique (user_id, client_id)
);

create table public.data_transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind public.transfer_kind not null,
  status public.transfer_status not null default 'queued',
  format text not null check (format in ('json', 'zip')),
  schema_version int not null,
  app_version text,
  include_photos boolean not null default false,
  storage_bucket text,
  storage_path text,
  manifest jsonb not null default '{}',
  row_counts jsonb not null default '{}',
  checksum_sha256 text,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.sync_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  device_name text,
  platform text,
  app_version text,
  last_seen_at timestamptz not null default now(),
  last_pulled_at timestamptz,
  last_pushed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, device_id)
);

create index plants_user_idx on public.plants(user_id);
create index plants_user_modified_idx on public.plants(user_id, last_modified_at);
create index plants_user_deleted_idx on public.plants(user_id, deleted_at);
create index care_schedules_user_plant_idx on public.care_schedules(user_id, plant_id);
create index care_schedules_due_idx on public.care_schedules(user_id, active, next_due_at);
create index task_instances_calendar_idx on public.task_instances(user_id, due_at, status);
create index task_instances_plant_idx on public.task_instances(user_id, plant_id, due_at);
create index care_logs_plant_time_idx on public.care_logs(user_id, plant_id, occurred_at desc);
create index journal_entries_plant_time_idx on public.journal_entries(user_id, plant_id, observed_at desc);
create index journal_entries_tags_idx on public.journal_entries using gin(tags);
create index journal_photos_entry_idx on public.journal_photos(user_id, journal_entry_id, sort_order);
create index data_transfers_user_created_idx on public.data_transfers(user_id, created_at desc);

create trigger touch_plants before update on public.plants for each row execute function public.touch_sync_columns();
create trigger touch_care_schedules before update on public.care_schedules for each row execute function public.touch_sync_columns();
create trigger touch_task_instances before update on public.task_instances for each row execute function public.touch_sync_columns();
create trigger touch_care_logs before update on public.care_logs for each row execute function public.touch_sync_columns();
create trigger touch_journal_entries before update on public.journal_entries for each row execute function public.touch_sync_columns();
create trigger touch_journal_photos before update on public.journal_photos for each row execute function public.touch_sync_columns();

alter table public.profiles enable row level security;
alter table public.plants enable row level security;
alter table public.care_schedules enable row level security;
alter table public.task_instances enable row level security;
alter table public.care_logs enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_photos enable row level security;
alter table public.data_transfers enable row level security;
alter table public.sync_devices enable row level security;

create policy "Profiles are owned by their users" on public.profiles
for all to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users manage their plants" on public.plants
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage their care schedules" on public.care_schedules
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage their task instances" on public.task_instances
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage their care logs" on public.care_logs
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage their journal entries" on public.journal_entries
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage their journal photos" on public.journal_photos
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage their data transfers" on public.data_transfers
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage their sync devices" on public.sync_devices
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public)
values ('plant-photos', 'plant-photos', false)
on conflict (id) do nothing;

create policy "Users read own plant photo objects" on storage.objects
for select to authenticated
using (bucket_id = 'plant-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users upload own plant photo objects" on storage.objects
for insert to authenticated
with check (bucket_id = 'plant-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users update own plant photo objects" on storage.objects
for update to authenticated
using (bucket_id = 'plant-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'plant-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users delete own plant photo objects" on storage.objects
for delete to authenticated
using (bucket_id = 'plant-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
