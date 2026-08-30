"use client";

import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

function CloseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function BottomSheet({
  open,
  onClose,
  children,
  title,
  className,
  headerImage,
}: {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
  /** Optional full-bleed image filling the sheet from its very top, rounded to match the sheet corners. */
  headerImage?: ReactNode;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef<{ startY: number; height: number } | null>(null);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) return;
    queueMicrotask(() => setDragY(0));
  }, [open]);

  function handleDragStart(e: ReactPointerEvent<HTMLDivElement>) {
    if (!onClose) return;
    dragInfo.current = { startY: e.clientY, height: sheetRef.current?.offsetHeight ?? 400 };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleDragMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragInfo.current) return;
    setDragY(Math.max(0, e.clientY - dragInfo.current.startY));
  }

  function handleDragEnd() {
    if (!dragInfo.current) return;
    const { height } = dragInfo.current;
    dragInfo.current = null;
    setDragging(false);
    if (dragY > 110 || dragY > height * 0.22) onClose?.();
    setDragY(0);
  }

  const dragHandle = (
    <div
      className={cn(
        "touch-none",
        headerImage ? "absolute inset-x-0 top-0 flex justify-center pt-3 pb-6" : "-mx-6 -mt-4 px-6 pt-4 pb-2"
      )}
      style={{ cursor: onClose ? "grab" : undefined }}
      onPointerDown={handleDragStart}
      onPointerMove={handleDragMove}
      onPointerUp={handleDragEnd}
      onPointerCancel={handleDragEnd}
    >
      <div
        className={cn("mx-auto h-1.5 w-12 rounded-full shadow-sm", headerImage ? "bg-white/70" : "bg-gold/30")}
        aria-hidden
      />
    </div>
  );

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
          "fixed inset-x-0 bottom-0 z-50 ease-out",
          dragging ? "" : "transition-transform duration-300",
          open ? "translate-y-0" : "translate-y-full pointer-events-none"
        )}
        style={dragY ? { transform: `translateY(${dragY}px)` } : undefined}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div
          ref={sheetRef}
          className={cn(
            "relative mx-auto max-w-lg rounded-t-3xl glass-panel overflow-hidden pb-[max(2rem,var(--safe-bottom))]",
            !headerImage && "px-6 pt-4",
            className
          )}
        >
          {headerImage}
          {dragHandle}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="סגירה"
              className="absolute top-4 end-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-navy/50 text-white/80 hover:text-white transition-colors"
            >
              <CloseIcon />
            </button>
          )}
          <div className={cn(headerImage && "px-6 pt-4")}>
            {title && <h2 className={cn("text-xl font-bold mb-2 font-heading", onClose && "pe-10")}>{title}</h2>}
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
