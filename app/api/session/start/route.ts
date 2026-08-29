import { NextResponse } from "next/server";
import { sessionStartSchema } from "@/lib/validation/schemas";
import { getOrCreateTourSession, getSessionProgress } from "@/lib/session/progress";
import { trackEvent } from "@/lib/analytics/track";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = sessionStartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const session = await getOrCreateTourSession(parsed.data);
  await trackEvent({
    name: "tour_started",
    sessionId: session.id,
    stationId: parsed.data.startStationId ?? null,
    metadata: { startMode: parsed.data.startMode },
  });

  const full = await getSessionProgress();
  return NextResponse.json({ session, progress: full?.progress ?? [] });
}

export async function GET() {
  const data = await getSessionProgress();
  return NextResponse.json(data ?? { session: null, progress: [] });
}
