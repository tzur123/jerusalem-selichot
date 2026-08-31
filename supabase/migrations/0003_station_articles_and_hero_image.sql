-- Jerusalem Interactive Walking Tour — editable public article content + hero image
-- Source of truth per CURSOR.md §6. Keep lib/supabase/types.ts in sync.

-- Admin-editable copy for the public, SEO-indexed /places/[slug] page per
-- station. All nullable: when empty, the app falls back to the built-in
-- default copy in lib/content/station-articles.ts.
alter table public.stations add column if not exists hero_image_path text;
alter table public.stations add column if not exists article_seo_title text;
alter table public.stations add column if not exists article_meta_description text;
alter table public.stations add column if not exists article_keywords text;
alter table public.stations add column if not exists article_heading text;
    10|alter table public.stations add column if not exists article_duration text;
alter table public.stations add column if not exists article_body text;

-- ---------------------------------------------------------------------------
-- Storage: public bucket for the location "hero" images shown on the
-- public station pages. Separate from the private `station-videos` bucket
-- (which stays gated behind signed URLs) since these images must be
-- reachable with a stable, non-expiring URL from statically generated pages.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('station-public', 'station-public', true, 20971520) -- 20 MiB
    20|on conflict (id) do update set public = true, file_size_limit = 20971520;

drop policy if exists "admin manage station public media" on storage.objects;
create policy "admin manage station public media" on storage.objects
  for all
  using (bucket_id = 'station-public' and auth.role() = 'authenticated')
  with check (bucket_id = 'station-public' and auth.role() = 'authenticated');

drop policy if exists "public read station public media" on storage.objects;
create policy "public read station public media" on storage.objects
    30|  for select
  using (bucket_id = 'station-public');
