-- Seed data for local/dev Supabase projects.
--
-- Only station #1 (בית הרב קוק) has verified public address/coordinates.
-- Per CURSOR.md §24, stations 2–5 are intentionally left as unpublished
-- placeholders with no invented coordinates — fill them in via /admin.

insert into public.stations (
  id, slug, name, short_description, long_description, address,
  latitude, longitude, order_index, is_default_start, arrival_radius_m, is_published
) values (
  '00000000-0000-4000-8000-000000000001',
  'beit-harav-kook',
  'בית הרב קוק',
  'ביתו ומשכנו של הרב אברהם יצחק הכהן קוק, הרב הראשי הראשון לארץ ישראל.',
  'בית הרב קוק שוכן ברחוב הרב קוק 9 בירושלים, הבית בו חי ופעל הרב אברהם יצחק הכהן קוק בין השנים 1923–1935. כיום משמש הבית כמוזיאון על חייו ופועלו של הרב, ובו גם אולם ישיבת מרכז הרב.',
  'רחוב הרב קוק 9, ירושלים',
  31.78333333, 35.22008333,
  1, true, 45, true
)
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  short_description = excluded.short_description,
  long_description = excluded.long_description,
  address = excluded.address,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  order_index = excluded.order_index,
  is_default_start = excluded.is_default_start,
  arrival_radius_m = excluded.arrival_radius_m,
  is_published = excluded.is_published;

insert into public.stations (id, slug, name, short_description, order_index, is_default_start, is_published)
values
  ('00000000-0000-4000-8000-000000000002', 'station-2', 'נקודה 2', 'תחנה ממתינה להשלמת פרטים על ידי בעל המוצר.', 2, false, false),
  ('00000000-0000-4000-8000-000000000003', 'station-3', 'נקודה 3', 'תחנה ממתינה להשלמת פרטים על ידי בעל המוצר.', 3, false, false),
  ('00000000-0000-4000-8000-000000000004', 'station-4', 'נקודה 4', 'תחנה ממתינה להשלמת פרטים על ידי בעל המוצר.', 4, false, false),
  ('00000000-0000-4000-8000-000000000005', 'station-5', 'נקודה 5', 'תחנה ממתינה להשלמת פרטים על ידי בעל המוצר.', 5, false, false)
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  short_description = excluded.short_description,
  order_index = excluded.order_index,
  is_default_start = excluded.is_default_start,
  is_published = excluded.is_published;

-- Deterministic demo QR token hashes so `/q/beit-harav-kook-demo` works after
-- seeding *only if* QR_HASH_PEPPER='dev-only-insecure-qr-pepper' (the default
-- dev value). In production, generate real tokens from /admin instead.
