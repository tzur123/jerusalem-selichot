-- Seed data for local/dev Supabase projects.
--
-- A coherent Selichot night walk through Jerusalem, from Rav Kook's house to
-- the Western Wall. All coordinates are real public Jerusalem landmarks; the
-- product owner can rename/reorder/replace them and add media via /admin.

insert into public.stations (
  id, slug, name, short_description, long_description, address,
  latitude, longitude, order_index, is_default_start, arrival_radius_m, is_published
) values
  (
    '00000000-0000-4000-8000-000000000001',
    'beit-harav-kook',
    'בית הרב קוק',
    'ביתו ומשכנו של הרב אברהם יצחק הכהן קוק, הרב הראשי הראשון לארץ ישראל.',
    'בית הרב קוק שוכן ברחוב הרב קוק 9 בירושלים, הבית בו חי ופעל הרב אברהם יצחק הכהן קוק בין השנים 1923–1935. כיום משמש הבית כמוזיאון על חייו ופועלו של הרב, ובו גם אולם ישיבת מרכז הרב. מכאן יוצאים לדרך.',
    'רחוב הרב קוק 9, ירושלים',
    31.78333333, 35.22008333,
    1, true, 45, true
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'kikar-tzion',
    'כיכר ציון',
    'ליבה ההיסטורי של מרכז העיר ירושלים, מקום מפגש ותנועה מאז ימי המנדט.',
    'כיכר ציון היא אחת הכיכרות המפורסמות בירושלים, במפגש הרחובות יפו, בן יהודה והרב קוק. במשך עשרות שנים שימשה כלב הפועם של מרכז העיר — מקום מפגש, הפגנות ואירועים. משם ממשיכים במורד רחוב יפו לכיוון העיר העתיקה.',
    'כיכר ציון, ירושלים',
    31.7809, 35.21935,
    2, false, 45, true
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    'shaar-yafo',
    'שער יפו',
    'השער הראשי במערב חומות העיר העתיקה, הכניסה אל הרובע היהודי והכותל.',
    'שער יפו נבנה בשנת 1538 בימי השולטאן סולימאן המפואר, והוא אחד משערי החומה המרכזיים של העיר העתיקה. מכאן נכנסים אל תוך הסמטאות העתיקות, אל הרובע היהודי ואל דרך הכותל המערבי.',
    'שער יפו, העיר העתיקה, ירושלים',
    31.77653, 35.2277,
    3, false, 45, true
  ),
  (
    '00000000-0000-4000-8000-000000000004',
    'beit-knesset-hachurva',
    'בית הכנסת החורבה',
    'בית הכנסת המרכזי והמפואר של הרובע היהודי, סמל לחורבן ולתקומה.',
    'בית הכנסת החורבה שוכן בלב הרובע היהודי בעיר העתיקה. הוקם במאה ה-18, נחרב ונבנה מחדש מספר פעמים, ושוחזר לתפארתו בשנת 2010. כיפתו הגבוהה נראית מרחוק והוא מסמל את סיפור החורבן והתקומה של ירושלים.',
    'רחוב החברה, הרובע היהודי, ירושלים',
    31.77435, 35.23117,
    4, false, 45, true
  ),
  (
    '00000000-0000-4000-8000-000000000005',
    'hakotel-hamaaravi',
    'הכותל המערבי',
    'שריד בית המקדש והמקום הקדוש ביותר לעם היהודי — לב הסליחות בירושלים.',
    'הכותל המערבי הוא שריד מחומות הר הבית מימי בית המקדש השני, והמקום הקדוש ביותר לתפילה בעם היהודי. בלילות הסליחות מתמלאת הרחבה באלפי מתפללים. כאן מסתיים המסע — בתפילה מול אבני הקודש.',
    'רחבת הכותל המערבי, העיר העתיקה, ירושלים',
    31.7767, 35.2344,
    5, false, 50, true
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

-- Deterministic demo QR token hashes so `/q/beit-harav-kook-demo` works after
-- seeding *only if* QR_HASH_PEPPER='dev-only-insecure-qr-pepper' (the default
-- dev value). In production, generate real tokens from /admin instead.
