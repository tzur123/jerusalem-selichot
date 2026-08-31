"use client";

import { usePathname } from "next/navigation";
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

/** Screens that represent an in-progress tour, where the running clock is relevant.
 * The live navigation screen shows its own inline timer next to the map controls
 * instead (see NavigationTimerBadge), so it's excluded here to avoid a duplicate. */
function isOnActiveTourRoute(pathname: string): boolean {
  return pathname === "/tour" || pathname === "/scan" || pathname.startsWith("/station/");
}

/**
 * Small floating pill that ticks up the elapsed time since the visitor's tour
 * session started.
 */
export function TourTimer() {
  const pathname = usePathname();
  const active = isOnActiveTourRoute(pathname);
  const elapsedMs = useTourElapsedMs(active);

  if (elapsedMs == null) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-30 flex justify-center pointer-events-none pt-[max(0.75rem,var(--safe-top))]">
      <div
        className="glass-card pointer-events-auto flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-bold text-gold tabular-nums"
        role="timer"
        aria-label={`הזמן שחלף בסיור: ${formatClock(elapsedMs)}`}
      >
        <ClockIcon />
        <span aria-hidden>{formatClock(elapsedMs)}</span>
      </div>
    </div>
  );
}
