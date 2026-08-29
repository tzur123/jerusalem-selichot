import "server-only";
import { env } from "@/lib/config/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { mockStore } from "@/lib/data/mock-store";
import { getStationById } from "@/lib/data/stations";
import { generateQrToken, hashQrToken } from "./token";
import type { Station } from "@/types/station";

export type QrStatus = {
  id: string;
  token: string | null; // only ever populated right after generation (mock) — real tokens are never re-readable
  isActive: boolean;
  createdAt: string;
  revokedAt: string | null;
};

/**
 * Validates a raw QR token from `/q/[token]` or the in-app scanner.
 * Returns the associated station when the token is active, or `null`.
 */
export async function validateQrToken(token: string): Promise<Station | null> {
  if (env.useMockBackend) {
    const record = mockStore.qrCodes.get(token);
    if (!record || !record.isActive) return null;
    return getStationById(record.stationId);
  }

  const hash = await hashQrToken(token, env.QR_HASH_PEPPER);
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("token_hash", hash)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return null;
  return getStationById(data.station_id);
}

/** Generates a new active QR token for a station. Returns the raw token (show once). */
export async function generateQrForStation(stationId: string): Promise<string> {
  const token = generateQrToken();

  if (env.useMockBackend) {
    const id = crypto.randomUUID();
    mockStore.qrCodes.set(token, {
      id,
      stationId,
      token,
      isActive: true,
      createdAt: new Date().toISOString(),
      revokedAt: null,
    });
    return token;
  }

  const hash = await hashQrToken(token, env.QR_HASH_PEPPER);
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("qr_codes").insert({
    station_id: stationId,
    token_hash: hash,
    is_active: true,
  });
  if (error) throw error;
  return token;
}

export async function revokeQr(qrId: string): Promise<void> {
  if (env.useMockBackend) {
    for (const record of mockStore.qrCodes.values()) {
      if (record.id === qrId) {
        record.isActive = false;
        record.revokedAt = new Date().toISOString();
      }
    }
    return;
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("qr_codes")
    .update({ is_active: false, revoked_at: new Date().toISOString() })
    .eq("id", qrId);
  if (error) throw error;
}

export async function listQrForStation(stationId: string): Promise<QrStatus[]> {
  if (env.useMockBackend) {
    return Array.from(mockStore.qrCodes.values())
      .filter((r) => r.stationId === stationId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((r) => ({
        id: r.id,
        token: r.isActive ? r.token : null,
        isActive: r.isActive,
        createdAt: r.createdAt,
        revokedAt: r.revokedAt,
      }));
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("station_id", stationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    token: null,
    isActive: r.is_active,
    createdAt: r.created_at,
    revokedAt: r.revoked_at,
  }));
}

/** Builds the public deep-link URL for a raw token. */
export function buildQrUrl(token: string, appUrl: string): string {
  return `${appUrl.replace(/\/$/, "")}/q/${token}`;
}
