import { Screen } from "@/components/brand/Screen";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { TrackOnMount } from "@/components/analytics/TrackOnMount";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { getPublishedStations } from "@/lib/data/stations";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      {/* Points left: in RTL, "forward/continue" reads toward the left. */}
      <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function LandingPage() {
  const stations = await getPublishedStations();

  const tripJsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "@id": `${SITE_URL}/#trip`,
    name: "סיורי סליחות בירושלים",
    description:
      "סיור סליחות עצמאי ברגל בין 5 נקודות ציון בירושלים - ניווט חי, קודי QR וסרטונים שנפתחים בכל תחנה.",
    image: `${SITE_URL}/og-image.jpg`,
    url: SITE_URL,
    inLanguage: "he-IL",
    touristType: ["Family", "Couples", "Solo travelers"],
    provider: { "@type": "Organization", name: "סיורי סליחות בירושלים", url: SITE_URL },
    ...(stations.length > 0 && {
      itinerary: {
        "@type": "ItemList",
        numberOfItems: stations.length,
        itemListElement: stations
          .slice()
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((station, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "TouristAttraction",
              name: station.name,
              ...(station.address && { address: station.address }),
              ...(station.latitude != null &&
                station.longitude != null && {
                  geo: {
                    "@type": "GeoCoordinates",
                    latitude: station.latitude,
                    longitude: station.longitude,
                  },
                }),
            },
          })),
      },
    }),
  };

  return (
    <Screen className="justify-between gap-10">
      <TrackOnMount name="landing_viewed" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(tripJsonLd).replace(/</g, "\\u003c") }}
      />

      <header className="flex justify-center items-center pt-2 translate-y-[25px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
        <Logo size="lg" />
      </header>

      <section className="flex flex-col items-center text-center gap-3 mt-[340px] drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)]">
        <h1 className="flex flex-col items-center font-heading font-bold leading-tight text-white translate-y-[10px]">
          <span className="text-4xl md:text-6xl whitespace-nowrap">5 תחנות. סיפור אחד.</span>
          <span className="text-4xl md:text-6xl text-gradient-gold whitespace-nowrap">אל שערי הסליחות</span>
        </h1>
        <p className="text-muted text-base md:text-lg max-w-sm md:max-w-md">
          סיור לילי ברגל בין חמש נקודות בירושלים - בלי קבוצה ובלי מדריך.
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
