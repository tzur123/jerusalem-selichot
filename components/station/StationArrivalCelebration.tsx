"use client";

import { useState } from "react";
import { Confetti } from "@/components/ui/Confetti";
import { Button } from "@/components/ui/Button";

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      {/* Points left: in RTL, "forward/continue" reads toward the left. */}
      <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BigArrowIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M17 7 7 17M7 17v-8M7 17h8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Full-screen celebratory overlay shown once, the moment a visitor scans a
 * station's QR code and its content unlocks. Confetti + a clear "arrived"
 * badge + a CTA to continue into the station's content.
 */
export function StationArrivalCelebration({
  stationName,
  isFinalStation = false,
}: {
  stationName: string;
  isFinalStation?: boolean;
}) {
  const [open, setOpen] = useState(true);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 glass-scrim">
      <Confetti />
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-5 rounded-3xl glass-panel gold-glow px-8 py-10 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-mint/15 text-mint ring-2 ring-mint/50">
          <BigArrowIcon />
        </span>
        <div>
          <p className="text-xs font-bold tracking-wide text-gold uppercase">יעד הושלם</p>
          <h2 className="mt-1 font-heading text-2xl font-bold text-white">הגעתם אל {stationName}!</h2>
          <p className="mt-2 text-sm text-muted">
            {isFinalStation ? "סרקתם את קוד ה-QR האחרון בדרך — כמעט סיימתם." : "התחנה נפתחה בהצלחה. בואו נמשיך."}
          </p>
        </div>
        <Button onClick={() => setOpen(false)} size="lg" fullWidth>
          בואו נמשיך
          <ArrowIcon />
        </Button>
      </div>
    </div>
  );
}
