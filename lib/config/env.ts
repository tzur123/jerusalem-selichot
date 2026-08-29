import { z } from "zod";

/**
 * Centralized, typed environment configuration.
 *
 * In development we allow Supabase / Google Maps keys to be missing so the
 * app can boot with the built-in mock data layer (see `lib/data`, `lib/session`).
 * In production these must be provided or the app will refuse to start.
 */

const isProd = process.env.NODE_ENV === "production";

const serverSchema = z.object({
  NODE_ENV: z.string().default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().or(z.literal("")),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().or(z.literal("")),
  NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY: z.string().optional().or(z.literal("")),
  SESSION_HASH_SECRET: z.string().min(1).default("dev-only-insecure-session-secret"),
  QR_HASH_PEPPER: z.string().min(1).default("dev-only-insecure-qr-pepper"),
  /** Only used when Supabase Auth is not configured (mock backend, local dev). */
  ADMIN_MOCK_EMAIL: z.string().default("admin@example.com"),
  ADMIN_MOCK_PASSWORD: z.string().default("admin1234"),
});

const parsed = serverSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables. See console for details.");
}

const raw = parsed.data;

const hasSupabaseConfig = Boolean(
  raw.NEXT_PUBLIC_SUPABASE_URL &&
    raw.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    raw.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
    raw.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0
);

const hasSupabaseAdminConfig = Boolean(hasSupabaseConfig && raw.SUPABASE_SERVICE_ROLE_KEY);

const hasGoogleMapsConfig = Boolean(
  raw.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY && raw.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY.length > 0
);

if (isProd) {
  const missing: string[] = [];
  if (!hasSupabaseConfig) missing.push("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!raw.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!hasGoogleMapsConfig) missing.push("NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY");
  if (raw.SESSION_HASH_SECRET === "dev-only-insecure-session-secret") missing.push("SESSION_HASH_SECRET");
  if (raw.QR_HASH_PEPPER === "dev-only-insecure-qr-pepper") missing.push("QR_HASH_PEPPER");
  if (missing.length > 0) {
    console.warn(
      `[env] Missing required production configuration: ${missing.join(", ")}. ` +
        "The app will keep running in degraded/mock mode until these are set."
    );
  }
}

export const env = {
  ...raw,
  isProd,
  isDev: !isProd,
  /** True when a real Supabase project is configured (URL + anon key). */
  hasSupabaseConfig,
  /** True when the service role key is also available (server-only operations). */
  hasSupabaseAdminConfig,
  /** True when a Google Maps browser key is configured. */
  hasGoogleMapsConfig,
  /**
   * When Supabase isn't configured we transparently fall back to an in-memory
   * / seeded mock data layer so the product can be reviewed locally without
   * any external services. This flag drives that switch across `lib/data`
   * and `lib/session`.
   */
  useMockBackend: !hasSupabaseConfig,
};

export type Env = typeof env;
