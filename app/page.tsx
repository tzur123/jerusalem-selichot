import { Screen } from "@/components/brand/Screen";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { TrackOnMount } from "@/components/analytics/TrackOnMount";

const STEPS = [
  { title: "בוחרים נקודת התחלה", body: "הכי קרוב אליי, או המסלול המומלץ מבית הרב קוק." },
  { title: "מנווטים ברגל בתוך האתר", body: "מפה חיה, חץ כיוון והוראות צעד־אחר־צעד עד לתחנה." },
  { title: "סורקים QR בתחנה", body: "מחפשים את קוד ה־QR הפיזי במקום וסורקים כדי לפתוח אותה." },
  { title: "צופים וממשיכים", body: "סרטון קצר על התחנה, ואז יוצאים לתחנה הבאה — עד 5/5." },
];

export default function LandingPage() {
  return (
    <Screen className="justify-between gap-10">
      <TrackOnMount name="landing_viewed" />

      <header className="flex justify-between items-center pt-2">
        <Logo />
      </header>

      <section className="flex flex-col items-center text-center gap-5">
        <span className="text-mint font-bold tracking-wide text-sm">סיור סליחות דיגיטלי</span>
        <h1 className="text-4xl font-black leading-tight text-white">
          5 תחנות. סיפור אחד.
          <br />
          <span className="text-mint">ירושלים בלילה.</span>
        </h1>
        <p className="text-muted text-base max-w-sm">
          סיור סליחות עצמאי בין חמש נקודות ציון בירושלים — בקצב שלכם, עם ניווט, QR וסרטונים
          שנפתחים בכל תחנה.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <Button href="/start" size="lg" fullWidth>
          מתחילים את הסיור
        </Button>

        <details className="group">
          <summary className="cursor-pointer text-center text-sm text-muted underline underline-offset-4 list-none">
            איך זה עובד?
          </summary>
          <div className="mt-4 grid gap-3">
            {STEPS.map((step, i) => (
              <Card key={step.title} className="flex items-start gap-3 py-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint/15 text-mint font-black">
                  {i + 1}
                </span>
                <div>
                  <CardTitle className="text-base">{step.title}</CardTitle>
                  <CardSubtitle className="text-xs">{step.body}</CardSubtitle>
                </div>
              </Card>
            ))}
          </div>
        </details>
      </section>
    </Screen>
  );
}
