import { Screen } from "@/components/brand/Screen";
import { getPublishedStations } from "@/lib/data/stations";
import { StartFlow } from "@/components/start/StartFlow";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "מאיפה מתחילים?" };

export default async function StartPage() {
  const stations = await getPublishedStations();

  if (stations.length === 0) {
    return (
      <Screen>
        <ErrorState
          title="אין עדיין תחנות פעילות"
          description="בעל המוצר טרם פרסם תחנות בסיור. נסו לחזור מאוחר יותר."
          secondaryAction={
            <Button href="/" variant="secondary" fullWidth>
              חזרה לדף הבית
            </Button>
          }
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <StartFlow stations={stations} />
    </Screen>
  );
}
