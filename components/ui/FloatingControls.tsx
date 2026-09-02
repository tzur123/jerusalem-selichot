"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSound } from "@/lib/sound/SoundProvider";
import { HamburgerMenu } from "@/components/ui/HamburgerMenu";
import { cn } from "@/lib/utils/cn";
import { useTourElapsedMs } from "@/lib/tour/useTourElapsed";
import { formatClock } from "@/lib/utils/duration";

function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Screens that represent an in-progress tour, where the running clock is relevant.
 * The live navigation screen shows its own inline timer next to the map controls
 * instead (see NavigationTimerBadge), so it's excluded here to avoid a duplicate. */
function isOnActiveTourRoute(pathname: string): boolean {
  return pathname === "/tour" || pathname === "/scan" || pathname.startsWith("/station/");
}

function TimerBadge() {
  const elapsedMs = useTourElapsedMs(true);
  if (elapsedMs == null) return null;
  return (
    <div
      className="flex h-11 items-center gap-1.5 rounded-full glass-card px-3.5 text-[13px] font-bold text-gold tabular-nums"
      role="timer"
      aria-label={`הזמן שחלף בסיור: ${formatClock(elapsedMs)}`}
    >
      <ClockIcon />
      <span aria-hidden>{formatClock(elapsedMs)}</span>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      {/* Points right: in RTL, "back" (the previous step) reads as forward-right. */}
      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 3 3.6 5.1a1 1 0 0 0-.6.93V19.5a.5.5 0 0 0 .7.46L9 18l6 3 5.4-2.1a1 1 0 0 0 .6-.93V4.5a.5.5 0 0 0-.7-.46L15 6 9 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 3v15M15 6v15" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function SoundOnIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 9v6h4l5 4V5L8 9H4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M16.5 8.5a5 5 0 0 1 0 7M18.8 6a8 8 0 0 1 0 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function SoundOffIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 9v6h4l5 4V5L8 9H4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="m16 9 5 6M21 9l-5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const buttonClass =
  "flex h-11 w-11 items-center justify-center rounded-full glass-card text-white/90 hover:text-mint transition-colors";

/** Where the global back button should lead from a given route. `null` hides it (nothing to go back to). */
function getBackHref(pathname: string): string | null {
  if (pathname === "/") return null;
  if (pathname === "/start") return "/";
  if (pathname === "/tour") return "/start";
  if (pathname === "/scan") return "/tour";
  if (pathname === "/complete") return "/tour";
  if (pathname.startsWith("/station/")) return "/tour";
  if (pathname.startsWith("/route/")) return "/start";
  if (pathname.startsWith("/navigate/")) return "/tour";
  if (pathname.startsWith("/places/")) return "/info";
  if (pathname === "/offline") return "/";
  return "/";
}

export function FloatingControls() {
  const pathname = usePathname();
  const { muted, toggleMute } = useSound();

  // The admin panel has its own chrome; keep it clean.
  if (pathname.startsWith("/admin")) return null;

  // Only hide the "go to tour map" icon while already on that page — every
  // other screen, including the immersive navigation view, should still
  // offer a quick way back to the map.
  const hideMap = pathname === "/tour";
  const backHref = getBackHref(pathname);
  const isLanding = pathname === "/";

  return (
    <>
      {/* Municipality logo: large on the landing hero, small everywhere else —
          always the same top-left fixture, flush against the top edge, and
          always a link back home. */}
      <Link
        href="/"
        aria-label="למעבר לדף הבית"
        className={cn(
          "fixed top-0 left-0 z-40 block",
          !isLanding && "pt-[var(--safe-top)] ps-3"
        )}
      >
        <Image
          src="/brand/jer-logo.png"
          alt="עיריית ירושלים — ירושלים, אין כמוה בעולם"
          width={753}
          height={400}
          priority={isLanding}
          className={cn("h-auto", isLanding ? "w-[140px]" : "w-[112px] md:w-[168px]")}
        />
      </Link>

      {/* Icon cluster: always the same top-right position and order on every
          page — back (when there's somewhere to go back to) leads, then the
          menu, then the rest. */}
      <div className="fixed top-0 right-0 z-40 flex items-center gap-2 px-3 pb-3 pt-[max(0.75rem,var(--safe-top))]">
        {backHref && (
          <Link href={backHref} aria-label="חזרה" title="חזרה" className={buttonClass}>
            <BackIcon />
          </Link>
        )}
        <HamburgerMenu className={buttonClass} />
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? "הפעלת צלילים" : "השתקת צלילים"}
          aria-pressed={muted}
          title={muted ? "הפעלת צלילים" : "השתקה"}
          className={cn(buttonClass, muted && "text-muted")}
        >
          {muted ? <SoundOffIcon /> : <SoundOnIcon />}
        </button>
        {!hideMap && (
          <Link href="/tour" aria-label="חזרה למפת הסיור" title="מפת הסיור" className={buttonClass}>
            <MapIcon />
          </Link>
        )}
        {isOnActiveTourRoute(pathname) && <TimerBadge />}
      </div>
    </>
  );
}
