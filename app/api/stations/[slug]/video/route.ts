import { NextResponse } from "next/server";
import { env } from "@/lib/config/env";
import { getStationBySlug } from "@/lib/data/stations";
import { getSessionProgress } from "@/lib/session/progress";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const SIGNED_URL_TTL_SECONDS = 60 * 10;
const UNLOCKED_STATUSES = new Set(["unlocked", "watching", "completed"]);

// Public domain sample video used only when Supabase Storage isn't configured,
// so the player UI can be reviewed end-to-end locally.
const MOCK_VIDEO_URL =
  "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const MOCK_POSTER_URL = "/brand/poster-placeholder.svg";

export async function GET(_request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const station = await getStationBySlug(slug);

  if (!station || !station.isPublished) {
    return NextResponse.json({ error: "Station not found" }, { status: 404 });
  }

  const sessionData = await getSessionProgress();
  const progress = sessionData?.progress.find((p) => p.stationId === station.id);

  if (!progress || !UNLOCKED_STATUSES.has(progress.status)) {
    return NextResponse.json(
      { error: "Station is locked. Scan the QR code at the station first." },
      { status: 403 }
    );
  }

  if (env.useMockBackend || !station.videoPath) {
    return NextResponse.json({
      videoUrl: MOCK_VIDEO_URL,
      posterUrl: MOCK_POSTER_URL,
      captionsUrl: null,
      isMock: true,
    });
  }

  const supabase = getSupabaseAdminClient();
  const { data: videoData, error } = await supabase.storage
    .from("station-videos")
    .createSignedUrl(station.videoPath, SIGNED_URL_TTL_SECONDS);

  if (error || !videoData) {
    return NextResponse.json({ error: "Video unavailable" }, { status: 502 });
  }

  const posterUrl = station.posterPath
    ? (
        await supabase.storage.from("station-videos").createSignedUrl(station.posterPath, SIGNED_URL_TTL_SECONDS)
      ).data?.signedUrl ?? null
    : null;

  const captionsUrl = station.captionsPath
    ? (
        await supabase.storage
          .from("station-videos")
          .createSignedUrl(station.captionsPath, SIGNED_URL_TTL_SECONDS)
      ).data?.signedUrl ?? null
    : null;

  return NextResponse.json({
    videoUrl: videoData.signedUrl,
    posterUrl,
    captionsUrl,
    isMock: false,
  });
}
