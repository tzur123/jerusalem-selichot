import Link from "next/link";
import { Screen } from "@/components/brand/Screen";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "מידע כללי על סיור הסליחות",
  description:
    "כל המידע על סיורי הסליחות בירושלים: תאריכים, נקודת פתיחה, סיור עצמאי אינטראקטיבי מול סיור קבוצתי מודרך, איך זה עובד וטיפים למסיירים.",
  alternates: { canonical: "/info" },
};

const STATIONS = [
  { slug: "beit-harav-kook", name: "בית הרב קוק", blurb: "פתיחת המסע, סיפור הבית והחזון הירושלמי." },
  { slug: "shaar-yafo", name: "שער יפו", blurb: "המעבר בין ירושלים החדשה לעתיקה, שער הכניסה ההיסטורי." },
  {
    slug: "beit-knesset-hachurva",
    name: "בית הכנסת \u2018החורבה\u2019",
    blurb: "לב הרובע היהודי, סיפור התקומה והתפילה.",
  },
  { slug: "beit-orot", name: "בית אורות / נקודת תצפית ורוח", blurb: "חיבור לעומק ולנופי ירושלים." },
  { slug: "hakotel-hamaaravi", name: "הכותל המערבי", blurb: "שיא המסע: אמירת סליחות מרטיטות לב ברחבת הכותל." },
];

const STEPS = [
  { title: "בוחרים נקודת התחלה", body: "המסלול המומלץ מתחיל בבית הרב קוק." },
  {
    title: "מנווטים ברגל באתר",
    body: "מפה חיה עם חץ כיוון והנחיות ניווט ברורות צעד־אחר־צעד לאורך כל הדרך.",
  },
  {
    title: "סורקים QR בתחנה",
    body: "בכל אחת מ-5 התחנות מחפשים את קוד ה-QR הפיזי כדי לפתוח את התוכן של התחנה.",
  },
  {
    title: "צופים וממשיכים",
    body: "נהנים מסרטון קצר, המחזה או קטע תוכן מרתק - וממשיכים לתחנה הבאה (סה\"כ 5 תחנות עד לכותל).",
  },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-xl md:text-2xl font-bold text-white">{title}</h2>
      {children}
    </section>
  );
}

export default function TourInfoPage() {
  return (
    <Screen className="gap-8" wide>
      <header className="pt-4 text-center">
        <p className="text-xs font-bold tracking-wide text-gold uppercase">סיורי סליחות בירושלים</p>
        <h1 className="mt-2 font-heading text-2xl md:text-4xl font-bold leading-tight text-white">
          מידע כללי על הסיור
        </h1>
        <p className="mt-3 text-muted text-sm md:text-base leading-relaxed">
          לקראת הימים הנוראים, עיריית ירושלים מזמינה אתכם לחוויית סליחות ייחודית, נגישה ומרתקת לכל המשפחה,
          לקבוצות ולבודדים - פתוחה לקהל הרחב וללא עלות!
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="flex flex-col gap-1">
          <CardSubtitle>תאריכים</CardSubtitle>
          <CardTitle className="text-base">כ&quot;ד באלול - י&#39; בתשרי (6.9 – 17.9)</CardTitle>
        </Card>
        <Card className="flex flex-col gap-1">
          <CardSubtitle>מיקום פתיחה</CardSubtitle>
          <CardTitle className="text-base">בית הרב קוק, רחוב הרב קוק 9, ירושלים</CardTitle>
        </Card>
      </div>

      <Section title="שני מסלולים לבחירתכם">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="flex flex-col gap-3">
            <div>
              <CardTitle>1. סיור עצמאי אינטראקטיבי</CardTitle>
              <CardSubtitle>חוויה לכל המשפחה והילדים</CardSubtitle>
            </div>
            <p className="text-sm text-muted leading-relaxed">
              יוצאים לדרך בקצב שלכם! מסלול מונחה בסמארטפון המשלב סרטונים קצרים, הופעות, חידות ותוכן מרתק בכל
              תחנה. ללא צורך בהרשמה מוקדמת!
            </p>
            <p className="text-sm text-muted leading-relaxed">
              נקודת מפגש ויציאה: מגיעים לבית הרב קוק (רחוב הרב קוק 9, ירושלים), סורקים את הברקוד (QR) בעמדה 0
              ויוצאים לדרך.
            </p>
            <Button href="/start" fullWidth>
              יוצאים לסיור העצמאי
            </Button>
          </Card>

          <Card className="flex flex-col gap-3">
            <div>
              <CardTitle>2. סיור קבוצתי מודרך</CardTitle>
              <CardSubtitle>לקבוצות ומאורגנים</CardSubtitle>
            </div>
            <p className="text-sm text-muted leading-relaxed">
              סיור סליחות עמוק ומרומם בעקבות דמותו ומורשתו של הרב קוק - מפגש מעורר השראה עם ענק הרוח שנתן את
              הנשמה לציונות ולירושלים.
            </p>
            <p className="text-sm text-muted leading-relaxed">
              מותאם לקבוצות ומאורגנים (מעל 30 איש). ההשתתפות ללא תשלום (בהרשמה מראש).
            </p>
            <Button href="tel:0522218206" variant="secondary" fullWidth>
              להזמנת סיור: 052-221-8206
            </Button>
            <p className="text-xs text-muted text-center">מענה בימים א&#39;-ה&#39; בשעות 09:00–15:00</p>
          </Card>
        </div>
      </Section>

      <Section title="איך עובד הסיור העצמאי? (4 צעדים פשוטים)">
        <div className="grid gap-3">
          {STEPS.map((step, i) => (
            <Card key={step.title} className="flex items-start gap-3 py-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold font-stencil ring-1 ring-gold/30">
                {i + 1}
              </span>
              <div>
                <CardTitle className="text-base">{step.title}</CardTitle>
                <CardSubtitle className="text-xs">{step.body}</CardSubtitle>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="התחנות במסלול">
        <div className="grid gap-3">
          {STATIONS.map((station, i) => (
            <Link key={station.slug} href={`/places/${station.slug}`}>
              <Card className="flex items-center gap-3 py-3 hover:border-gold/50 transition-colors">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint/15 text-mint font-black">
                  {i + 1}
                </span>
                <div>
                  <CardTitle className="text-base">{station.name}</CardTitle>
                  <CardSubtitle className="text-xs">{station.blurb}</CardSubtitle>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="טיפים מועילים למסיירים">
        <ul className="list-disc pr-5 flex flex-col gap-2 text-sm text-muted leading-relaxed">
          <li>
            <span className="text-white font-semibold">הנעלה:</span> מומלץ להגיע בנעלי הליכה נוחות.
          </li>
          <li>
            <span className="text-white font-semibold">לבוש חם:</span> הלילות הירושלמיים קרירים - מומלץ
            להצטייד בעליונית/סוודר.
          </li>
          <li>
            <span className="text-white font-semibold">טלפון נייד:</span> ודאו שהסוללה טעונה במלואה (כדאי
            לקחת מטען נייד) כדי ליהנות מהסרטונים ומהניווט.
          </li>
        </ul>
      </Section>

      <Button href="/start" size="lg" fullWidth className="pulse-cta">
        מתחילים את הסיור
      </Button>
    </Screen>
  );
}
