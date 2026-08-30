import { redirect } from "next/navigation";
import { Screen } from "@/components/brand/Screen";
import { getPublishedStations } from "@/lib/data/stations";
import { getSessionProgress } from "@/lib/session/progress";
import { TourView } from "@/components/tour/TourView";
import { isTourComplete } from "@/lib/session/next-station";

export const metadata = { title: "מפת הסיור", robots: { index: false } };

export default async function TourPage() {
  const [stations, sessionData] = await Promise.all([getPublishedStations(), getSessionProgress()]);

  if (!sessionData) {
    redirect("/start");
  }

  const completedIds = new Set(
    sessionData.progress.filter((p) => p.status === "completed").map((p) => p.stationId)
  );

  if (isTourComplete(stations, completedIds)) {
    redirect("/complete");
  }

  return (
    <Screen
      contain={false}
      className="px-6 pt-[max(2.75rem,var(--safe-top))] pb-[max(2rem,var(--safe-bottom))] max-w-lg mx-auto w-full"
    >
      <TourView stations={stations} progress={sessionData.progress} session={sessionData.session} />
    </Screen>
  );
}
