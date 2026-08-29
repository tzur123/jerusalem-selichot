import Image from "next/image";

const BACKGROUNDS = {
  /** Moonlit archway, silhouettes walking away — calm, generous empty space for UI. */
  moonlit: "/backgrounds/bg-alley-4.png",
  /** Pilgrims passing under a starlit arch — used for the landing hero. */
  gate: "/backgrounds/bg-alley-1.png",
  /** Grand torch-lit bridge and tower — used for the active navigation flow. */
  bridge: "/backgrounds/bg-alley-2.png",
  /** Framed archway looking deep into the old city — used for arrival moments. */
  archway: "/backgrounds/bg-alley-3.png",
} as const;

export type BackgroundVariant = keyof typeof BACKGROUNDS;

/**
 * Fixed, full-viewport night-Jerusalem backdrop rendered behind every screen.
 * Sits at z-[-1] so it never intercepts input; a dark gradient scrim plus a
 * light blur keep foreground glass panels legible on top of it.
 */
export function AppBackground({
  variant = "moonlit",
  intensity = "normal",
}: {
  variant?: BackgroundVariant;
  /** "normal" for visitor screens, "muted" for dense admin/content screens. */
  intensity?: "normal" | "muted";
}) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-navy" aria-hidden>
      <Image
        src={BACKGROUNDS[variant]}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-top scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-navy/55 via-navy/60 to-navy" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,transparent_0%,var(--color-navy)_85%)]" />
      {intensity === "muted" && <div className="absolute inset-0 bg-navy/55 backdrop-blur-[2px]" />}
      <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay [background-image:radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:3px_3px]" />
    </div>
  );
}
