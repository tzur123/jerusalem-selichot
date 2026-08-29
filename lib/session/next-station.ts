export type OrderedStation = { id: string; orderIndex: number };

/**
 * Pure "next station" wrap-around logic (CURSOR.md §6):
 * - published stations ordered by order_index
 * - start at the selected/just-completed station
 * - continue forward, wrapping around
 * - skip completed stations
 * - return null when every other station is already completed (tour done)
 */
export function computeNextStationId(
  stations: readonly OrderedStation[],
  currentStationId: string,
  completedStationIds: ReadonlySet<string>
): string | null {
  const sorted = [...stations].sort((a, b) => a.orderIndex - b.orderIndex);
  if (sorted.length === 0) return null;

  const currentIndex = sorted.findIndex((s) => s.id === currentStationId);
  const startIndex = currentIndex === -1 ? 0 : currentIndex;

  for (let step = 1; step <= sorted.length; step++) {
    const candidate = sorted[(startIndex + step) % sorted.length];
    if (candidate.id === currentStationId) continue;
    if (!completedStationIds.has(candidate.id)) {
      return candidate.id;
    }
  }

  return null;
}

/** True once every published station id is present in completedStationIds. */
export function isTourComplete(
  stations: readonly OrderedStation[],
  completedStationIds: ReadonlySet<string>
): boolean {
  return stations.length > 0 && stations.every((s) => completedStationIds.has(s.id));
}
