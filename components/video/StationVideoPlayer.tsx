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

  const completeStation = useCallback(async () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setCompleted(true);

    if (previewMode) return;

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
      } else {
        setNextStationSlug("__complete__");
      }
    } catch {
      setNextStationSlug("__complete__");
    }
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

  function handleNextClick() {
    trackEventClient("next_station_clicked", { stationId: station.id });
    if (!nextStationSlug || nextStationSlug === "__complete__") {
      router.push("/complete");
    } else {
      router.push(`/navigate/${nextStationSlug}`);
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

      {!completed && !previewMode && (
        <Button variant="secondary" fullWidth onClick={completeStation}>
          סיימתי, ממשיכים
        </Button>
      )}

      {completed && previewMode && (
        <Card className="flex flex-col items-center gap-3 text-center">
          <CardSubtitle>הסרטון עבר את סף הצפייה (90%) — כך ייראה למבקר בשטח.</CardSubtitle>
        </Card>
      )}

      {completed && !previewMode && (
        <Card className="flex flex-col items-center gap-3 text-center">
          <CardSubtitle>התחנה הושלמה בהצלחה!</CardSubtitle>
          <Button onClick={handleNextClick} size="lg" fullWidth disabled={nextStationSlug === null}>
            {nextStationSlug === null ? (
              <Spinner />
            ) : nextStationSlug === "__complete__" ? (
              "לסיום הסיור 🎉"
            ) : (
              `ממשיכים לתחנה הבאה: ${nextStationName}`
            )}
          </Button>
        </Card>
      )}
    </div>
  );
}
