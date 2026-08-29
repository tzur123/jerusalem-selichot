/**
 * Minimal in-memory sliding-window rate limiter for sensitive public
 * endpoints (QR validation, event ingestion). Good enough for a single
 * Node.js instance / MVP; for multi-instance production deployments this
 * should be swapped for a shared store (e.g. Upstash Redis).
 */

type Bucket = { count: number; windowStartMs: number };

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  opts: { limit: number; windowMs: number }
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStartMs >= opts.windowMs) {
    buckets.set(key, { count: 1, windowStartMs: now });
    return { allowed: true, remaining: opts.limit - 1 };
  }

  if (bucket.count >= opts.limit) {
    return { allowed: false, remaining: 0 };
  }

  bucket.count += 1;
  return { allowed: true, remaining: opts.limit - bucket.count };
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
