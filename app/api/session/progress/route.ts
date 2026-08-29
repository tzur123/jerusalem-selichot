import { NextResponse } from "next/server";
import { sessionProgressActionSchema } from "@/lib/validation/schemas";
import { markArrived, markVideoStarted, markStationCompleted, getNextStation } from "@/lib/session/progress";
import { trackEvent } from "@/lib/analytics/track";
import { getOrCreateTourSession } from "@/lib/session/progress";

const ACTION_TO_EVENT = {
  arrived: "arrived_near_station",
  video_started: "video_started",
  video_completed: "station_completed",
} as const;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = sessionProgressActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { action, stationId } = parsed.data;
  const session = await getOrCreateTourSession();

  const progress =
    action === "arrived"
      ? await markArrived(stationId)
      : action === "video_started"
        ? await markVideoStarted(stationId)
        : await markStationCompleted(stationId);

  await trackEvent({ name: ACTION_TO_EVENT[action], sessionId: session.id, stationId });

  const nextStation = action === "video_completed" ? await getNextStation(stationId) : null;

  return NextResponse.json({ progress, nextStation });
}
