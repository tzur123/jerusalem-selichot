import "server-only";
import { env } from "@/lib/config/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { stationRowToStation } from "./mappers";
import { getMockStationsSorted, mockStore } from "./mock-store";
import type { Station } from "@/types/station";
import type { StationRow } from "@/lib/supabase/types";

export type StationInput = {
  slug: string;
  name: string;
  shortDescription?: string | null;
  longDescription?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  orderIndex: number;
  isDefaultStart: boolean;
  arrivalRadiusM: number;
  isPublished: boolean;
  videoPath?: string | null;
  posterPath?: string | null;
  captionsPath?: string | null;
};

/**
 * Published stations ordered by `order_index`. Never hardcode station data
 * in components — always go through this repository.
 */
export async function getPublishedStations(): Promise<Station[]> {
  if (env.useMockBackend) {
    return getMockStationsSorted().filter((s) => s.isPublished);
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("stations")
    .select("*")
    .eq("is_published", true)
    .order("order_index", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(stationRowToStation);
}

/** Includes unpublished stations — used by admin only. */
export async function getAllStationsAdmin(): Promise<Station[]> {
  if (env.useMockBackend) {
    return getMockStationsSorted();
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("stations")
    .select("*")
    .order("order_index", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(stationRowToStation);
}

export async function getStationBySlug(slug: string): Promise<Station | null> {
  if (env.useMockBackend) {
    const station = Array.from(mockStore.stations.values()).find((s) => s.slug === slug);
    return station ?? null;
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.from("stations").select("*").eq("slug", slug).maybeSingle();

  if (error) throw error;
  return data ? stationRowToStation(data) : null;
}

export async function getStationById(id: string): Promise<Station | null> {
  if (env.useMockBackend) {
    return mockStore.stations.get(id) ?? null;
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.from("stations").select("*").eq("id", id).maybeSingle();

  if (error) throw error;
  return data ? stationRowToStation(data) : null;
}

export async function getDefaultStartStation(): Promise<Station | null> {
  const stations = await getPublishedStations();
  return stations.find((s) => s.isDefaultStart) ?? stations[0] ?? null;
}

function toStationRowPatch(input: Partial<StationInput>): Partial<StationRow> {
  const patch: Partial<StationRow> = {};
  if (input.slug !== undefined) patch.slug = input.slug;
  if (input.name !== undefined) patch.name = input.name;
  if (input.shortDescription !== undefined) patch.short_description = input.shortDescription;
  if (input.longDescription !== undefined) patch.long_description = input.longDescription;
  if (input.address !== undefined) patch.address = input.address;
  if (input.latitude !== undefined) patch.latitude = input.latitude;
  if (input.longitude !== undefined) patch.longitude = input.longitude;
  if (input.orderIndex !== undefined) patch.order_index = input.orderIndex;
  if (input.isDefaultStart !== undefined) patch.is_default_start = input.isDefaultStart;
  if (input.arrivalRadiusM !== undefined) patch.arrival_radius_m = input.arrivalRadiusM;
  if (input.isPublished !== undefined) patch.is_published = input.isPublished;
  if (input.videoPath !== undefined) patch.video_path = input.videoPath;
  if (input.posterPath !== undefined) patch.poster_path = input.posterPath;
  if (input.captionsPath !== undefined) patch.captions_path = input.captionsPath;
  return patch;
}

export async function createStation(input: StationInput): Promise<Station> {
  if (env.useMockBackend) {
    if (input.isDefaultStart) {
      for (const s of mockStore.stations.values()) s.isDefaultStart = false;
    }
    const station: Station = {
      id: crypto.randomUUID(),
      slug: input.slug,
      name: input.name,
      shortDescription: input.shortDescription ?? null,
      longDescription: input.longDescription ?? null,
      address: input.address ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      orderIndex: input.orderIndex,
      isDefaultStart: input.isDefaultStart,
      arrivalRadiusM: input.arrivalRadiusM,
      videoPath: input.videoPath ?? null,
      posterPath: input.posterPath ?? null,
      captionsPath: input.captionsPath ?? null,
      isPublished: input.isPublished,
    };
    mockStore.stations.set(station.id, station);
    return station;
  }

  const supabase = getSupabaseAdminClient();
  if (input.isDefaultStart) {
    await supabase.from("stations").update({ is_default_start: false }).eq("is_default_start", true);
  }
  const { data, error } = await supabase
    .from("stations")
    .insert({ ...toStationRowPatch(input), slug: input.slug, name: input.name })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to create station");
  return stationRowToStation(data);
}

export async function updateStation(id: string, input: Partial<StationInput>): Promise<Station> {
  if (env.useMockBackend) {
    const existing = mockStore.stations.get(id);
    if (!existing) throw new Error("Station not found");
    if (input.isDefaultStart) {
      for (const s of mockStore.stations.values()) {
        if (s.id !== id) s.isDefaultStart = false;
      }
    }
    const updated: Station = { ...existing, ...input } as Station;
    mockStore.stations.set(id, updated);
    return updated;
  }

  const supabase = getSupabaseAdminClient();
  if (input.isDefaultStart) {
    await supabase.from("stations").update({ is_default_start: false }).neq("id", id);
  }
  const { data, error } = await supabase
    .from("stations")
    .update(toStationRowPatch(input))
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to update station");
  return stationRowToStation(data);
}

export async function reorderStations(order: { id: string; orderIndex: number }[]): Promise<void> {
  if (env.useMockBackend) {
    for (const { id, orderIndex } of order) {
      const station = mockStore.stations.get(id);
      if (station) station.orderIndex = orderIndex;
    }
    return;
  }

  const supabase = getSupabaseAdminClient();
  await Promise.all(
    order.map(({ id, orderIndex }) =>
      supabase.from("stations").update({ order_index: orderIndex }).eq("id", id)
    )
  );
}
