/**
 * One-off admin script: upserts the real 5-station Selichot route content
 * directly into the production Supabase database using the service-role
 * key, mirroring supabase/seed.sql. Run with:
 *   npx tsx scripts/push-seed-to-prod.mts
 *
 * Safe to re-run — it's an upsert keyed by fixed UUIDs, matching seed.sql.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const env: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

const env = loadEnvLocal();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const stations = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    slug: "beit-harav-kook",
    name: "בית הרב קוק",
    short_description: "הבית ברחוב הרב קוק 9, ממנו יוצאים לדרך.",
    long_description:
      "ברחוב צר במרכז העיר, מאחורי דלת עץ כבדה, חי הרב אברהם יצחק הכהן קוק — הרב הראשי הראשון לארץ ישראל. הבית נשמר כמעט כפי שהיה: הספרייה, החדר שבו קיבל אנשים בכל שעה, החצר השקטה. תלמידי ישיבת מרכז הרב עדיין לומדים כאן, ומכאן יוצאת מדי לילה בחודש אלול קבוצת המתפללים הראשונה לדרך.",
    address: "רחוב הרב קוק 9, ירושלים",
    latitude: 31.78333333,
    longitude: 35.22008333,
    order_index: 1,
    is_default_start: true,
    arrival_radius_m: 45,
    is_published: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    slug: "beit-knesset-hachurva",
    name: "בית הכנסת החורבה",
    short_description: "הכיפה הלבנה שרואים מכל פינה ברובע היהודי.",
    long_description:
      "כיפתה הלבנה מזנקת מעל גגות הרובע היהודי, ורואים אותה כמעט מכל פינה בעיר העתיקה. פעמיים נהרס בית הכנסת הזה — פעם בידי נושי חוב במאה ה-18, ופעם בקרבות 1948 — ופעמיים נבנה מחדש, עד לשחזורו המלא ב-2010. שווה לעצור כמה דקות בפנים, מתחת לכיפה, לפני שממשיכים הלאה.",
    address: "רחוב החברה, הרובע היהודי, ירושלים",
    latitude: 31.77435,
    longitude: 35.23117,
    order_index: 2,
    is_default_start: false,
    arrival_radius_m: 45,
    is_published: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    slug: "shaar-yafo",
    name: "שער יפו",
    short_description: "השער שנפרץ לרוחבו כדי שקיסר יוכל לעבור בו.",
    long_description:
      "השער הרחב ביותר בחומות העיר העתיקה הורחב במיוחד לקראת ביקורו של הקיסר הגרמני וילהלם השני ב-1898 — עד אז נכנסו כאן רק דרך פתח צר בצד. היום עוברים בו כל יום אלפי אנשים: תיירים, סוחרים, כמרים, חיילים. בלילה, כשההמולה שוככת, נשמע רק הד הצעדים על האבן.",
    address: "שער יפו, העיר העתיקה, ירושלים",
    latitude: 31.77653,
    longitude: 35.2277,
    order_index: 3,
    is_default_start: false,
    arrival_radius_m: 45,
    is_published: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    slug: "beit-orot",
    name: "בית אורות",
    short_description: "נקודת התצפית שממנה רואים את כל העיר העתיקה בבת אחת.",
    long_description:
      "מגב הרכס שמעל שכונת בית אורות, בהמשך הר הצופים, נפרש כל הרובע העתיק לרגליכם — כיפות הזהב והכסף, מגדלי הכנסיות, וברקע הרי מואב. זו אחת הנקודות היחידות בירושלים שמהן רואים בבת אחת את כל מה שכבר עברתם ואת מה שעוד לפניכם. כדאי לעצור כאן רגע, לנשום, ואז לרדת לכיוון הכותל.",
    address: "רחוב בנימין אלון 1, ירושלים",
    latitude: 31.78556,
    longitude: 35.24639,
    order_index: 4,
    is_default_start: false,
    arrival_radius_m: 45,
    is_published: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    slug: "hakotel-hamaaravi",
    name: "הכותל המערבי",
    short_description: "כאן מסתיים הסיור — ומתחילה התפילה.",
    long_description:
      "אבני הענק שלרגליכם עומדות במקומן עוד מימי הורדוס, כחלק מחומת התמיכה של הר הבית. בלילות הסליחות מתמלאת הרחבה עד אפס מקום, קולות התפילה מתערבבים זה בזה, ומישהו תמיד מתחיל לשיר. כאן מסתיים הסיור — לא בסוף, אלא ברגע שבו הכי הרבה אנשים בוחרים להתחיל את שלהם.",
    address: "רחבת הכותל המערבי, העיר העתיקה, ירושלים",
    latitude: 31.7767,
    longitude: 35.2344,
    order_index: 5,
    is_default_start: false,
    arrival_radius_m: 50,
    is_published: true,
  },
];

async function main() {
  console.log(`Connecting to ${url} ...`);

  const { data: before, error: beforeErr } = await supabase
    .from("stations")
    .select("slug, name, order_index")
    .order("order_index");
  if (beforeErr) {
    console.error("Failed to read existing stations:", beforeErr.message);
    process.exit(1);
  }
  console.log("Existing stations before upsert:", before);

  const { data, error } = await supabase.from("stations").upsert(stations, { onConflict: "id" }).select();
  if (error) {
    console.error("Upsert failed:", error.message);
    process.exit(1);
  }
  console.log(`Upserted ${data?.length ?? 0} stations.`);

  const { data: after } = await supabase.from("stations").select("slug, name, order_index, is_published").order("order_index");
  console.log("Stations now in DB:");
  console.table(after);

  // Best-effort check on the 0002 migration (qr_image_path column + storage limit).
  const { error: qrColErr } = await supabase.from("qr_codes").select("qr_image_path").limit(1);
  if (qrColErr) {
    console.warn(
      "\n⚠ qr_codes.qr_image_path column check failed — migration 0002 may not be applied yet:",
      qrColErr.message
    );
  } else {
    console.log("✓ qr_codes.qr_image_path column exists (migration 0002 applied).");
  }
}

main();
