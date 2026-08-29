import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";

export function ArrivalSheet({
  open,
  stationName,
  onScan,
}: {
  open: boolean;
  stationName: string;
  onScan: () => void;
}) {
  return (
    <BottomSheet open={open} title="הגעתם לתחנה! 🎉">
      <p className="text-muted mb-4">
        חפשו את קוד ה-QR הפיזי ליד <strong className="text-white">{stationName}</strong> וסרקו אותו כדי
        לפתוח את התחנה.
      </p>
      <Button onClick={onScan} fullWidth size="lg">
        סריקת QR
      </Button>
    </BottomSheet>
  );
}
