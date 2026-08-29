"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { cn } from "@/lib/utils/cn";

export function BottomSheet({
  open,
  onClose,
  children,
  title,
  className,
}: {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 glass-scrim transition-opacity duration-300 ease-out",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        aria-hidden
        onClick={onClose}
      />
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-out",
          open ? "translate-y-0" : "translate-y-full pointer-events-none"
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div
          className={cn(
            "relative mx-auto max-w-lg rounded-t-3xl glass-panel safe-bottom px-6 pt-4 pb-8",
            className
          )}
        >
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gold/30" aria-hidden />
          {title && <h2 className="text-xl font-bold mb-2 font-heading">{title}</h2>}
          {children}
        </div>
      </div>
    </>
  );
}
