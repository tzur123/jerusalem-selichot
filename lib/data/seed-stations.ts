import type { Station } from "@/types/station";

/**
 * Seed / fallback station data — the five stops of the Selichot night walk,
 * in the order set by the product owner: Rav Kook's house (start), Jaffa
 * Gate, the Hurva Synagogue, Beit Orot, and the Western Wall. All names,
 * addresses and coordinates are real, well-known public Jerusalem landmarks.
 * The product owner can rename/reorder/replace any of them and swap in
 * their own media via the /admin panel.
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
    shortDescription: "הבית ברחוב הרב קוק 9, ממנו יוצאים לדרך.",
    longDescription:
      "ברחוב צר במרכז העיר, מאחורי דלת עץ כבדה, חי הרב אברהם יצחק הכהן קוק — הרב הראשי הראשון לארץ ישראל. הבית נשמר כמעט כפי שהיה: הספרייה, החדר שבו קיבל אנשים בכל שעה, החצר השקטה. תלמידי ישיבת מרכז הרב עדיין לומדים כאן, ומכאן יוצאת מדי לילה בחודש אלול קבוצת המתפללים הראשונה לדרך.",
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
    slug: "beit-knesset-hachurva",
    name: "בית הכנסת החורבה",
    shortDescription: "הכיפה הלבנה שרואים מכל פינה ברובע היהודי.",
    longDescription:
      "כיפתה הלבנה מזנקת מעל גגות הרובע היהודי, ורואים אותה כמעט מכל פינה בעיר העתיקה. פעמיים נהרס בית הכנסת הזה — פעם בידי נושי חוב במאה ה-18, ופעם בקרבות 1948 — ופעמיים נבנה מחדש, עד לשחזורו המלא ב-2010. שווה לעצור כמה דקות בפנים, מתחת לכיפה, לפני שממשיכים הלאה.",
    address: "רחוב החברה, הרובע היהודי, ירושלים",
    latitude: 31.77435,
    longitude: 35.23117,
    orderIndex: 3,
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
    shortDescription: "השער שנפרץ לרוחבו כדי שקיסר יוכל לעבור בו.",
    longDescription:
      "השער הרחב ביותר בחומות העיר העתיקה הורחב במיוחד לקראת ביקורו של הקיסר הגרמני וילהלם השני ב-1898 — עד אז נכנסו כאן רק דרך פתח צר בצד. היום עוברים בו כל יום אלפי אנשים: תיירים, סוחרים, כמרים, חיילים. בלילה, כשההמולה שוככת, נשמע רק הד הצעדים על האבן.",
    address: "שער יפו, העיר העתיקה, ירושלים",
    latitude: 31.77653,
    longitude: 35.2277,
    orderIndex: 2,
    isDefaultStart: false,
    arrivalRadiusM: 45,
    videoPath: null,
    posterPath: null,
    captionsPath: null,
    isPublished: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    slug: "beit-orot",
    name: "בית אורות",
    shortDescription: "נקודת התצפית שממנה רואים את כל העיר העתיקה בבת אחת.",
    longDescription:
      "מגב הרכס שמעל שכונת בית אורות, בהמשך הר הצופים, נפרש כל הרובע העתיק לרגליכם — כיפות הזהב והכסף, מגדלי הכנסיות, וברקע הרי מואב. זו אחת הנקודות היחידות בירושלים שמהן רואים בבת אחת את כל מה שכבר עברתם ואת מה שעוד לפניכם. כדאי לעצור כאן רגע, לנשום, ואז לרדת לכיוון הכותל.",
    address: "רחוב בנימין אלון 1, ירושלים",
    latitude: 31.78556,
    longitude: 35.24639,
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
    shortDescription: "כאן מסתיים הסיור — ומתחילה התפילה.",
    longDescription:
      "אבני הענק שלרגליכם עומדות במקומן עוד מימי הורדוס, כחלק מחומת התמיכה של הר הבית. בלילות הסליחות מתמלאת הרחבה עד אפס מקום, קולות התפילה מתערבבים זה בזה, ומישהו תמיד מתחיל לשיר. כאן מסתיים הסיור — לא בסוף, אלא ברגע שבו הכי הרבה אנשים בוחרים להתחיל את שלהם.",
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
