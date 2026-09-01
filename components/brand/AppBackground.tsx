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

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-navy a11y-hide-in-contrast" aria-hidden>
      {wideSrc ? (
        <>
          {/* Portrait crop: phones/tablets held upright (viewport taller than wide). */}
          <Image
            src={BACKGROUNDS[resolvedVariant]}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-top scale-105 landscape:hidden"
          />
          {/* Wide 16:9 crop: desktop, and any device wider than it is tall
              (tablet/phone landscape) — orientation media query, not a width
              breakpoint, so it also catches landscape phones at small widths. */}
          <Image
            src={wideSrc}
            alt=""
            fill
            priority
            sizes="100vw"
            className="hidden object-cover object-top scale-105 landscape:block"
          />
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
