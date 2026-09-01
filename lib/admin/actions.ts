"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { signInAdmin, signOutAdmin, getAdminSession } from "./auth";
import { createStation, updateStation, reorderStations } from "@/lib/data/stations";
import { stationUpsertSchema, reorderSchema } from "@/lib/validation/schemas";
import { env } from "@/lib/config/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStationPublicMediaUrl } from "@/lib/media/public-url";

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
    articleSeoTitle: (formData.get("articleSeoTitle") as string) || null,
    articleMetaDescription: (formData.get("articleMetaDescription") as string) || null,
    articleKeywords: (formData.get("articleKeywords") as string) || null,
    articleHeading: (formData.get("articleHeading") as string) || null,
    articleDuration: (formData.get("articleDuration") as string) || null,
    articleBody: (formData.get("articleBody") as string) || null,
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

  try {
    await createStation(parsed.data);
  } catch (err) {
    return { error: describeStationSaveError(err) };
  }
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

  let station;
  try {
    station = await updateStation(stationId, parsed.data);
  } catch (err) {
    return { error: describeStationSaveError(err) };
  }
  revalidatePath("/admin/stations");
  revalidatePath(`/admin/stations/${stationId}`);
  revalidatePath(`/places/${station.slug}`);
  revalidatePath(`/station/${station.slug}`);
  redirect("/admin/stations");
}

/** Surfaces the real Postgres/Supabase error to the admin instead of
 * letting it throw uncaught — in production, an uncaught Server Action
 * error is replaced by Next.js with an opaque "Minified React error #441"
 * digest, which is useless for diagnosing e.g. a missing DB column. */
function describeStationSaveError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return `שמירת התחנה נכשלה: ${message}`;
}

export async function reorderStationsAction(order: { id: string; orderIndex: number }[]): Promise<void> {
  await requireAdmin();
  const parsed = reorderSchema.safeParse({ order });
  if (!parsed.success) return;
  await reorderStations(parsed.data.order);
  revalidatePath("/admin/stations");
}

type MediaKind = "video" | "poster" | "captions" | "hero";

/** `hero` images live in the public `station-public` bucket (stable URLs for
 * statically generated pages); everything else stays in the private,
 * signed-URL-only `station-videos` bucket used by the gated in-tour flow. */
function bucketForKind(kind: MediaKind): string {
  return kind === "hero" ? "station-public" : "station-videos";
}

/**
 * Mints a short-lived signed upload URL so the browser can stream large
 * media files (up to 300MB for video) directly to Supabase Storage,
 * bypassing our own server entirely — this avoids Vercel's serverless
 * function request-body limits, which are far smaller than 300MB.
 */
export async function createMediaUploadUrlAction(
  stationId: string,
  kind: MediaKind,
  fileName: string
): Promise<{ error?: string; path?: string; token?: string; signedUrl?: string }> {
  await requireAdmin();

  if (env.useMockBackend) {
    return { error: "העלאת קבצים דורשת חיבור ל-Supabase Storage. הזינו נתיב ידנית בשדה למטה." };
  }

  const supabase = getSupabaseAdminClient();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${stationId}/${kind}-${Date.now()}-${safeName}`;

  const { data, error } = await supabase.storage.from(bucketForKind(kind)).createSignedUploadUrl(path);
  if (error || !data) {
    return { error: `יצירת קישור העלאה נכשלה: ${error?.message ?? "שגיאה לא ידועה"}` };
  }

  return { path: data.path, token: data.token, signedUrl: data.signedUrl };
}

/**
 * Mints a viewable URL for an already-uploaded file so the admin panel can
 * show an actual image/video preview instead of just the raw storage path.
 * `hero` images sit in the public bucket (stable URL, no signing needed);
 * everything else needs a short-lived signed URL from the private bucket.
 */
export async function getMediaPreviewUrlAction(
  kind: MediaKind,
  path: string
): Promise<{ error?: string; url?: string }> {
  await requireAdmin();

  if (kind === "hero") {
    const url = getStationPublicMediaUrl(path);
    return url ? { url } : { error: "לא ניתן ליצור קישור לתמונה" };
  }

  if (env.useMockBackend) {
    return { error: "תצוגה מקדימה דורשת חיבור ל-Supabase Storage." };
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.storage.from(bucketForKind(kind)).createSignedUrl(path, 3600);
  if (error || !data) {
    return { error: `יצירת קישור לתצוגה מקדימה נכשלה: ${error?.message ?? "שגיאה לא ידועה"}` };
  }
  return { url: data.signedUrl };
}

/** Persists the storage path on the station once the browser finished the direct upload. */
export async function finalizeMediaUploadAction(
  stationId: string,
  kind: MediaKind,
  path: string
): Promise<{ error?: string }> {
  await requireAdmin();

  const field =
    kind === "video" ? "videoPath" : kind === "poster" ? "posterPath" : kind === "hero" ? "heroImagePath" : "captionsPath";

  let station;
  try {
    station = await updateStation(stationId, { [field]: path });
  } catch (err) {
    return { error: describeStationSaveError(err) };
  }
  revalidatePath(`/admin/stations/${stationId}`);
  if (kind === "hero") revalidatePath(`/places/${station.slug}`);

  return {};
}
