import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./types";
import { env } from "@/lib/config/env";

/**
 * Server Supabase client bound to the current request's cookies.
 * Uses the anon key + RLS — never the service role key.
 */
export async function getSupabaseServerClient() {
  if (!env.hasSupabaseConfig) {
    throw new Error("Supabase is not configured (missing NEXT_PUBLIC_SUPABASE_URL/ANON_KEY).");
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL as string,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component render — safe to ignore because
            // session refresh also happens in proxy.ts / route handlers.
          }
        },
      },
    }
  );
}
