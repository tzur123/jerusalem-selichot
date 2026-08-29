import { Card, CardTitle, CardSubtitle } from "@/components/ui/Card";
import type { LocatableStation } from "@/types/station";
import { cn } from "@/lib/utils/cn";

/** Shown when Google Maps isn't configured or fails to load — never a dead end. */
export function StationListFallback({
  stations,
  onSelectStation,
  className,
}: {
  stations: LocatableStation[];
  onSelectStation?: (station: LocatableStation) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <p className="text-sm text-muted">
        המפה האינטראקטיבית אינה זמינה כרגע. אפשר לבחור תחנה מהרשימה:
      </p>
      {stations.map((station) => (
        <button
          key={station.id}
          type="button"
          onClick={() => onSelectStation?.(station)}
          disabled={!onSelectStation}
          className="text-right disabled:cursor-default"
        >
          <Card className="flex items-center gap-3 py-3 hover:border-mint/60 transition-colors">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint/15 text-mint font-black">
              {station.orderIndex}
            </span>
            <div>
              <CardTitle className="text-base">{station.name}</CardTitle>
              {station.address && <CardSubtitle className="text-xs">{station.address}</CardSubtitle>}
            </div>
          </Card>
        </button>
      ))}
    </div>
  );
}
