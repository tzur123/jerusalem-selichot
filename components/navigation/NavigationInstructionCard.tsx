import { Card } from "@/components/ui/Card";
import { directionRotationDeg } from "@/lib/navigation/direction-icon";

export function NavigationInstructionCard({
  instruction,
  distanceToNextMeters,
  maneuver = "",
  onClick,
}: {
  instruction: string;
  distanceToNextMeters: number;
  /** Google's maneuver hint for this step — drives which way the arrow points. */
  maneuver?: string;
  /** Opens the full turn-by-turn directions list when provided. */
  onClick?: () => void;
}) {
  const content = (
    <Card className="mint-glow flex items-center gap-3 py-4" role="status" aria-live="polite">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-mint/15 text-2xl" aria-hidden>
        <span
          className="inline-block"
          style={{ transform: `rotate(${directionRotationDeg(maneuver, instruction)}deg)` }}
        >
          ↑
        </span>
      </span>
      <div>
        <p className="font-bold text-white leading-snug">{instruction}</p>
        <p className="text-sm text-mint font-semibold">
          בעוד {Math.max(0, Math.round(distanceToNextMeters))} מ׳
        </p>
      </div>
    </Card>
  );

  if (!onClick) return content;

  return (
    <button type="button" onClick={onClick} className="w-full text-start" aria-label="הצגת כל הוראות הניווט">
      {content}
    </button>
  );
}
