import { getStationBySlug } from "@/lib/data/stations";
import { isLocatable } from "@/types/station";
import { Screen } from "@/components/brand/Screen";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/Button";
import { Navigator } from "@/components/navigation/Navigator";

export default async function NavigatePage({
  params,
}: {
  params: Promise<{ stationSlug: string }>;
}) {
  const { stationSlug } = await params;
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

  return <Navigator station={station} />;
}
