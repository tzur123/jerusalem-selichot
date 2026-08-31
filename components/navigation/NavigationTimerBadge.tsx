"use client";

import { formatClock } from "@/lib/utils/duration";
import { useTourElapsedMs } from "@/lib/tour/useTourElapsed";

function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Live tour timer shown inline next to the recenter/compass buttons on the
 * active navigation screen, instead of the usual top-of-screen pill. */
export function NavigationTimerBadge() {
  const elapsedMs = useTourElapsedMs(true);

  if (elapsedMs == null) return null;

  return (
    <div
      className="flex h-12 items-center gap-1.5 rounded-full glass-card px-3.5 text-sm font-bold text-gold tabular-nums"
      role="timer"
      aria-label={`הזמן שחלף בסיור: ${formatClock(elapsedMs)}`}
    >
      <ClockIcon />
      <span aria-hidden>{formatClock(elapsedMs)}</span>
    </div>
  );
}
