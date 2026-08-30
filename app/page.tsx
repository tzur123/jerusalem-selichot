import { Screen } from "@/components/brand/Screen";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { TrackOnMount } from "@/components/analytics/TrackOnMount";
import { HowItWorks } from "@/components/landing/HowItWorks";

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      {/* Points left: in RTL, "forward/continue" reads toward the left. */}
      <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <Screen className="justify-between gap-10">
      <TrackOnMount name="landing_viewed" />

      <header className="flex justify-center items-center pt-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
        <Logo size="lg" />
      </header>

      <section className="flex flex-col items-center text-center gap-6 translate-y-[25%] drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)]">
        <h1 className="text-4xl font-heading font-bold leading-tight text-white">
          5 תחנות. סיפור אחד.
          <br />
          <span className="text-gradient-gold">ירושלים בלילה.</span>
        </h1>
        <div className="gold-divider w-24" />
        <p className="text-muted text-base max-w-sm">
          סיור לילי ברגל בין חמש נקודות בירושלים — בלי קבוצה ובלי מדריך.
          רק אתם, האבנים העתיקות, ולילה שמתעורר לקראת הסליחות.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <Button href="/start" size="lg" fullWidth className="pulse-cta">
          מתחילים את הסיור
          <ArrowIcon />
        </Button>

        <HowItWorks />
      </section>
    </Screen>
  );
}
