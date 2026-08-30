-- Seed data for local/dev Supabase projects.
--
-- The five stops of the Selichot night walk, in the order set by the product
-- owner: Rav Kook's house (start), the Hurva Synagogue, Jaffa Gate, Beit
-- Orot, and the Western Wall. All coordinates are real public Jerusalem
-- landmarks; the product owner can rename/reorder/replace them and add
-- media via /admin.

insert into public.stations (
  id, slug, name, short_description, long_description, address,
  latitude, longitude, order_index, is_default_start, arrival_radius_m, is_published
) values
  (
    '00000000-0000-4000-8000-000000000001',
    'beit-harav-kook',
    'בית הרב קוק',
    'הבית ברחוב הרב קוק 9, ממנו יוצאים לדרך.',
    'ברחוב צר במרכז העיר, מאחורי דלת עץ כבדה, חי הרב אברהם יצחק הכהן קוק — הרב הראשי הראשון לארץ ישראל. הבית נשמר כמעט כפי שהיה: הספרייה, החדר שבו קיבל אנשים בכל שעה, החצר השקטה. תלמידי ישיבת מרכז הרב עדיין לומדים כאן, ומכאן יוצאת מדי לילה בחודש אלול קבוצת המתפללים הראשונה לדרך.',
    'רחוב הרב קוק 9, ירושלים',
    31.78333333, 35.22008333,
    1, true, 45, true
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'beit-knesset-hachurva',
    'בית הכנסת החורבה',
    'הכיפה הלבנה שרואים מכל פינה ברובע היהודי.',
    'כיפתה הלבנה מזנקת מעל גגות הרובע היהודי, ורואים אותה כמעט מכל פינה בעיר העתיקה. פעמיים נהרס בית הכנסת הזה — פעם בידי נושי חוב במאה ה-18, ופעם בקרבות 1948 — ופעמיים נבנה מחדש, עד לשחזורו המלא ב-2010. שווה לעצור כמה דקות בפנים, מתחת לכיפה, לפני שממשיכים הלאה.',
    'רחוב החברה, הרובע היהודי, ירושלים',
    31.77435, 35.23117,
    2, false, 45, true
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    'shaar-yafo',
    'שער יפו',
    'השער שנפרץ לרוחבו כדי שקיסר יוכל לעבור בו.',
    'השער הרחב ביותר בחומות העיר העתיקה הורחב במיוחד לקראת ביקורו של הקיסר הגרמני וילהלם השני ב-1898 — עד אז נכנסו כאן רק דרך פתח צר בצד. היום עוברים בו כל יום אלפי אנשים: תיירים, סוחרים, כמרים, חיילים. בלילה, כשההמולה שוככת, נשמע רק הד הצעדים על האבן.',
    'שער יפו, העיר העתיקה, ירושלים',
    31.77653, 35.2277,
    3, false, 45, true
  ),
  (
    '00000000-0000-4000-8000-000000000004',
    'beit-orot',
    'בית אורות',
    'נקודת התצפית שממנה רואים את כל העיר העתיקה בבת אחת.',
    'מגב הרכס שמעל שכונת בית אורות, בהמשך הר הצופים, נפרש כל הרובע העתיק לרגליכם — כיפות הזהב והכסף, מגדלי הכנסיות, וברקע הרי מואב. זו אחת הנקודות היחידות בירושלים שמהן רואים בבת אחת את כל מה שכבר עברתם ואת מה שעוד לפניכם. כדאי לעצור כאן רגע, לנשום, ואז לרדת לכיוון הכותל.',
    'רחוב בנימין אלון 1, ירושלים',
    31.78556, 35.24639,
    4, false, 45, true
  ),
  (
    '00000000-0000-4000-8000-000000000005',
    'hakotel-hamaaravi',
    'הכותל המערבי',
    'כאן מסתיים הסיור — ומתחילה התפילה.',
    'אבני הענק שלרגליכם עומדות במקומן עוד מימי הורדוס, כחלק מחומת התמיכה של הר הבית. בלילות הסליחות מתמלאת הרחבה עד אפס מקום, קולות התפילה מתערבבים זה בזה, ומישהו תמיד מתחיל לשיר. כאן מסתיים הסיור — לא בסוף, אלא ברגע שבו הכי הרבה אנשים בוחרים להתחיל את שלהם.',
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
