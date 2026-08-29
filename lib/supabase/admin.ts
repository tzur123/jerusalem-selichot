import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { env } from "@/lib/config/env";

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Service-role Supabase client. NEVER import this from a Client Component
 * or expose it to the browser bundle. Restricted to server-only modules
 * (admin mutations, signed URL generation, QR token validation).
 */
export function getSupabaseAdminClient() {
  if (!env.hasSupabaseAdminConfig) {
    throw new Error(
      "Supabase admin client requested but SUPABASE_SERVICE_ROLE_KEY is not configured."
    );
  }

  if (!adminClient) {
    adminClient = createClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL as string,
      env.SUPABASE_SERVICE_ROLE_KEY as string,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );
  }

  return adminClient;
}
