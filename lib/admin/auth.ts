import "server-only";
import { cookies } from "next/headers";
import { env } from "@/lib/config/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { generateRandomToken } from "@/lib/crypto/hash";
import { mockStore } from "@/lib/data/mock-store";

/**
 * Optimistic marker cookie checked by `proxy.ts` before the request reaches
 * a Server Component. The authoritative check always happens in
 * `app/admin/(dashboard)/layout.tsx` via `getAdminSession()`.
 */
export const ADMIN_COOKIE_NAME = "jslichot_admin_session";

export type AdminSession = { email: string };

export async function signInAdmin(
  email: string,
  password: string
): Promise<{ success: true } | { success: false; error: string }> {
  if (env.useMockBackend) {
    if (email.trim().toLowerCase() === env.ADMIN_MOCK_EMAIL.toLowerCase() && password === env.ADMIN_MOCK_PASSWORD) {
      const token = generateRandomToken(24);
      mockStore.adminSessions.add(token);
      const store = await cookies();
      store.set(ADMIN_COOKIE_NAME, token, {
        httpOnly: true,
        secure: env.isProd,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8,
      });
      return { success: true };
    }
    return { success: false, error: "אימייל או סיסמה שגויים" };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { success: false, error: "אימייל או סיסמה שגויים" };
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, "1", {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return { success: true };
}

export async function signOutAdmin(): Promise<void> {
  const store = await cookies();

  if (env.useMockBackend) {
    const token = store.get(ADMIN_COOKIE_NAME)?.value;
    if (token) mockStore.adminSessions.delete(token);
  } else {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.signOut();
  }

  store.delete(ADMIN_COOKIE_NAME);
}

/** Authoritative session check — use in the protected admin layout. */
export async function getAdminSession(): Promise<AdminSession | null> {
  if (env.useMockBackend) {
    const store = await cookies();
    const token = store.get(ADMIN_COOKIE_NAME)?.value;
    if (token && mockStore.adminSessions.has(token)) {
      return { email: env.ADMIN_MOCK_EMAIL };
    }
    return null;
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ? { email: user.email } : null;
}
