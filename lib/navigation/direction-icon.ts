/**
 * Turns a Google Directions `maneuver` (e.g. "turn-left",
 * "turn-slight-right", "roundabout-left") into a rotation angle for a single
 * up-pointing arrow glyph, so the icon actually points the way the
 * instruction goes (left/right/straight) — like Waze/Google Maps — instead
 * of a single fixed glyph for every step.
 *
 * Falls back to reading the (already-localized) instruction text when
 * Google doesn't supply a maneuver, which happens for the first "depart"
 * step and some plain "continue on X" steps.
 */
export function directionRotationDeg(maneuver: string, instruction: string): number {
  const m = maneuver.toLowerCase();

  if (m.includes("sharp-left")) return -135;
  if (m.includes("sharp-right")) return 135;
  if (m.includes("slight-left")) return -30;
  if (m.includes("slight-right")) return 30;
  if (m.includes("uturn")) return 180;
  if (m.includes("left")) return -90;
  if (m.includes("right")) return 90;
  if (m.includes("straight") || m === "merge" || m === "ferry" || m === "ferry-train") return 0;

  // No maneuver hint (e.g. the very first "depart" step) — infer from the
  // localized instruction text instead.
  const text = instruction.trim();
  if (/ימינה/.test(text)) return 90;
  if (/שמאלה/.test(text)) return -90;
  return 0;
}
