"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useAccessibility, FONT_STEPS, type A11yToggleKey } from "@/lib/accessibility/AccessibilityContext";

function A11yIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="11" fill="currentColor" opacity="0.14" />
      <circle cx="12" cy="6.4" r="1.9" fill="currentColor" />
      <path
        d="M12 9c-1 0-1.9.55-2.35 1.45L7.9 14h2.1l1-2v3l-2.4 5.6a1 1 0 0 0 1.85.78L12 17l1.55 4.38a1 1 0 0 0 1.85-.78L13 15v-3l1 2h2.1l-1.75-3.55A2.7 2.7 0 0 0 12 9Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const TOGGLES: { key: A11yToggleKey; label: string; hint: string }[] = [
  { key: "highContrast", label: "ניגודיות גבוהה", hint: "רקע שחור וטקסט בניגודיות מרבית" },
  { key: "underlineLinks", label: "קו תחתון לקישורים", hint: "מסמן קישורים גם בלי צבע" },
  { key: "readableFont", label: "גופן קריא", hint: "מחליף לגופן פשוט וברור" },
  { key: "textSpacing", label: "ריווח טקסט מוגבר", hint: "רווח שורות ואותיות גדול יותר" },
  { key: "grayscale", label: "גווני אפור", hint: "מסיר צבעים מהעמוד" },
  { key: "reduceMotion", label: "עצירת אנימציות", hint: "מבטל תנועה ומעברים" },
  { key: "bigCursor", label: "סמן עכבר מוגדל", hint: "סמן גדול וברור יותר" },
  { key: "strongFocus", label: "הדגשת פוקוס למקלדת", hint: "מסגרת בולטת סביב האלמנט הפעיל" },
];

export function AccessibilityWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { settings, fontStepCount, increaseFont, decreaseFont, toggle, reset } = useAccessibility();

  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <div className="fixed z-40 top-1/2 -translate-y-1/2 left-0">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="a11y-panel"
          aria-label="אפשרויות נגישות"
          title="נגישות"
          className="flex h-[38px] w-[38px] items-center justify-center rounded-e-full glass-card text-white/90 hover:text-mint transition-colors border-s-0"
        >
          <A11yIcon />
        </button>
      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="אפשרויות נגישות">
        <div id="a11y-panel" className="flex flex-col gap-5 pb-2">
          <div className="glass-card rounded-2xl p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold">גודל טקסט</p>
              <p className="text-xs text-muted mt-0.5">שלב {settings.fontStep + 1} מתוך {fontStepCount}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={decreaseFont}
                disabled={settings.fontStep === 0}
                aria-label="הקטנת טקסט"
                className="flex h-10 w-10 items-center justify-center rounded-full glass-button border border-gold/30 text-lg font-bold disabled:opacity-40"
              >
                א−
              </button>
              <button
                type="button"
                onClick={increaseFont}
                disabled={settings.fontStep === FONT_STEPS.length - 1}
                aria-label="הגדלת טקסט"
                className="flex h-10 w-10 items-center justify-center rounded-full glass-button border border-gold/30 text-lg font-bold disabled:opacity-40"
              >
                א+
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {TOGGLES.map(({ key, label, hint }) => {
              const active = settings[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggle(key)}
                  aria-pressed={active}
                  className={cn(
                    "text-right rounded-2xl p-3 flex flex-col gap-1 border transition-colors",
                    active ? "bg-mint/15 border-mint/60" : "glass-button border-white/15"
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold">{label}</span>
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                        active ? "bg-mint text-navy border-mint" : "border-white/25 text-transparent"
                      )}
                    >
                      <CheckIcon />
                    </span>
                  </span>
                  <span className="text-xs text-muted leading-snug">{hint}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={reset}
              className="w-full text-center text-sm rounded-2xl glass-button border border-white/15 py-2.5 hover:border-white/30 transition-colors"
            >
              איפוס כל ההגדרות
            </button>
            <Link
              href="/accessibility"
              onClick={() => setOpen(false)}
              className="w-full text-center text-xs text-muted underline underline-offset-4 py-1"
            >
              הצהרת נגישות
            </Link>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
