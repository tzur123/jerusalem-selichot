import { NextResponse } from "next/server";
import { eventSchema } from "@/lib/validation/schemas";
import { trackEvent } from "@/lib/analytics/track";
import { getSessionProgress } from "@/lib/session/progress";
import { checkRateLimit, getClientIp } from "@/lib/http/rate-limit";
import { isAnalyticsEventName } from "@/lib/analytics/events";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`events:${ip}`, { limit: 120, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const parsed = eventSchema.safeParse(body);
  if (!parsed.success || !isAnalyticsEventName(parsed.data.name)) {
    return new NextResponse(null, { status: 204 });
  }

  const sessionData = await getSessionProgress();

  await trackEvent({
    name: parsed.data.name,
    sessionId: sessionData?.session.id ?? null,
    stationId: parsed.data.stationId ?? null,
    metadata: parsed.data.metadata ?? undefined,
  });

  return new NextResponse(null, { status: 204 });
}
