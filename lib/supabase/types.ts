/**
 * Hand-written types mirroring `supabase/migrations/0001_init.sql`.
 * Keep in sync with the SQL schema (source of truth per CURSOR.md).
 */

export type StationRow = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  long_description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  order_index: number;
  is_default_start: boolean;
  arrival_radius_m: number;
  video_path: string | null;
  poster_path: string | null;
  captions_path: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type QrCodeRow = {
  id: string;
  station_id: string;
  token_hash: string;
  is_active: boolean;
  created_at: string;
  revoked_at: string | null;
  qr_image_path: string | null;
};

export type TourSessionRow = {
  id: string;
  session_key_hash: string;
  start_mode: "nearest" | "recommended" | "manual";
  start_station_id: string | null;
  current_station_id: string | null;
  started_at: string;
  last_seen_at: string;
  completed_at: string | null;
};

export type ProgressStatus =
  | "pending"
  | "arrived"
  | "unlocked"
  | "watching"
  | "completed";

export type SessionStationProgressRow = {
  session_id: string;
  station_id: string;
  status: ProgressStatus;
  arrived_at: string | null;
  qr_scanned_at: string | null;
  video_started_at: string | null;
  video_completed_at: string | null;
  completed_at: string | null;
};

export type AnalyticsEventRow = {
  id: number;
  session_id: string | null;
  event_name: string;
  station_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      stations: {
        Row: StationRow;
        Insert: Partial<StationRow> & { slug: string; name: string };
        Update: Partial<StationRow>;
        Relationships: [];
      };
      qr_codes: {
        Row: QrCodeRow;
        Insert: Partial<QrCodeRow> & { station_id: string; token_hash: string };
        Update: Partial<QrCodeRow>;
        Relationships: [];
      };
      tour_sessions: {
        Row: TourSessionRow;
        Insert: Partial<TourSessionRow> & { session_key_hash: string };
        Update: Partial<TourSessionRow>;
        Relationships: [];
      };
      session_station_progress: {
        Row: SessionStationProgressRow;
        Insert: Partial<SessionStationProgressRow> & {
          session_id: string;
          station_id: string;
        };
        Update: Partial<SessionStationProgressRow>;
        Relationships: [];
      };
      analytics_events: {
        Row: AnalyticsEventRow;
        Insert: Partial<AnalyticsEventRow> & { event_name: string };
        Update: Partial<AnalyticsEventRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
