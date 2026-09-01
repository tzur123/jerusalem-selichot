"use client";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { cn } from "@/lib/utils/cn";
import { directionRotationDeg } from "@/lib/navigation/direction-icon";

type DirectionStep = { instruction: string; distanceMeters: number; maneuver: string };

function formatMeters(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} מ׳`;
  return `${(meters / 1000).toFixed(1)} ק"מ`;
}

export function DirectionsListSheet({
  open,
  onClose,
  steps,
  currentStepIndex,
}: {
  open: boolean;
  onClose: () => void;
  steps: DirectionStep[];
  currentStepIndex: number;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title="הוראות ניווט">
      <div className="flex max-h-[55vh] flex-col gap-2 overflow-y-auto">
        {steps.map((step, i) => {
          const isCurrent = i === currentStepIndex;
          const isDone = i < currentStepIndex;
          return (
            <div
              key={i}
              className={cn(
                "flex items-start gap-3 rounded-2xl border p-3 transition-colors",
                isCurrent ? "bg-mint/10 border-mint/50" : "border-white/10",
                isDone && !isCurrent && "opacity-50"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg",
                  isCurrent ? "bg-mint/20 text-mint" : "bg-white/5 text-white/70"
                )}
                aria-hidden
              >
                <span
                  className="inline-block"
                  style={{ transform: `rotate(${directionRotationDeg(step.maneuver, step.instruction)}deg)` }}
                >
                  ↑
                </span>
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold text-white leading-snug">{step.instruction}</p>
                <p className={cn("text-xs font-semibold mt-0.5", isCurrent ? "text-mint" : "text-muted")}>
                  {formatMeters(step.distanceMeters)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </BottomSheet>
  );
}
