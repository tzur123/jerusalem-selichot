"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { signInAdmin, signOutAdmin, getAdminSession } from "./auth";
import { createStation, updateStation, reorderStations } from "@/lib/data/stations";
import { stationUpsertSchema, reorderSchema } from "@/lib/validation/schemas";
import { env } from "@/lib/config/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type LoginActionState = { error?: string } | undefined;

export async function loginAction(_prevState: LoginActionState, formData: FormData): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const result = await signInAdmin(email, password);
  if (!result.success) return { error: result.error };

  redirect("/admin/stations");
}

export async function logoutAction(): Promise<void> {
  await signOutAdmin();
  redirect("/admin/login");
}

export type StationFormState = { error?: string; fieldErrors?: Record<string, string[]> } | undefined;

function parseStationForm(formData: FormData) {
  const num = (key: string) => {
    const raw = formData.get(key);
    if (raw === null || raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };

  return {
    slug: String(formData.get("slug") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    shortDescription: (formData.get("shortDescription") as string) || null,
    longDescription: (formData.get("longDescription") as string) || null,
    address: (formData.get("address") as string) || null,
    latitude: num("latitude"),
    longitude: num("longitude"),
    orderIndex: Number(formData.get("orderIndex") ?? 1),
    isDefaultStart: formData.get("isDefaultStart") === "on",
    arrivalRadiusM: Number(formData.get("arrivalRadiusM") ?? 45),
    isPublished: formData.get("isPublished") === "on",
    videoPath: (formData.get("videoPath") as string) || null,
    posterPath: (formData.get("posterPath") as string) || null,
    captionsPath: (formData.get("captionsPath") as string) || null,
  };
}

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export async function createStationAction(
  _prevState: StationFormState,
  formData: FormData
): Promise<StationFormState> {
  await requireAdmin();
  const input = parseStationForm(formData);
  const parsed = stationUpsertSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "יש לתקן את השדות המסומנים", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await createStation(parsed.data);
  revalidatePath("/admin/stations");
  redirect("/admin/stations");
}

export async function updateStationAction(
  stationId: string,
  _prevState: StationFormState,
  formData: FormData
): Promise<StationFormState> {
  await requireAdmin();
  const input = parseStationForm(formData);
  const parsed = stationUpsertSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "יש לתקן את השדות המסומנים", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await updateStation(stationId, parsed.data);
  revalidatePath("/admin/stations");
  revalidatePath(`/admin/stations/${stationId}`);
  redirect("/admin/stations");
}

export async function reorderStationsAction(order: { id: string; orderIndex: number }[]): Promise<void> {
  await requireAdmin();
  const parsed = reorderSchema.safeParse({ order });
  if (!parsed.success) return;
  await reorderStations(parsed.data.order);
  revalidatePath("/admin/stations");
}

const MEDIA_BUCKET = "station-videos";

/**
 * Mints a short-lived signed upload URL so the browser can stream large
 * media files (up to 300MB for video) directly to Supabase Storage,
 * bypassing our own server entirely — this avoids Vercel's serverless
 * function request-body limits, which are far smaller than 300MB.
 */
export async function createMediaUploadUrlAction(
  stationId: string,
  kind: "video" | "poster" | "captions",
  fileName: string
): Promise<{ error?: string; path?: string; token?: string; signedUrl?: string }> {
  await requireAdmin();

  if (env.useMockBackend) {
    return { error: "העלאת קבצים דורשת חיבור ל-Supabase Storage. הזינו נתיב ידנית בשדה למטה." };
  }

  const supabase = getSupabaseAdminClient();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${stationId}/${kind}-${Date.now()}-${safeName}`;

  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    return { error: `יצירת קישור העלאה נכשלה: ${error?.message ?? "שגיאה לא ידועה"}` };
  }

  return { path: data.path, token: data.token, signedUrl: data.signedUrl };
}

/** Persists the storage path on the station once the browser finished the direct upload. */
export async function finalizeMediaUploadAction(
  stationId: string,
  kind: "video" | "poster" | "captions",
  path: string
): Promise<{ error?: string }> {
  await requireAdmin();

  const field = kind === "video" ? "videoPath" : kind === "poster" ? "posterPath" : "captionsPath";
  await updateStation(stationId, { [field]: path });
  revalidatePath(`/admin/stations/${stationId}`);

  return {};
}
