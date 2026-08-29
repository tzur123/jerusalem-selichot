import { cn } from "@/lib/utils/cn";

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
        <p className="font-bold">{formatEta(etaSeconds)}</p>
      </div>
    </div>
  );
}
