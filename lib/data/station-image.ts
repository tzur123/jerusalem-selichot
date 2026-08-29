/**
 * Visual fallback imagery for stations that don't yet have their own uploaded
 * poster. Returns a local night-Jerusalem photo chosen deterministically by
 * the station's order, so each stop has a distinct but on-brand image in the
 * map popup and lists until a real poster is set in /admin.
 */
const FALLBACK_IMAGES = [
  "/backgrounds/bg-alley-1.png",
  "/backgrounds/bg-alley-3.png",
  "/backgrounds/bg-alley-2.png",
  "/backgrounds/bg-alley-4.png",
];

export function stationImage(orderIndex: number): string {
  const idx = Math.max(0, orderIndex - 1) % FALLBACK_IMAGES.length;
  return FALLBACK_IMAGES[idx];
}
