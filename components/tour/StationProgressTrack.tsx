import Image from "next/image";
import type { Station } from "@/types/station";
import type { ProgressStatus } from "@/lib/supabase/types";
import { getStationPublicMediaUrl } from "@/lib/media/public-url";
import { stationImage } from "@/lib/data/station-image";
import { cn } from "@/lib/utils/cn";

/**
 * Visual "trail" of the tour: a row of station avatars connected by a fill
 * line, à la a stepper. Completed stations light up with their real photo;
 * everything else stays a plain, dimmed number so it's obvious what's left.
 */
export function StationProgressTrack({
  stations,
  statusMap,
  className,
  label,
}: {
  stations: Station[];
  statusMap: Map<string, ProgressStatus>;
  className?: string;
  label?: string;
}) {
  const ordered = [...stations].sort((a, b) => a.orderIndex - b.orderIndex);
  const completedCount = ordered.filter((s) => statusMap.get(s.id) === "completed").length;
  const pct = ordered.length > 0 ? Math.min(100, Math.round((completedCount / ordered.length) * 100)) : 0;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-white">{label ?? "התקדמות בסיור"}</span>
        <span className="text-sm font-bold text-mint" aria-hidden>
          {completedCount}/{ordered.length}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={completedCount}
        aria-valuemin={0}
        aria-valuemax={ordered.length}
        aria-label={label ?? "התקדמות בסיור"}
        className="relative flex items-start justify-between"
      >
        <div className="absolute right-0 left-0 top-6 h-0.5 -translate-y-1/2 rounded-full bg-white/10" aria-hidden />
        <div
          className="absolute right-0 top-6 h-0.5 -translate-y-1/2 rounded-full bg-mint transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
          aria-hidden
        />

        {ordered.map((station) => {
          const status = statusMap.get(station.id) ?? "pending";
          const isCompleted = status === "completed";
          const isActive = status === "arrived" || status === "unlocked" || status === "watching";

          return (
            <div key={station.id} className="relative flex flex-1 flex-col items-center gap-1.5 px-0.5">
              <div
                className={cn(
                  "relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-navy transition-all duration-300",
                  isCompleted
                    ? "border-mint shadow-[0_0_14px_-2px_rgba(0,240,168,0.7)]"
                    : isActive
                      ? "border-gold opacity-90"
                      : "border-white/15 opacity-40"
                )}
              >
                {isCompleted ? (
                  <>
                    <Image
                      src={getStationPublicMediaUrl(station.heroImagePath) ?? stationImage(station.orderIndex)}
                      alt={station.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-navy/30 text-sm font-bold text-mint">
                      ✓
                    </span>
                  </>
                ) : (
                  <span className={cn("text-sm font-bold", isActive ? "text-gold" : "text-white/50")}>
                    {station.orderIndex}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "line-clamp-2 text-center text-[10px] leading-tight",
                  isCompleted ? "font-semibold text-white" : isActive ? "text-gold/90" : "text-white/35"
                )}
              >
                {station.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
