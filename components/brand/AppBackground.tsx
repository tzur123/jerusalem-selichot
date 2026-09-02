"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

const BACKGROUNDS = {
  /** Moonlit archway, silhouettes walking away — calm, generous empty space for UI. */
  moonlit: "/backgrounds/bg-alley-4.png",
  /** Illuminated old-city gate at night, lens-flare glow — used for the landing hero. */
  gate: "/backgrounds/bg-gate-hero.png",
  /** The Tower of David citadel lit up at night — used for the start-flow screen. */
  citadel: "/backgrounds/bg-citadel-hero.png",
  /** Grand torch-lit bridge and tower — used for the active navigation flow. */
  bridge: "/backgrounds/bg-alley-2.png",
  /** Framed archway looking deep into the old city — used for arrival moments. */
  archway: "/backgrounds/bg-alley-3.png",
} as const;

/**
 * Wide (16:9) alternates of the two hero photos, framed for desktop/tablet
 * and landscape phones — the portrait originals above are cropped too
 * tightly once the viewport gets wider than it is tall.
 */
const WIDE_BACKGROUNDS: Partial<Record<BackgroundVariant, string>> = {
  gate: "/backgrounds/bg-gate-hero-wide.png",
  citadel: "/backgrounds/bg-citadel-hero-wide.png",
};

/**
 * Looping ambient clip shown instead of the static photo on phones — desktop,
 * tablets and landscape phones keep the (much cheaper) still image. Only the
 * landing page has one so far.
 */
const MOBILE_VIDEO_BACKGROUNDS: Partial<Record<BackgroundVariant, string>> = {
  gate: "/backgrounds/hero-mobile-video.mp4",
};

/**
 * Same idea as {@link MOBILE_VIDEO_BACKGROUNDS}, but for desktop/tablet
 * landscape — shown instead of the wide still photo there. Phones in
 * landscape keep the still image; only `md:` and up gets the (heavier) clip.
 */
const DESKTOP_VIDEO_BACKGROUNDS: Partial<
  Record<BackgroundVariant, { webm: string; mp4: string }>
> = {
  gate: { webm: "/backgrounds/hero-desktop-video.webm", mp4: "/backgrounds/hero-desktop-video.mp4" },
};

export type BackgroundVariant = keyof typeof BACKGROUNDS;

/**
 * Fixed, full-viewport night-Jerusalem backdrop rendered behind every screen.
 * Sits at z-[-1] so it never intercepts input; a dark gradient scrim plus a
 * light blur keep foreground glass panels legible on top of it. The landing
 * and start pages show their hero photo untouched instead; every other
 * route falls back to the default scrim treatment.
 */
export function AppBackground({
  variant,
  intensity = "normal",
}: {
  variant?: BackgroundVariant;
  /** "normal" for visitor screens, "muted" for dense admin/content screens. */
  intensity?: "normal" | "muted";
}) {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const isStart = pathname === "/start";
  const showPhotoPlain = isLanding || isStart;
  const resolvedVariant = variant ?? (isLanding ? "gate" : isStart ? "citadel" : "moonlit");
  const wideSrc = WIDE_BACKGROUNDS[resolvedVariant];
  const mobileVideoSrc = MOBILE_VIDEO_BACKGROUNDS[resolvedVariant];
  const desktopVideoSrc = DESKTOP_VIDEO_BACKGROUNDS[resolvedVariant];

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-navy a11y-hide-in-contrast" aria-hidden>
      {wideSrc ? (
        <>
          {/* Portrait crop: phones/tablets held upright (viewport taller than wide).
              Also doubles as the poster/fallback behind the phone video below. */}
          <Image
            src={BACKGROUNDS[resolvedVariant]}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-top scale-105 landscape:hidden"
          />
          {/* Looping video, phones only (md: and up, and landscape, keep the
              still image — cheaper, and desktop/tablet don't need the motion). */}
          {mobileVideoSrc && (
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster={BACKGROUNDS[resolvedVariant]}
              className="app-bg-video absolute inset-0 h-full w-full object-cover object-top scale-105 landscape:hidden md:hidden"
            >
              <source src={mobileVideoSrc} type="video/mp4" />
            </video>
          )}
          {/* Wide 16:9 crop: any device wider than it is tall (tablet/phone
              landscape included) — orientation media query, not a width
              breakpoint. Also doubles as the poster/fallback behind the
              desktop video below once the viewport reaches `md:`. */}
          <Image
            src={wideSrc}
            alt=""
            fill
            priority
            quality={90}
            sizes="100vw"
            className="hidden object-cover object-top scale-105 landscape:block"
          />
          {/* Looping clip, desktop/tablet landscape only (`md:` and up) —
              phones in landscape keep the lighter still image above. */}
          {desktopVideoSrc && (
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster={wideSrc}
              className="app-bg-video absolute inset-0 hidden h-full w-full object-cover object-center md:landscape:block"
            >
              <source src={desktopVideoSrc.webm} type="video/webm" />
              <source src={desktopVideoSrc.mp4} type="video/mp4" />
            </video>
          )}
        </>
      ) : (
        <Image
          src={BACKGROUNDS[resolvedVariant]}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-top scale-105"
        />
      )}
      {/* The landing and start pages show their hero photo untouched — no scrim/grain on top. */}
      {!showPhotoPlain && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-navy/55 via-navy/60 to-navy" />
          <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,transparent_0%,var(--color-navy)_85%)]" />
          {intensity === "muted" && <div className="absolute inset-0 bg-navy/55 backdrop-blur-[2px]" />}
          <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay [background-image:radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:3px_3px]" />
        </>
      )}
    </div>
  );
}
