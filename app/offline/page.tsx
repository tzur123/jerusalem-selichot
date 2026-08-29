import { Screen } from "@/components/brand/Screen";
import { ErrorState } from "@/components/ui/ErrorState";

export const metadata = { title: "אין חיבור לרשת", robots: { index: false } };

export default function OfflinePage() {
  return (
    <Screen className="justify-center">
      <ErrorState
        title="אין חיבור לאינטרנט"
        description="ניווט, מפות וסרטונים דורשים חיבור לרשת. ברגע שהחיבור יחזור, אפשר להמשיך בסיור בדיוק מאיפה שעצרתם."
      />
    </Screen>
  );
}
