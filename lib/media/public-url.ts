/**
 * Builds the stable public URL for an object in the public `station-public`
 * storage bucket. Unlike the private `station-videos` bucket (signed,
 * short-lived URLs), this bucket is public — safe to embed in statically
 * generated pages that are built once and served for a long time.
 *
 * This is called from both Server Components (e.g. /places/[slug]) and
 * Client Components (e.g. the map's station popup), so it must reach
 * `process.env.NEXT_PUBLIC_SUPABASE_URL` as a direct, literal member
 * expression — Next.js only inlines `NEXT_PUBLIC_*` vars into the browser
 * bundle when it can statically see that exact pattern in the source. Going
 * through the centralized `env` object (which reads via a dynamic
 * `process.env` lookup) breaks that static analysis, so on the client this
 * would silently resolve to `undefined` and always fall back to the
 * placeholder image, no matter what's actually stored.
 */
export function getStationPublicMediaUrl(path: string | null): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!path || !supabaseUrl) return null;
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/station-public/${path}`;
}
