import { NextResponse } from "next/server";
import { qrValidateSchema } from "@/lib/validation/schemas";
import { validateQrToken } from "@/lib/qr/service";
import { unlockByQr, getOrCreateTourSession } from "@/lib/session/progress";
import { trackEvent } from "@/lib/analytics/track";
import { checkRateLimit, getClientIp } from "@/lib/http/rate-limit";

/** Used by the in-app scanner (`/scan`) — validates without leaving the flow. */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`qr-validate:${ip}`, { limit: 20, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.json({ error: "יותר מדי ניסיונות, נסו שוב בעוד רגע" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = qrValidateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "קוד לא תקין" }, { status: 400 });
  }

  const station = await validateQrToken(parsed.data.token);
  if (!station || !station.isPublished) {
    return NextResponse.json({ error: "קוד QR לא תקין או בוטל" }, { status: 404 });
  }

  const session = await getOrCreateTourSession();
  await unlockByQr(station.id);
  await trackEvent({ name: "qr_scanned", sessionId: session.id, stationId: station.id });
  await trackEvent({ name: "station_unlocked", sessionId: session.id, stationId: station.id });

  return NextResponse.json({ station: { slug: station.slug, name: station.name } });
}
