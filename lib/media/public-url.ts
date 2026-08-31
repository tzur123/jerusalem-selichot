import { env } from "@/lib/config/env";

/**
 * Builds the stable public URL for an object in the public `station-public`
 * storage bucket. Unlike the private `station-videos` bucket (signed,
 * short-lived URLs), this bucket is public — safe to embed in statically
 * generated pages that are built once and served for a long time.
 */
export function getStationPublicMediaUrl(path: string | null): string | null {
  if (!path || !env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const base = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/station-public/${path}`;
}
