import { Screen } from "@/components/brand/Screen";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getPublishedStations } from "@/lib/data/stations";
import { getSessionProgress } from "@/lib/session/progress";
import { ShareButton } from "@/components/complete/ShareButton";
import { SuccessChime } from "@/components/complete/SuccessChime";
import { TrackOnMount } from "@/components/analytics/TrackOnMount";
import { formatDurationHebrew } from "@/lib/utils/duration";

export const metadata = { title: "סיימתם את הסיור!", robots: { index: false } };

export default async function CompletePage() {
  const [stations, sessionData] = await Promise.all([getPublishedStations(), getSessionProgress()]);
  const completedIds = new Set(
    (sessionData?.progress ?? []).filter((p) => p.status === "completed").map((p) => p.stationId)
  );

  const session = sessionData?.session;
  const durationMs = session?.completedAt
    ? new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()
    : null;
  const durationText = durationMs != null && durationMs > 0 ? formatDurationHebrew(durationMs) : null;

  return (
    <Screen className="justify-between gap-8">
      <TrackOnMount name="tour_completed" />
      <SuccessChime />

      <div className="text-center pt-6">
        <span className="text-6xl drop-shadow-[0_4px_20px_rgba(232,200,135,0.35)]" aria-hidden>
          🎉
        </span>
        <h1 className="text-3xl font-heading font-bold mt-4">כל הכבוד, סיימתם את הסיור!</h1>
        <p className="text-muted mt-2">5 תחנות. סיפור אחד. תודה שהייתם חלק ממנו.</p>
      </div>

      {durationText && (
        <div className="glass-card gold-glow rounded-3xl px-6 py-5 text-center">
          <p className="text-sm text-muted">הזמן שלכם</p>
          <p className="text-4xl font-heading font-bold text-gradient-gold mt-1">{durationText}</p>
        </div>
      )}

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
        <ShareButton durationText={durationText} />
        <Button href="/start" variant="ghost" fullWidth>
          לסיור נוסף
        </Button>
      </div>
    </Screen>
  );
}
