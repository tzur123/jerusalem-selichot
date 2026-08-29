-- Jerusalem Interactive Walking Tour — initial schema
-- Source of truth per CURSOR.md §6. Keep lib/supabase/types.ts in sync.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- stations
-- ---------------------------------------------------------------------------
create table if not exists public.stations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_description text,
  long_description text,
  address text,
  latitude double precision,
  longitude double precision,
  order_index int not null default 1,
  is_default_start boolean not null default false,
  arrival_radius_m int not null default 45,
  video_path text,
  poster_path text,
  captions_path text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stations_published_requires_coords check (
    is_published = false or (latitude is not null and longitude is not null)
  ),
  constraint stations_lat_range check (latitude is null or (latitude between -90 and 90)),
  constraint stations_lng_range check (longitude is null or (longitude between -180 and 180)),
  constraint stations_arrival_radius_range check (arrival_radius_m between 5 and 500)
);

create index if not exists stations_order_index_idx on public.stations (order_index);
create unique index if not exists stations_single_default_start_idx
  on public.stations (is_default_start)
  where is_default_start = true;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists stations_set_updated_at on public.stations;
create trigger stations_set_updated_at
  before update on public.stations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- qr_codes
-- ---------------------------------------------------------------------------
create table if not exists public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.stations (id) on delete cascade,
  token_hash text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists qr_codes_station_id_idx on public.qr_codes (station_id);
create index if not exists qr_codes_active_idx on public.qr_codes (is_active);

-- ---------------------------------------------------------------------------
-- tour_sessions (anonymous visitor sessions)
-- ---------------------------------------------------------------------------
create table if not exists public.tour_sessions (
  id uuid primary key default gen_random_uuid(),
  session_key_hash text not null unique,
  start_mode text not null default 'manual' check (start_mode in ('nearest', 'recommended', 'manual')),
  start_station_id uuid references public.stations (id) on delete set null,
  current_station_id uuid references public.stations (id) on delete set null,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists tour_sessions_last_seen_idx on public.tour_sessions (last_seen_at);

-- ---------------------------------------------------------------------------
-- session_station_progress
-- ---------------------------------------------------------------------------
create table if not exists public.session_station_progress (
  session_id uuid not null references public.tour_sessions (id) on delete cascade,
  station_id uuid not null references public.stations (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'arrived', 'unlocked', 'watching', 'completed')),
  arrived_at timestamptz,
  qr_scanned_at timestamptz,
  video_started_at timestamptz,
  video_completed_at timestamptz,
  completed_at timestamptz,
  primary key (session_id, station_id)
);

create index if not exists session_station_progress_station_idx on public.session_station_progress (station_id);

-- ---------------------------------------------------------------------------
-- analytics_events
-- ---------------------------------------------------------------------------
create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  session_id uuid references public.tour_sessions (id) on delete set null,
  event_name text not null,
  station_id uuid references public.stations (id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_name_idx on public.analytics_events (event_name);
create index if not exists analytics_events_station_idx on public.analytics_events (station_id);
create index if not exists analytics_events_created_idx on public.analytics_events (created_at);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.stations enable row level security;
alter table public.qr_codes enable row level security;
alter table public.tour_sessions enable row level security;
alter table public.session_station_progress enable row level security;
alter table public.analytics_events enable row level security;

-- Public (anon + authenticated) can read published stations only.
drop policy if exists "public read published stations" on public.stations;
create policy "public read published stations" on public.stations
  for select
  using (is_published = true or auth.role() = 'authenticated');

-- Only authenticated (admin) users may write stations. All visitor-facing
-- mutations happen through server routes using the service role key.
drop policy if exists "admin write stations" on public.stations;
create policy "admin write stations" on public.stations
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- qr_codes: never exposed to anon/browser clients. Admin (authenticated) may
-- read status but token hashes are only ever written by the service role.
drop policy if exists "admin read qr codes" on public.qr_codes;
create policy "admin read qr codes" on public.qr_codes
  for select
  using (auth.role() = 'authenticated');

-- tour_sessions / session_station_progress / analytics_events: no direct
-- client access at all — visitor mutations go through Next.js server routes
-- using the service role key. Admins may read analytics via authenticated role.
drop policy if exists "admin read sessions" on public.tour_sessions;
create policy "admin read sessions" on public.tour_sessions
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "admin read progress" on public.session_station_progress;
create policy "admin read progress" on public.session_station_progress
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "admin read analytics" on public.analytics_events;
create policy "admin read analytics" on public.analytics_events
  for select
  using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- Storage: private bucket for station videos/images/captions
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('station-videos', 'station-videos', false)
on conflict (id) do nothing;

drop policy if exists "admin manage station media" on storage.objects;
create policy "admin manage station media" on storage.objects
  for all
  using (bucket_id = 'station-videos' and auth.role() = 'authenticated')
  with check (bucket_id = 'station-videos' and auth.role() = 'authenticated');
