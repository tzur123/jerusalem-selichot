import { getStationBySlug } from "@/lib/data/stations";
import { getSessionProgress } from "@/lib/session/progress";
import { Screen } from "@/components/brand/Screen";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/Button";
import { StationVideoPlayer } from "@/components/video/StationVideoPlayer";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const station = await getStationBySlug(slug);
  return { title: station?.name ?? "תחנה", robots: { index: false } };
}

export default async function StationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const station = await getStationBySlug(slug);

  if (!station || !station.isPublished) {
    return (
      <Screen>
        <ErrorState
          title="התחנה אינה זמינה"
          description="ייתכן שהתחנה הוסתרה על ידי המנהל."
          secondaryAction={
            <Button href="/tour" variant="secondary" fullWidth>
              חזרה למפת הסיור
            </Button>
          }
        />
      </Screen>
    );
  }

  const sessionData = await getSessionProgress();
  const progress = sessionData?.progress.find((p) => p.stationId === station.id);
  const isUnlocked = progress && ["unlocked", "watching", "completed"].includes(progress.status);

  if (!isUnlocked) {
    return (
      <Screen>
        <ErrorState
          title="התחנה עדיין נעולה"
          description="כדי לפתוח את התחנה, הגיעו למקום וסרקו את קוד ה-QR הפיזי."
          secondaryAction={
            <Button href={`/navigate/${station.slug}`} variant="secondary" fullWidth>
              נווטו לתחנה
            </Button>
          }
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <header className="pt-2 pb-4">
        <h1 className="text-2xl font-black">{station.name}</h1>
        {station.shortDescription && <p className="text-muted text-sm mt-1">{station.shortDescription}</p>}
      </header>

      <StationVideoPlayer station={station} alreadyCompleted={progress?.status === "completed"} />

      {station.longDescription && (
        <p className="mt-6 text-sm leading-relaxed text-muted whitespace-pre-line">{station.longDescription}</p>
      )}
    </Screen>
  );
}
