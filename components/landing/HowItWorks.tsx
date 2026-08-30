"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/Card";

const STEPS = [
  { title: "בוחרים נקודת התחלה", body: "הכי קרוב אליי, או המסלול המומלץ מבית הרב קוק." },
  { title: "מנווטים ברגל בתוך האתר", body: "מפה חיה, חץ כיוון והוראות צעד־אחר־צעד עד לתחנה." },
  { title: "סורקים QR בתחנה", body: "מחפשים את קוד ה־QR הפיזי במקום וסורקים כדי לפתוח אותה." },
  { title: "צופים וממשיכים", body: "סרטון קצר על התחנה, ואז יוצאים לתחנה הבאה — עד 5/5." },
];

/** Trigger + luxurious blurred bottom-sheet explaining the tour flow in steps. */
export function HowItWorks() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-center text-sm text-muted underline underline-offset-4"
      >
        איך זה עובד?
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="איך זה עובד">
        <div className="grid gap-3">
          {STEPS.map((step, i) => (
            <Card key={step.title} className="flex items-start gap-3 py-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold font-stencil ring-1 ring-gold/30">
                {i + 1}
              </span>
              <div>
                <CardTitle className="text-base">{step.title}</CardTitle>
                <CardSubtitle className="text-xs">{step.body}</CardSubtitle>
              </div>
            </Card>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}
