import { cn } from "@/lib/utils/cn";

function WalkingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden className="shrink-0">
      <circle cx="12" cy="4.5" r="2" fill="currentColor" stroke="none" />
      <path d="M12 7v6" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 10 8 12" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 10 16 9" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 13 9 20" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 13 15 19" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function formatEta(seconds: number): string {
  const minutes = Math.max(0, Math.round(seconds / 60));
  return minutes <= 1 ? "פחות מדקה" : `${minutes} דק'`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} מ׳`;
  return `${(meters / 1000).toFixed(1)} ק"מ`;
}

export function RouteProgress({
  remainingMeters,
  etaSeconds,
  className,
}: {
  remainingMeters: number;
  etaSeconds: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between glass-card rounded-2xl px-4 py-3", className)}>
      <div className="text-center">
        <p className="text-xs text-muted">מרחק שנותר</p>
        <p className="font-bold">{formatDistance(remainingMeters)}</p>
      </div>
      <div className="h-8 w-px bg-white/10" aria-hidden />
      <div className="text-center">
        <p className="text-xs text-muted">זמן משוער</p>
        <p className="flex items-center justify-center gap-1.5 font-bold">
          <WalkingIcon />
          {formatEta(etaSeconds)}
        </p>
      </div>
    </div>
  );
}
