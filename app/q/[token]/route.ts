import { NextResponse } from "next/server";
import { validateQrToken } from "@/lib/qr/service";
import { unlockByQr, getOrCreateTourSession } from "@/lib/session/progress";
import { trackEvent } from "@/lib/analytics/track";
import { checkRateLimit, getClientIp } from "@/lib/http/rate-limit";

/**
 * Deep link opened when a visitor scans the physical, printed QR code with
 * their OS camera. Validates the token server-side, unlocks the station for
 * the (possibly brand-new) anonymous session, and redirects into the flow.
 */
export async function GET(request: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const url = new URL(request.url);

  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`qr-deeplink:${ip}`, { limit: 30, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.redirect(new URL("/scan?error=rate_limited", url.origin));
  }

  const station = await validateQrToken(token);
  if (!station || !station.isPublished) {
    return NextResponse.redirect(new URL("/scan?error=invalid", url.origin));
  }

  const session = await getOrCreateTourSession();
  await unlockByQr(station.id);
  await trackEvent({ name: "qr_scanned", sessionId: session.id, stationId: station.id });
  await trackEvent({ name: "station_unlocked", sessionId: session.id, stationId: station.id });

  return NextResponse.redirect(new URL(`/station/${station.slug}`, url.origin));
}
