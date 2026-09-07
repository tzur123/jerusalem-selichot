import { getStationBySlug, getPublishedStations } from "@/lib/data/stations";
import { isLocatable } from "@/types/station";
import { getSessionProgress } from "@/lib/session/progress";
import { getAdminSession } from "@/lib/admin/auth";
import { Screen } from "@/components/brand/Screen";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/Button";
import { Navigator } from "@/components/navigation/Navigator";

export const metadata = { title: "ניווט לתחנה", robots: { index: false } };

export default async function NavigatePage({
  params,
  searchParams,
}: {
  params: Promise<{ stationSlug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { stationSlug } = await params;
  const { preview } = await searchParams;
  const station = await getStationBySlug(stationSlug);

  if (!station || !station.isPublished) {
    return (
      <Screen>
        <ErrorState
          title="התחנה אינה זמינה"
          description="ייתכן שהתחנה הוסתרה או שהקישור שגוי."
          secondaryAction={
            <Button href="/tour" variant="secondary" fullWidth>
              חזרה למפת הסיור
            </Button>
          }
        />
      </Screen>
    );
  }

  if (!isLocatable(station)) {
    return (
      <Screen>
        <ErrorState
          title="לתחנה זו טרם נקבע מיקום"
          description="בעל המוצר טרם השלים קואורדינטות לתחנה זו."
          secondaryAction={
            <Button href="/tour" variant="secondary" fullWidth>
              חזרה למפת הסיור
            </Button>
          }
        />
      </Screen>
    );
  }

  const [allStations, sessionData] = await Promise.all([getPublishedStations(), getSessionProgress()]);
  const allLocatable = allStations.filter(isLocatable);
  const progressByStationId = new Map(sessionData?.progress.map((p) => [p.stationId, p.status]) ?? []);

  // `?preview=arrived` — admin-only remote link that jumps straight to the
  // "you've arrived, scan the QR" screen without needing real GPS/physical
  // presence at the station, so it can be reviewed from anywhere.
  const forcePreviewArrival = preview === "arrived" && Boolean(await getAdminSession());

  return (
    <Navigator
      station={station}
      allStations={allLocatable}
      progressByStationId={progressByStationId}
      forcePreviewArrival={forcePreviewArrival}
    />
  );
}
