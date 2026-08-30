import { Screen } from "@/components/brand/Screen";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { TrackOnMount } from "@/components/analytics/TrackOnMount";
import { HowItWorks } from "@/components/landing/HowItWorks";

function StartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14.8 3.2a7.6 7.6 0 1 0 6.9 10.9 6.2 6.2 0 0 1-6.9-10.9Z"
        fill="currentColor"
      />
      <path
        d="M19 2.2 19.6 3.7 21.1 4.3 19.6 4.9 19 6.4 18.4 4.9 16.9 4.3 18.4 3.7 19 2.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

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
        <Button href="/start" size="lg" fullWidth className="pulse-cta">
          <StartIcon />
          מתחילים את הסיור
        </Button>

        <HowItWorks />
      </section>
    </Screen>
  );
}
