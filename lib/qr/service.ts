import "server-only";
import QRCode from "qrcode";
import { env } from "@/lib/config/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { mockStore } from "@/lib/data/mock-store";
import { getStationById } from "@/lib/data/stations";
import { generateQrToken, hashQrToken } from "./token";
import type { Station } from "@/types/station";

const QR_IMAGE_TTL_SECONDS = 60 * 60; // 1 hour — regenerated on every admin page load

export type QrStatus = {
  id: string;
  token: string | null; // only ever populated right after generation (mock) — real tokens are never re-readable
  isActive: boolean;
  createdAt: string;
  revokedAt: string | null;
  /** Signed/persisted image of the printable QR code, when one was rendered. */
  qrImageUrl: string | null;
};

export type GeneratedQr = {
  token: string;
  url: string;
  qrImageUrl: string | null;
};

/** Builds the public deep-link URL for a raw token. */
export function buildQrUrl(token: string, appUrl: string): string {
  return `${appUrl.replace(/\/$/, "")}/q/${token}`;
}

async function renderQrPng(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    margin: 1,
    width: 512,
    color: { dark: "#001B33", light: "#F7FBFF" },
  });
}

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

/**
 * Generates a new active QR token for a station, renders and persists the
 * printable QR image, and returns everything the admin UI needs to display
 * or download it — including on future page loads, without regenerating
 * (which would immediately invalidate any already-printed code).
 */
export async function generateQrForStation(stationId: string): Promise<GeneratedQr> {
  const token = generateQrToken();
  const url = buildQrUrl(token, env.NEXT_PUBLIC_APP_URL);

  if (env.useMockBackend) {
    const id = crypto.randomUUID();
    const qrImageDataUrl = await QRCode.toDataURL(url, {
      margin: 1,
      width: 512,
      color: { dark: "#001B33", light: "#F7FBFF" },
    });
    mockStore.qrCodes.set(token, {
      id,
      stationId,
      token,
      isActive: true,
      createdAt: new Date().toISOString(),
      revokedAt: null,
      qrImageDataUrl,
    });
    return { token, url, qrImageUrl: qrImageDataUrl };
  }

  const hash = await hashQrToken(token, env.QR_HASH_PEPPER);
  const supabase = getSupabaseAdminClient();

  const { data: inserted, error } = await supabase
    .from("qr_codes")
    .insert({ station_id: stationId, token_hash: hash, is_active: true })
    .select("*")
    .single();
  if (error || !inserted) throw error ?? new Error("Failed to create QR code");

  let qrImageUrl: string | null = null;
  try {
    const png = await renderQrPng(url);
    const imagePath = `qr-codes/${stationId}/${inserted.id}.png`;
    const { error: uploadError } = await supabase.storage
      .from("station-videos")
      .upload(imagePath, png, { contentType: "image/png", upsert: true });
    if (!uploadError) {
      await supabase.from("qr_codes").update({ qr_image_path: imagePath }).eq("id", inserted.id);
      const { data: signed } = await supabase.storage
        .from("station-videos")
        .createSignedUrl(imagePath, QR_IMAGE_TTL_SECONDS);
      qrImageUrl = signed?.signedUrl ?? null;
    }
  } catch {
    // QR still works via `url` even if the persisted image render/upload failed.
  }

  return { token, url, qrImageUrl };
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
        qrImageUrl: r.isActive ? r.qrImageDataUrl : null,
      }));
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("station_id", stationId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = data ?? [];
  const results: QrStatus[] = [];
  for (const r of rows) {
    let qrImageUrl: string | null = null;
    if (r.is_active && r.qr_image_path) {
      const { data: signed } = await supabase.storage
        .from("station-videos")
        .createSignedUrl(r.qr_image_path, QR_IMAGE_TTL_SECONDS);
      qrImageUrl = signed?.signedUrl ?? null;
    }
    results.push({
      id: r.id,
      token: null,
      isActive: r.is_active,
      createdAt: r.created_at,
      revokedAt: r.revoked_at,
      qrImageUrl,
    });
  }
  return results;
}
