import "server-only";
import type { Station } from "@/types/station";
import type { StationProgress, TourSession } from "@/types/session";
import type { ProgressStatus } from "@/lib/supabase/types";
import { SEED_STATIONS } from "./seed-stations";

/**
 * In-memory backend used only when Supabase is not configured
 * (`env.useMockBackend === true`). This lets the full product flow — start,
 * navigate, scan, watch, complete, and the admin panel — run end-to-end on
 * a local machine with zero external services.
 *
 * State resets when the dev server restarts. It is stored on `globalThis`
 * so it survives Next.js's module hot-reloading in development.
 */

type MockQrCode = {
  id: string;
  stationId: string;
  token: string; // stored in cleartext in mock mode only, for local dev convenience
  isActive: boolean;
  createdAt: string;
  revokedAt: string | null;
};

type MockAnalyticsEvent = {
  id: number;
  sessionId: string | null;
  eventName: string;
  stationId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

type MockStore = {
  stations: Map<string, Station>;
  qrCodes: Map<string, MockQrCode>; // keyed by token
  sessions: Map<string, TourSession>; // keyed by session id
  sessionKeyIndex: Map<string, string>; // sessionKeyHash -> sessionId
  progress: Map<string, Map<string, StationProgress>>; // sessionId -> stationId -> progress
  events: MockAnalyticsEvent[];
  nextEventId: number;
  adminSessions: Set<string>;
};

function createInitialQrCodes(): Map<string, MockQrCode> {
  const map = new Map<string, MockQrCode>();
  for (const station of SEED_STATIONS) {
    // Deterministic dev token so `/q/<slug>-demo` works out of the box.
    const token = `${station.slug}-demo`;
    map.set(token, {
      id: `qr-${station.id}`,
      stationId: station.id,
      token,
      isActive: true,
      createdAt: new Date().toISOString(),
      revokedAt: null,
    });
  }
  return map;
}

function createStore(): MockStore {
  return {
    stations: new Map(SEED_STATIONS.map((s) => [s.id, { ...s }])),
    qrCodes: createInitialQrCodes(),
    sessions: new Map(),
    sessionKeyIndex: new Map(),
    progress: new Map(),
    events: [],
    nextEventId: 1,
    adminSessions: new Set<string>(),
  };
}

const globalForStore = globalThis as unknown as { __jslichotMockStore?: MockStore };

export const mockStore: MockStore = globalForStore.__jslichotMockStore ?? createStore();

if (process.env.NODE_ENV !== "production") {
  globalForStore.__jslichotMockStore = mockStore;
}

export function resetMockStore() {
  const fresh = createStore();
  mockStore.stations = fresh.stations;
  mockStore.qrCodes = fresh.qrCodes;
  mockStore.sessions = fresh.sessions;
  mockStore.sessionKeyIndex = fresh.sessionKeyIndex;
  mockStore.progress = fresh.progress;
  mockStore.events = fresh.events;
  mockStore.nextEventId = fresh.nextEventId;
  mockStore.adminSessions = fresh.adminSessions;
}

export function getMockStationsSorted(): Station[] {
  return Array.from(mockStore.stations.values()).sort((a, b) => a.orderIndex - b.orderIndex);
}

export function getOrCreateMockProgress(sessionId: string, stationId: string): StationProgress {
  let sessionProgress = mockStore.progress.get(sessionId);
  if (!sessionProgress) {
    sessionProgress = new Map();
    mockStore.progress.set(sessionId, sessionProgress);
  }
  let stationProgress = sessionProgress.get(stationId);
  if (!stationProgress) {
    stationProgress = {
      stationId,
      status: "pending" as ProgressStatus,
      arrivedAt: null,
      qrScannedAt: null,
      videoStartedAt: null,
      videoCompletedAt: null,
      completedAt: null,
    };
    sessionProgress.set(stationId, stationProgress);
  }
  return stationProgress;
}

export type { MockQrCode, MockAnalyticsEvent };
