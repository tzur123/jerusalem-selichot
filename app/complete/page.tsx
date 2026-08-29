import { Screen } from "@/components/brand/Screen";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getPublishedStations } from "@/lib/data/stations";
import { getSessionProgress } from "@/lib/session/progress";
import { ShareButton } from "@/components/complete/ShareButton";
import { TrackOnMount } from "@/components/analytics/TrackOnMount";

export const metadata = { title: "סיימתם את הסיור!" };

export default async function CompletePage() {
  const [stations, sessionData] = await Promise.all([getPublishedStations(), getSessionProgress()]);
  const completedIds = new Set(
    (sessionData?.progress ?? []).filter((p) => p.status === "completed").map((p) => p.stationId)
  );

  return (
    <Screen className="justify-between gap-8">
      <TrackOnMount name="tour_completed" />

      <div className="text-center pt-6">
        <span className="text-6xl" aria-hidden>
          🎉
        </span>
        <h1 className="text-3xl font-black mt-4">השלמתם את סיור הסליחות בירושלים!</h1>
        <p className="text-muted mt-2">5 תחנות. סיפור אחד. תודה שהייתם חלק ממנו.</p>
      </div>

      <div className="flex flex-col gap-3">
        {[...stations]
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((station) => (
            <Card key={station.id} className="flex items-center gap-3 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mint/20 text-mint font-black">
                {completedIds.has(station.id) ? "✓" : station.orderIndex}
              </span>
              <CardTitle className="text-base">{station.name}</CardTitle>
            </Card>
          ))}
      </div>

      <div className="flex flex-col gap-3">
        <ShareButton />
        <Button href="/start" variant="ghost" fullWidth>
          לסיור נוסף
        </Button>
      </div>
    </Screen>
  );
}
