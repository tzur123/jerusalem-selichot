import type { Station } from "@/types/station";

/**
 * Seed / fallback station data.
 *
 * A coherent Selichot night walk through Jerusalem: from Rav Kook's house in
 * the city centre, down through Zion Square, into the Old City at Jaffa Gate,
 * on to the Hurva Synagogue in the Jewish Quarter, and finishing at the
 * Western Wall. All names, addresses and coordinates are real, well-known
 * public Jerusalem landmarks. The product owner can rename/reorder/replace
 * any of them and swap in their own media via the /admin panel.
 *
 * This file backs the in-memory "mock backend" used when Supabase is not
 * configured (see `lib/config/env.ts` → `useMockBackend`), and doubles as
 * the payload for `supabase/seed.sql`.
 */
export const SEED_STATIONS: Station[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    slug: "beit-harav-kook",
    name: "בית הרב קוק",
    shortDescription: "ביתו ומשכנו של הרב אברהם יצחק הכהן קוק, הרב הראשי הראשון לארץ ישראל.",
    longDescription:
      "בית הרב קוק שוכן ברחוב הרב קוק 9 בירושלים, הבית בו חי ופעל הרב אברהם יצחק הכהן קוק בין השנים 1923–1935. כיום משמש הבית כמוזיאון על חייו ופועלו של הרב, ובו גם אולם ישיבת מרכז הרב. מכאן יוצאים לדרך.",
    address: "רחוב הרב קוק 9, ירושלים",
    latitude: 31.78333333,
    longitude: 35.22008333,
    orderIndex: 1,
    isDefaultStart: true,
    arrivalRadiusM: 45,
    videoPath: null,
    posterPath: null,
    captionsPath: null,
    isPublished: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    slug: "kikar-tzion",
    name: "כיכר ציון",
    shortDescription: "ליבה ההיסטורי של מרכז העיר ירושלים, מקום מפגש ותנועה מאז ימי המנדט.",
    longDescription:
      "כיכר ציון היא אחת הכיכרות המפורסמות בירושלים, במפגש הרחובות יפו, בן יהודה והרב קוק. במשך עשרות שנים שימשה כלב הפועם של מרכז העיר — מקום מפגש, הפגנות ואירועים. משם ממשיכים במורד רחוב יפו לכיוון העיר העתיקה.",
    address: "כיכר ציון, ירושלים",
    latitude: 31.7809,
    longitude: 35.21935,
    orderIndex: 2,
    isDefaultStart: false,
    arrivalRadiusM: 45,
    videoPath: null,
    posterPath: null,
    captionsPath: null,
    isPublished: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    slug: "shaar-yafo",
    name: "שער יפו",
    shortDescription: "השער הראשי במערב חומות העיר העתיקה, הכניסה אל הרובע היהודי והכותל.",
    longDescription:
      "שער יפו נבנה בשנת 1538 בימי השולטאן סולימאן המפואר, והוא אחד משערי החומה המרכזיים של העיר העתיקה. מכאן נכנסים אל תוך הסמטאות העתיקות, אל הרובע היהודי ואל דרך הכותל המערבי.",
    address: "שער יפו, העיר העתיקה, ירושלים",
    latitude: 31.77653,
    longitude: 35.2277,
    orderIndex: 3,
    isDefaultStart: false,
    arrivalRadiusM: 45,
    videoPath: null,
    posterPath: null,
    captionsPath: null,
    isPublished: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    slug: "beit-knesset-hachurva",
    name: "בית הכנסת החורבה",
    shortDescription: "בית הכנסת המרכזי והמפואר של הרובע היהודי, סמל לחורבן ולתקומה.",
    longDescription:
      "בית הכנסת החורבה שוכן בלב הרובע היהודי בעיר העתיקה. הוקם במאה ה-18, נחרב ונבנה מחדש מספר פעמים, ושוחזר לתפארתו בשנת 2010. כיפתו הגבוהה נראית מרחוק והוא מסמל את סיפור החורבן והתקומה של ירושלים.",
    address: "רחוב החברה, הרובע היהודי, ירושלים",
    latitude: 31.77435,
    longitude: 35.23117,
    orderIndex: 4,
    isDefaultStart: false,
    arrivalRadiusM: 45,
    videoPath: null,
    posterPath: null,
    captionsPath: null,
    isPublished: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    slug: "hakotel-hamaaravi",
    name: "הכותל המערבי",
    shortDescription: "שריד בית המקדש והמקום הקדוש ביותר לעם היהודי — לב הסליחות בירושלים.",
    longDescription:
      "הכותל המערבי הוא שריד מחומות הר הבית מימי בית המקדש השני, והמקום הקדוש ביותר לתפילה בעם היהודי. בלילות הסליחות מתמלאת הרחבה באלפי מתפללים. כאן מסתיים המסע — בתפילה מול אבני הקודש.",
    address: "רחבת הכותל המערבי, העיר העתיקה, ירושלים",
    latitude: 31.7767,
    longitude: 35.2344,
    orderIndex: 5,
    isDefaultStart: false,
    arrivalRadiusM: 50,
    videoPath: null,
    posterPath: null,
    captionsPath: null,
    isPublished: true,
  },
];
