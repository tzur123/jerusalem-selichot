import "server-only";
import { env } from "@/lib/config/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { tourSessionRowToSession, progressRowToProgress } from "@/lib/data/mappers";
import { mockStore, getOrCreateMockProgress } from "@/lib/data/mock-store";
import { getPublishedStations, getStationById } from "@/lib/data/stations";
import { computeNextStationId } from "./next-station";
import { hashSessionKey, issueNewSessionKey, readSessionKey } from "./cookie";
import type { StartMode, StationProgress, SessionWithProgress, TourSession } from "@/types/session";
import type { ProgressStatus } from "@/lib/supabase/types";
import type { Station } from "@/types/station";

const STATUS_RANK: Record<ProgressStatus, number> = {
  pending: 0,
  arrived: 1,
  unlocked: 2,
  watching: 3,
  completed: 4,
};

function maxStatus(a: ProgressStatus, b: ProgressStatus): ProgressStatus {
  return STATUS_RANK[a] >= STATUS_RANK[b] ? a : b;
}

export type CreateSessionOptions = {
  startMode?: StartMode;
  startStationId?: string;
};

/**
 * Returns the current session bound to the request cookie, creating one
 * (and issuing a new cookie) if none exists. Only callable from a Server
 * Action or Route Handler — cookie writes are not allowed during a plain
 * Server Component render.
 */
export async function getOrCreateTourSession(opts: CreateSessionOptions = {}): Promise<TourSession> {
  return env.useMockBackend ? getOrCreateMockSession(opts) : getOrCreateSupabaseSession(opts);
}

/** Read-only lookup, safe to call from Server Components. Never sets a cookie. */
export async function getSessionProgress(): Promise<SessionWithProgress | null> {
  return env.useMockBackend ? getMockSessionProgress() : getSupabaseSessionProgress();
}

export async function markArrived(stationId: string): Promise<StationProgress> {
  return updateProgress(stationId, { status: "arrived", timestampField: "arrivedAt" });
}

export async function unlockByQr(stationId: string): Promise<StationProgress> {
  return updateProgress(stationId, { status: "unlocked", timestampField: "qrScannedAt" });
}

export async function markVideoStarted(stationId: string): Promise<StationProgress> {
  return updateProgress(stationId, { status: "watching", timestampField: "videoStartedAt" });
}

export async function markStationCompleted(stationId: string): Promise<StationProgress> {
  const progress = await updateProgress(stationId, {
    status: "completed",
    timestampField: "videoCompletedAt",
  });
  await maybeCompleteTour();
  return progress;
}

/**
 * Next incomplete station in the published, order_index-sorted cycle,
 * wrapping around and skipping already-completed stations.
 */
export async function getNextStation(stationId: string): Promise<Station | null> {
  const [stations, sessionData] = await Promise.all([getPublishedStations(), getSessionProgress()]);
  const completed = new Set(
    (sessionData?.progress ?? []).filter((p) => p.status === "completed").map((p) => p.stationId)
  );

  const nextId = computeNextStationId(
    stations.map((s) => ({ id: s.id, orderIndex: s.orderIndex })),
    stationId,
    completed
  );

  if (!nextId) return null;
  return getStationById(nextId);
}

// ---------------------------------------------------------------------------
// Internal: shared status-update logic
// ---------------------------------------------------------------------------

async function updateProgress(
  stationId: string,
  opts: { status: ProgressStatus; timestampField: keyof StationProgress }
): Promise<StationProgress> {
  const session = await getOrCreateTourSession();
  return env.useMockBackend
    ? updateMockProgress(session.id, stationId, opts)
    : updateSupabaseProgress(session.id, stationId, opts);
}

async function maybeCompleteTour(): Promise<void> {
  const [stations, sessionData] = await Promise.all([getPublishedStations(), getSessionProgress()]);
  if (!sessionData) return;
  const completed = new Set(
    sessionData.progress.filter((p) => p.status === "completed").map((p) => p.stationId)
  );
  const allDone = stations.length > 0 && stations.every((s) => completed.has(s.id));
  if (!allDone || sessionData.session.completedAt) return;

  if (env.useMockBackend) {
    const s = mockStore.sessions.get(sessionData.session.id);
    if (s) s.completedAt = new Date().toISOString();
    return;
  }

  const supabase = getSupabaseAdminClient();
  await supabase
    .from("tour_sessions")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", sessionData.session.id);
}

// ---------------------------------------------------------------------------
// Mock backend
// ---------------------------------------------------------------------------

async function getOrCreateMockSession(opts: CreateSessionOptions): Promise<TourSession> {
  const key = await readSessionKey();
  if (key) {
    const hash = await hashSessionKey(key);
    const sessionId = mockStore.sessionKeyIndex.get(hash);
    const existing = sessionId ? mockStore.sessions.get(sessionId) : undefined;
    if (existing) {
      existing.lastSeenAt = new Date().toISOString();
      return existing;
    }
  }

  const newKey = await issueNewSessionKey();
  const hash = await hashSessionKey(newKey);
  const now = new Date().toISOString();
  const session: TourSession = {
    id: crypto.randomUUID(),
    startMode: opts.startMode ?? null,
    startStationId: opts.startStationId ?? null,
    currentStationId: opts.startStationId ?? null,
    startedAt: now,
    lastSeenAt: now,
    completedAt: null,
  };
  mockStore.sessions.set(session.id, session);
  mockStore.sessionKeyIndex.set(hash, session.id);
  return session;
}

async function getMockSessionProgress(): Promise<SessionWithProgress | null> {
  const key = await readSessionKey();
  if (!key) return null;
  const hash = await hashSessionKey(key);
  const sessionId = mockStore.sessionKeyIndex.get(hash);
  if (!sessionId) return null;
  const session = mockStore.sessions.get(sessionId);
  if (!session) return null;
  const progressMap = mockStore.progress.get(sessionId);
  return { session, progress: progressMap ? Array.from(progressMap.values()) : [] };
}

async function updateMockProgress(
  sessionId: string,
  stationId: string,
  opts: { status: ProgressStatus; timestampField: keyof StationProgress }
): Promise<StationProgress> {
  const progress = getOrCreateMockProgress(sessionId, stationId);
  progress.status = maxStatus(progress.status, opts.status);
  if (!progress[opts.timestampField]) {
    (progress[opts.timestampField] as string) = new Date().toISOString();
  }
  return progress;
}

// ---------------------------------------------------------------------------
// Supabase backend
// ---------------------------------------------------------------------------

const TIMESTAMP_FIELD_TO_COLUMN: Record<string, string> = {
  arrivedAt: "arrived_at",
  qrScannedAt: "qr_scanned_at",
  videoStartedAt: "video_started_at",
  videoCompletedAt: "video_completed_at",
  completedAt: "completed_at",
};

async function getOrCreateSupabaseSession(opts: CreateSessionOptions): Promise<TourSession> {
  const supabase = getSupabaseAdminClient();
  const key = await readSessionKey();

  if (key) {
    const hash = await hashSessionKey(key);
    const { data: existing } = await supabase
      .from("tour_sessions")
      .select("*")
      .eq("session_key_hash", hash)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("tour_sessions")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", existing.id);
      return tourSessionRowToSession({ ...existing, last_seen_at: new Date().toISOString() });
    }
  }

  const newKey = await issueNewSessionKey();
  const hash = await hashSessionKey(newKey);
  const now = new Date().toISOString();

  const { data: inserted, error } = await supabase
    .from("tour_sessions")
    .insert({
      session_key_hash: hash,
      start_mode: opts.startMode ?? "manual",
      start_station_id: opts.startStationId ?? null,
      current_station_id: opts.startStationId ?? null,
      started_at: now,
      last_seen_at: now,
    })
    .select("*")
    .single();

  if (error || !inserted) {
    throw error ?? new Error("Failed to create tour session");
  }

  return tourSessionRowToSession(inserted);
}

async function getSupabaseSessionProgress(): Promise<SessionWithProgress | null> {
  const key = await readSessionKey();
  if (!key) return null;

  const supabase = getSupabaseAdminClient();
  const hash = await hashSessionKey(key);

  const { data: session } = await supabase
    .from("tour_sessions")
    .select("*")
    .eq("session_key_hash", hash)
    .maybeSingle();

  if (!session) return null;

  const { data: rows, error } = await supabase
    .from("session_station_progress")
    .select("*")
    .eq("session_id", session.id);

  if (error) throw error;

  return {
    session: tourSessionRowToSession(session),
    progress: (rows ?? []).map(progressRowToProgress),
  };
}

async function updateSupabaseProgress(
  sessionId: string,
  stationId: string,
  opts: { status: ProgressStatus; timestampField: keyof StationProgress }
): Promise<StationProgress> {
  const supabase = getSupabaseAdminClient();

  const { data: existing } = await supabase
    .from("session_station_progress")
    .select("*")
    .eq("session_id", sessionId)
    .eq("station_id", stationId)
    .maybeSingle();

  const nextStatus = maxStatus(existing?.status ?? "pending", opts.status);
  const column = TIMESTAMP_FIELD_TO_COLUMN[opts.timestampField];

  const patch: Record<string, unknown> = { status: nextStatus };
  const existingTimestamp = existing ? (existing as Record<string, unknown>)[column] : null;
  if (!existingTimestamp) {
    patch[column] = new Date().toISOString();
  }

  const { data: upserted, error } = await supabase
    .from("session_station_progress")
    .upsert(
      { session_id: sessionId, station_id: stationId, ...patch },
      { onConflict: "session_id,station_id" }
    )
    .select("*")
    .single();

  if (error || !upserted) {
    throw error ?? new Error("Failed to update station progress");
  }

  return progressRowToProgress(upserted);
}
