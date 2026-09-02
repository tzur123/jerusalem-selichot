"use client";

import { useState } from "react";
import Link from "next/link";
import { BottomSheet } from "@/components/ui/BottomSheet";

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const LINKS: { href: string; label: string; external?: boolean }[] = [
  { href: "/info", label: "מידע כללי על הסיור" },
  { href: "/", label: "דף הבית" },
  { href: "/accessibility", label: "הצהרת נגישות" },
  { href: "/privacy", label: "מדיניות פרטיות" },
  { href: "tel:0522218206", label: "יצירת קשר (סיור קבוצתי)", external: true },
];

export function HamburgerMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="תפריט"
        title="תפריט"
        className={className}
      >
        <MenuIcon />
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="תפריט">
        <nav className="flex flex-col gap-1 -mx-2">
          {LINKS.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                className="flex items-center justify-between rounded-xl px-4 py-3.5 text-white/90 hover:bg-white/[0.06] transition-colors"
              >
                <span>{link.label}</span>
                <ChevronIcon />
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3.5 text-white/90 hover:bg-white/[0.06] transition-colors"
              >
                <span>{link.label}</span>
                <ChevronIcon />
              </Link>
            )
          )}
        </nav>

        <p className="mt-4 border-t border-white/10 pt-4 text-center text-xs text-muted">
          נבנה באהבה ע&quot;י{" "}
          <a
            href="https://stzur.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-white/80 underline underline-offset-4 hover:text-mint"
          >
            סטודיו צור
          </a>
        </p>
      </BottomSheet>
    </>
  );
}
