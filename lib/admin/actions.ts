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

export async function uploadStationMediaAction(
  stationId: string,
  kind: "video" | "poster" | "captions",
  formData: FormData
): Promise<{ error?: string; path?: string }> {
  await requireAdmin();

  if (env.useMockBackend) {
    return { error: "העלאת קבצים דורשת חיבור ל-Supabase Storage. הזינו נתיב ידנית בשדה למטה." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "לא נבחר קובץ" };
  }

  const supabase = getSupabaseAdminClient();
  const extension = file.name.split(".").pop() ?? "bin";
  const path = `${stationId}/${kind}-${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from("station-videos").upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });

  if (error) {
    return { error: `העלאה נכשלה: ${error.message}` };
  }

  const field = kind === "video" ? "videoPath" : kind === "poster" ? "posterPath" : "captionsPath";
  await updateStation(stationId, { [field]: path });
  revalidatePath(`/admin/stations/${stationId}`);

  return { path };
}
