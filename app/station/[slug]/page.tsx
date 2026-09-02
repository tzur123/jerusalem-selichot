import { getStationBySlug, getPublishedStations } from "@/lib/data/stations";
import { getSessionProgress } from "@/lib/session/progress";
import { getAdminSession } from "@/lib/admin/auth";
import { Screen } from "@/components/brand/Screen";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/Button";
import { StationVideoPlayer } from "@/components/video/StationVideoPlayer";
import { StationArrivalCelebration } from "@/components/station/StationArrivalCelebration";

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

  // The video is intentionally open to everyone — no QR scan or physical
  // arrival required. `isAdminPreview` still exists purely so an admin
  // clicking "preview" from /admin doesn't pollute this visitor's real
  // progress/analytics; regular visitors always get full, tracked access.
  const sessionData = await getSessionProgress();
  const progress = sessionData?.progress.find((p) => p.stationId === station.id);
  const isUnlocked = progress && ["unlocked", "watching", "completed"].includes(progress.status);
  const isAdminPreview = !isUnlocked && Boolean(await getAdminSession());

  const justUnlocked = progress?.status === "unlocked";
  const isFinalStation = justUnlocked
    ? (await getPublishedStations()).every((s) => s.id === station.id || s.orderIndex < station.orderIndex)
    : false;

  return (
    <Screen>
      {justUnlocked && <StationArrivalCelebration stationName={station.name} isFinalStation={isFinalStation} />}

      {isAdminPreview && (
        <div className="rounded-2xl border border-gold/40 bg-gold/10 px-4 py-2 text-center text-xs font-bold text-gold">
          תצוגה מקדימה למנהל — לא נרשם כביקור בסטטיסטיקות
        </div>
      )}

      <header className="pt-[28px] pb-4">
        <h1 className="text-2xl font-black">{station.name}</h1>
        {station.shortDescription && <p className="text-muted text-sm mt-1">{station.shortDescription}</p>}
      </header>

      <StationVideoPlayer
        station={station}
        alreadyCompleted={progress?.status === "completed"}
        previewMode={isAdminPreview}
      />

      {station.longDescription && (
        <p className="mt-6 text-sm leading-relaxed text-muted whitespace-pre-line">{station.longDescription}</p>
      )}
    </Screen>
  );
}
