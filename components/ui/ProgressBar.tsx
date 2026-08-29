import { cn } from "@/lib/utils/cn";

export function ProgressBar({
  completed,
  total,
  className,
  label,
}: {
  completed: number;
  total: number;
  className?: string;
  label?: string;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-white">{label ?? "התקדמות בסיור"}</span>
        <span className="text-sm font-bold text-mint" aria-hidden>
          {completed}/{total}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={completed}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={label ?? "התקדמות בסיור"}
        className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden"
      >
        <div
          className="h-full rounded-full bg-mint transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
