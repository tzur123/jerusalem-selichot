"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Browser Supabase client for the small set of client-side reads that are
 * safe under RLS (e.g. admin UI live updates). Visitors never mutate
 * progress tables directly from the browser — that always goes through
 * server routes (see `lib/session/progress.ts`).
 */
export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase browser client requested but NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set."
    );
  }

  if (!client) {
    client = createBrowserClient<Database>(url, anonKey);
  }

  return client;
}
