"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Station } from "@/types/station";
import { trackEventClient } from "@/lib/analytics/track-client";
import { Button } from "@/components/ui/Button";
import { Card, CardSubtitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";

type VideoData = { videoUrl: string; posterUrl: string | null; captionsUrl: string | null };

export function StationVideoPlayer({
  station,
  alreadyCompleted,
  previewMode = false,
}: {
  station: Station;
  alreadyCompleted: boolean;
  /** Admin-only preview: plays the real uploaded file without touching this visitor's tour progress or analytics. */
  previewMode?: boolean;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const milestonesRef = useRef(new Set<number>());
  const startedRef = useRef(false);
  const completedRef = useRef(alreadyCompleted);

  const [data, setData] = useState<VideoData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [completed, setCompleted] = useState(alreadyCompleted);
  const [nextStationSlug, setNextStationSlug] = useState<string | null>(null);
  const [nextStationName, setNextStationName] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const completionPromiseRef = useRef<Promise<{ slug: string; name: string } | "complete"> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/stations/${station.slug}/video`)
      .then((res) => {
        if (!res.ok) throw new Error("video unavailable");
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [station.slug]);

  /**
   * Marks the station complete (once) and resolves with where to go next.
   * Shared by the passive 90%-watched/onEnded triggers (fire-and-forget) and
   * the "continue" button (awaited) so a visitor who clicks "continue"
   * before the video naturally finishes doesn't need a separate second
   * click once the request comes back — everyone awaits the same promise.
   */
  const completeStation = useCallback((): Promise<{ slug: string; name: string } | "complete"> => {
    if (completionPromiseRef.current) return completionPromiseRef.current;
    completedRef.current = true;
    setCompleted(true);

    const promise = (async (): Promise<{ slug: string; name: string } | "complete"> => {
      if (previewMode) return "complete";

      trackEventClient("video_90", { stationId: station.id });
      trackEventClient("station_completed", { stationId: station.id });

      try {
        const res = await fetch("/api/session/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "video_completed", stationId: station.id }),
        });
        const json = await res.json();
        if (json.nextStation) {
          setNextStationSlug(json.nextStation.slug);
          setNextStationName(json.nextStation.name);
          return { slug: json.nextStation.slug, name: json.nextStation.name };
        }
        setNextStationSlug("__complete__");
        return "complete";
      } catch {
        setNextStationSlug("__complete__");
        return "complete";
      }
    })();

    completionPromiseRef.current = promise;
    return promise;
  }, [station.id, previewMode]);

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    if (!startedRef.current) {
      startedRef.current = true;
      if (!previewMode) {
        trackEventClient("video_started", { stationId: station.id });
        void fetch("/api/session/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "video_started", stationId: station.id }),
        });
      }
    }

    const pct = (video.currentTime / video.duration) * 100;
    for (const milestone of [25, 50, 90]) {
      if (pct >= milestone && !milestonesRef.current.has(milestone)) {
        milestonesRef.current.add(milestone);
        if (milestone === 90) {
          void completeStation();
        } else if (!previewMode) {
          trackEventClient(milestone === 25 ? "video_25" : "video_50", { stationId: station.id });
        }
      }
    }
  }

  async function handleContinueClick() {
    setAdvancing(true);
    trackEventClient("next_station_clicked", { stationId: station.id });
    const result = await completeStation();
    if (result === "complete") {
      router.push("/complete");
    } else {
      router.push(`/navigate/${result.slug}`);
    }
  }

  if (loadError) {
    return (
      <ErrorState
        title="הסרטון אינו זמין כרגע"
        description="נסו לרענן את הדף, או המשיכו לתחנה הבאה."
        retryLabel="נסו שוב"
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!data) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-3xl glass-card">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <video
        ref={videoRef}
        className="w-full rounded-3xl bg-black aspect-video"
        controls
        playsInline
        preload="metadata"
        poster={data.posterUrl ?? undefined}
        onTimeUpdate={handleTimeUpdate}
        onEnded={completeStation}
      >
        <source src={data.videoUrl} type="video/mp4" />
        {data.captionsUrl && <track kind="captions" srcLang="he" label="עברית" src={data.captionsUrl} default />}
        הדפדפן שלכם אינו תומך בהצגת וידאו.
      </video>

      {completed && previewMode && (
        <Card className="flex flex-col items-center gap-3 text-center">
          <CardSubtitle>הסרטון עבר את סף הצפייה (90%) — כך ייראה למבקר בשטח.</CardSubtitle>
        </Card>
      )}

      {completed && !previewMode && (
        <Card className="flex flex-col items-center gap-2 text-center">
          <CardSubtitle>התחנה הושלמה בהצלחה!</CardSubtitle>
        </Card>
      )}

      {!previewMode && (
        <Button onClick={handleContinueClick} size="lg" fullWidth disabled={advancing}>
          {advancing ? (
            <Spinner />
          ) : nextStationSlug === "__complete__" ? (
            "לסיום הסיור 🎉"
          ) : nextStationSlug ? (
            `ממשיכים לתחנה הבאה: ${nextStationName}`
          ) : (
            "המשיכו לתחנה הבאה"
          )}
        </Button>
      )}
    </div>
  );
}
