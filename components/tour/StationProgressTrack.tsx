import Image from "next/image";
import type { Station } from "@/types/station";
import type { ProgressStatus } from "@/lib/supabase/types";
import { getStationPublicMediaUrl } from "@/lib/media/public-url";
import { stationImage } from "@/lib/data/station-image";
import { cn } from "@/lib/utils/cn";

/** Compact labels for stations whose full name is too long for the avatar row. */
const SHORT_LABELS: Record<string, string> = {
  "בית הכנסת החורבה": "החורבה",
};

function trackLabel(name: string): string {
  return SHORT_LABELS[name] ?? name;
}

/**
 * Visual "trail" of the tour: a row of station avatars connected by a fill
 * line, à la a stepper. Completed stations light up with their real photo,
 * the current one glows with a soft "you are here" pulse, and the fill line
 * has a slow shimmer running through it — station names always stay fully
 * legible (no dimming), only the avatar itself signals what's left.
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
          className="absolute right-0 top-6 h-0.5 -translate-y-1/2 overflow-hidden rounded-full bg-mint transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
          aria-hidden
        >
          {pct > 0 && <div className="track-shimmer absolute inset-0" />}
        </div>
        {/* Small end-cap dots so the line always reads as a designed track,
            even before any station is completed. */}
        <span
          className="absolute right-0 top-6 h-2 w-2 -translate-y-1/2 translate-x-1/2 rounded-full bg-gold shadow-[0_0_8px_-1px_rgba(232,200,135,0.9)] ring-2 ring-navy"
          aria-hidden
        />
        <span
          className={cn(
            "absolute left-0 top-6 h-2 w-2 -translate-y-1/2 -translate-x-1/2 rounded-full ring-2 ring-navy transition-colors duration-500",
            pct >= 100 ? "bg-mint shadow-[0_0_8px_-1px_rgba(0,240,168,0.9)]" : "bg-white/25"
          )}
          aria-hidden
        />

        {ordered.map((station) => {
          const status = statusMap.get(station.id) ?? "pending";
          const isCompleted = status === "completed";
          const isActive = status === "arrived" || status === "unlocked" || status === "watching";

          return (
            <div key={station.id} className="relative flex flex-1 flex-col items-center gap-1.5 px-0.5">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                {isActive && (
                  <span className="track-active-ring absolute inset-[-5px] rounded-full border-2 border-gold/70" aria-hidden />
                )}
                <div
                  className={cn(
                    "relative z-10 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-navy transition-all duration-500",
                    isCompleted
                      ? "border-mint shadow-[0_0_14px_-2px_rgba(0,240,168,0.7)] scale-100"
                      : isActive
                        ? "border-gold shadow-[0_0_16px_-2px_rgba(232,200,135,0.6)]"
                        : "border-white/15 opacity-60"
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
                    <span className={cn("text-sm font-bold", isActive ? "text-gold" : "text-white/60")}>
                      {station.orderIndex}
                    </span>
                  )}
                </div>
              </div>
              <span
                className={cn(
                  "line-clamp-2 text-center text-[10px] leading-tight text-white",
                  isCompleted ? "font-semibold" : isActive ? "font-semibold text-gold" : "font-medium"
                )}
              >
                {trackLabel(station.name)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
