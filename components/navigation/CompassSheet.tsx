"use client";

import { BottomSheet } from "@/components/ui/BottomSheet";

const CARDINALS = [
  { deg: 0, label: "צ", primary: true },
  { deg: 45, label: "צ״מ" },
  { deg: 90, label: "מז" },
  { deg: 135, label: "ד״מ" },
  { deg: 180, label: "ד" },
  { deg: 225, label: "ד״מע" },
  { deg: 270, label: "מע" },
  { deg: 315, label: "צ״מע" },
];

const CARDINAL_NAMES = [
  "צפון",
  "צפון-מזרח",
  "מזרח",
  "דרום-מזרח",
  "דרום",
  "דרום-מערב",
  "מערב",
  "צפון-מערב",
];

const CENTER = 128;
const OUTER_R = 118;
const TICKS = Array.from({ length: 24 }, (_, i) => i * 15);

function polar(deg: number, r: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
}

function cardinalName(deg: number): string {
  const idx = Math.round(deg / 45) % 8;
  return CARDINAL_NAMES[(idx + 8) % 8];
}

/**
 * A live, rotating compass dial (like a real compass app) that opens when
 * the navigator's compass button is tapped — the dial rotates under a fixed
 * top pointer so whichever letter sits under the pointer is the direction
 * currently faced.
 */
export function CompassSheet({
  open,
  onClose,
  heading,
}: {
  open: boolean;
  onClose: () => void;
  heading: number | null;
}) {
  const rotation = heading ?? 0;

  return (
    <BottomSheet open={open} onClose={onClose} title="מצפן">
      <div dir="ltr" className="flex flex-col items-center gap-4 py-2">
        <div className="relative h-64 w-64">
          <svg viewBox="0 0 256 256" className="h-full w-full drop-shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
            <circle cx={CENTER} cy={CENTER} r={OUTER_R + 6} fill="rgba(0,27,51,0.55)" stroke="rgba(216,181,122,0.25)" strokeWidth={1.5} />
            <g
              style={{ transform: `rotate(${-rotation}deg)`, transformOrigin: `${CENTER}px ${CENTER}px` }}
              className="transition-transform duration-150 ease-linear"
            >
              {TICKS.map((deg) => {
                const isCardinal = deg % 90 === 0;
                const isMid = deg % 45 === 0;
                const inner = isCardinal ? 100 : isMid ? 106 : 111;
                const p1 = polar(deg, OUTER_R);
                const p2 = polar(deg, inner);
                return (
                  <line
                    key={deg}
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={isCardinal ? "#D8B57A" : isMid ? "rgba(216,181,122,0.55)" : "rgba(255,255,255,0.22)"}
                    strokeWidth={isCardinal ? 2.5 : 1.2}
                    strokeLinecap="round"
                  />
                );
              })}
              {CARDINALS.map(({ deg, label, primary }) => {
                const { x, y } = polar(deg, 84);
                return (
                  <text
                    key={deg}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={primary ? 20 : 13}
                    fontWeight={700}
                    fill={primary ? "#00F0A8" : "#F4E2B8"}
                    style={{ transform: `rotate(${rotation}deg)`, transformOrigin: `${x}px ${y}px` }}
                  >
                    {label}
                  </text>
                );
              })}
            </g>
            {/* Fixed pointer — always represents the direction currently faced. */}
            <polygon points={`${CENTER - 8},30 ${CENTER + 8},30 ${CENTER},10`} fill="#00F0A8" />
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-white tabular-nums">{Math.round(rotation)}°</span>
            <span className="text-sm font-semibold text-gold mt-1">{cardinalName(rotation)}</span>
          </div>
        </div>
        {heading == null && (
          <p className="text-sm text-muted text-center max-w-xs">
            עדיין אין נתוני מצפן מהמכשיר — נסו לסובב את הטלפון קלות. הניווט ימשיך לעבוד לפי המיקום גם בלעדיו.
          </p>
        )}
      </div>
    </BottomSheet>
  );
}
