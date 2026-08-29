-- Jerusalem Interactive Walking Tour — QR image persistence + larger media uploads
-- Source of truth per CURSOR.md §6. Keep lib/supabase/types.ts in sync.

-- Persist the rendered QR PNG per code so the admin panel can always show
-- the currently-active QR without needing to regenerate (which would
-- immediately invalidate any already-printed code).
alter table public.qr_codes add column if not exists qr_image_path text;

-- Allow uploading station videos up to 300MB (default Supabase bucket limit
-- is much lower). Images/captions are tiny in comparison and fit well
-- within this same bucket-level ceiling.
update storage.buckets
set file_size_limit = 314572800 -- 300 MiB
where id = 'station-videos';
