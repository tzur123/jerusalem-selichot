import type { ProgressStatus } from "@/lib/supabase/types";

export type StartMode = "nearest" | "recommended" | "manual";

export type StationProgress = {
  stationId: string;
  status: ProgressStatus;
  arrivedAt: string | null;
  qrScannedAt: string | null;
  videoStartedAt: string | null;
  videoCompletedAt: string | null;
  completedAt: string | null;
};

export type TourSession = {
  id: string;
  startMode: StartMode | null;
  startStationId: string | null;
  currentStationId: string | null;
  startedAt: string;
  lastSeenAt: string;
  completedAt: string | null;
};

export type SessionWithProgress = {
  session: TourSession;
  progress: StationProgress[];
};

export { type ProgressStatus };
