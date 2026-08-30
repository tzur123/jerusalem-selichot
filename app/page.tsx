import { Screen } from "@/components/brand/Screen";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { TrackOnMount } from "@/components/analytics/TrackOnMount";
import { HowItWorks } from "@/components/landing/HowItWorks";

export default function LandingPage() {
  return (
    <Screen className="justify-between gap-10">
      <TrackOnMount name="landing_viewed" />

      <header className="flex justify-center items-center pt-2">
        <Logo size="lg" />
      </header>

      <section className="flex flex-col items-center text-center gap-6">
        <h1 className="text-4xl font-heading font-bold leading-tight text-white">
          5 תחנות. סיפור אחד.
          <br />
          <span className="text-gradient-gold">ירושלים בלילה.</span>
        </h1>
        <div className="gold-divider w-24" />
        <p className="text-muted text-base max-w-sm">
          סיור סליחות עצמאי בין חמש נקודות ציון בירושלים — בקצב שלכם, עם ניווט, QR וסרטונים
          שנפתחים בכל תחנה.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <Button href="/start" size="lg" fullWidth>
          מתחילים את הסיור
        </Button>

        <HowItWorks />
      </section>
    </Screen>
  );
}
