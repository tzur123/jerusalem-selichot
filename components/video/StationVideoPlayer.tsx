"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";
import type { Station } from "@/types/station";
import { trackEventClient } from "@/lib/analytics/track-client";
import { Button } from "@/components/ui/Button";
import { Card, CardSubtitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { cn } from "@/lib/utils/cn";

/**
 * Public kill-switch for station videos. While `false`, visitors see a
 * tasteful "coming soon" placeholder instead of the real player (the tour
 * flow, session progress and the "continue" button all keep working
 * normally) — admins previewing from /admin still see the real video.
 * Flip to `true` once the videos are approved for launch.
 */
const VIDEOS_ENABLED = false;

type VideoData = { videoUrl: string; posterUrl: string | null; captionsUrl: string | null };

function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M8 5.5v13a1 1 0 0 0 1.53.85l10.5-6.5a1 1 0 0 0 0-1.7l-10.5-6.5A1 1 0 0 0 8 5.5Z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
    </svg>
  );
}

function MuteIcon({ muted, className }: { muted: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d="M4 9.5v5h3.2L12 18.7V5.3L7.2 9.5H4Z" fill="currentColor" />
      {muted ? (
        <path d="M16 9.5l4.5 5m0-5-4.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path
          d="M16 9c1 .9 1.6 2 1.6 3s-.6 2.1-1.6 3M18.3 6.7c1.7 1.5 2.7 3.3 2.7 5.3s-1 3.8-2.7 5.3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      )}
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showRealPlayer = previewMode || VIDEOS_ENABLED;

  const [data, setData] = useState<VideoData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [completed, setCompleted] = useState(alreadyCompleted);
  const [nextStationSlug, setNextStationSlug] = useState<string | null>(null);
  const [nextStationName, setNextStationName] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const completionPromiseRef = useRef<Promise<{ slug: string; name: string } | "complete"> | null>(null);

  // Custom player chrome state.
  const [hasStarted, setHasStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [durationSec, setDurationSec] = useState(0);

  useEffect(() => {
    if (!showRealPlayer) return;
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
  }, [station.slug, showRealPlayer]);

  useEffect(() => {
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, []);

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

  function resetControlsTimer() {
    setControlsVisible(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setControlsVisible(false);
    }, 3000);
  }

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    setCurrentTime(video.currentTime);

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

  function handleLoadedMetadata() {
    setDurationSec(videoRef.current?.duration ?? 0);
  }

  function handleEnded() {
    void completeStation();
    setIsFullscreen(false);
  }

  function handleInitialPlay() {
    setHasStarted(true);
    setIsFullscreen(true);
    setControlsVisible(true);
    const video = videoRef.current;
    if (video) void video.play();
    resetControlsTimer();
  }

  function togglePlayPause() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
    resetControlsTimer();
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
    resetControlsTimer();
  }

  function handleSeek(e: ReactPointerEvent<HTMLDivElement>) {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    video.currentTime = ratio * video.duration;
    setCurrentTime(video.currentTime);
    resetControlsTimer();
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

  const continueButton = !previewMode && (
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
  );

  // Videos hidden from the public for now — keep the tour flow intact
  // (progress, analytics, "continue" button) but skip the real player.
  if (!showRealPlayer) {
    return (
      <div className="flex flex-col gap-4">
        <div className="relative flex aspect-video w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl glass-card text-center">
          <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_50%_0%,rgba(232,200,135,0.25),transparent_60%)]" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
            <ClockIcon className="h-7 w-7 text-gold" />
          </div>
          <p className="relative text-lg font-bold text-white">הסרטון בעריכה</p>
          <p className="relative max-w-xs text-sm text-muted">הסרטון לתחנה זו יעלה בקרוב. בינתיים אפשר להמשיך בסיור.</p>
        </div>
        {continueButton}
      </div>
    );
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

  const progressPct = durationSec > 0 ? Math.min(100, (currentTime / durationSec) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          "bg-black",
          isFullscreen
            ? "fixed inset-0 z-[999] flex items-center justify-center"
            : "relative aspect-video w-full overflow-hidden rounded-3xl ring-1 ring-gold/20"
        )}
      >
        {/* The video element itself never unmounts across fullscreen toggles —
            only its wrapper's size/transform changes — so playback position
            and buffered data are preserved seamlessly. */}
        <div
          className={cn(isFullscreen ? "relative" : "absolute inset-0")}
          style={
            isFullscreen
              ? { width: "100vh", height: "100vw", transform: "rotate(90deg)" }
              : undefined
          }
        >
          <video
            ref={videoRef}
            className={cn("h-full w-full bg-black", isFullscreen ? "object-contain" : "object-cover")}
            playsInline
            preload="metadata"
            poster={data.posterUrl ?? undefined}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={handleEnded}
          >
            <source src={data.videoUrl} type="video/mp4" />
            {data.captionsUrl && <track kind="captions" srcLang="he" label="עברית" src={data.captionsUrl} default />}
            הדפדפן שלכם אינו תומך בהצגת וידאו.
          </video>
        </div>

        {/* Idle poster state — big glass/gold play button, shown until the
            visitor first presses play (rotates into fullscreen from here). */}
        {!hasStarted && (
          <button
            type="button"
            onClick={handleInitialPlay}
            aria-label="הפעלת הסרטון"
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-black/10 via-black/25 to-black/60 transition-opacity hover:from-black/20 hover:via-black/35 hover:to-black/65"
          >
            {durationSec > 0 && (
              <span className="absolute top-3 end-3 rounded-full glass-button bg-navy/50 px-3 py-1 text-xs font-semibold text-white/85">
                {formatClock(durationSec)}
              </span>
            )}
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-b from-gold to-[#c79a4f] shadow-[0_0_0_1px_rgba(232,200,135,0.5),0_12px_36px_-8px_rgba(232,200,135,0.65)] transition-transform active:scale-95">
              <PlayIcon className="h-9 w-9 translate-x-[1px] text-navy" />
            </span>
            <span className="rounded-full glass-button bg-navy/40 px-4 py-1.5 text-sm font-bold text-white">
              לצפייה בסרטון
            </span>
          </button>
        )}

        {/* Fullscreen custom control chrome — deliberately NOT rotated, so it
            reads upright no matter how the visitor is holding the phone. */}
        {isFullscreen && (
          <div
            dir="ltr"
            className="absolute inset-0 flex flex-col justify-between p-4"
            onPointerDown={() => resetControlsTimer()}
          >
            <div
              className={cn(
                "flex justify-end transition-opacity duration-300",
                controlsVisible ? "opacity-100" : "opacity-0"
              )}
            >
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                aria-label="סגירת מסך מלא"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-navy/60 text-white/90 backdrop-blur-md transition-colors hover:text-white"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={togglePlayPause}
              aria-label={isPlaying ? "השהיה" : "הפעלה"}
              className={cn(
                "flex-1 transition-opacity duration-300",
                controlsVisible || !isPlaying ? "opacity-100" : "opacity-0"
              )}
            >
              {!isPlaying && (
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-navy/55 backdrop-blur-md">
                  <PlayIcon className="h-7 w-7 translate-x-[1px] text-white" />
                </span>
              )}
            </button>

            <div
              className={cn(
                "flex flex-col gap-2 transition-opacity duration-300",
                controlsVisible ? "opacity-100" : "opacity-0"
              )}
            >
              <div
                className="group flex h-4 w-full cursor-pointer items-center"
                onPointerDown={handleSeek}
                role="slider"
                aria-label="התקדמות הסרטון"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progressPct)}
              >
                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                  <div
                    className="absolute inset-y-0 start-0 rounded-full bg-gradient-to-r from-gold to-mint"
                    style={{ width: `${progressPct}%` }}
                  />
                  <div
                    className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_3px_rgba(0,0,0,0.25)] transition-transform group-active:scale-125"
                    style={{ left: `calc(${progressPct}% - 6px)` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-white/85">
                <span className="tabular-nums">
                  {formatClock(currentTime)} / {formatClock(durationSec)}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={isMuted ? "ביטול השתקה" : "השתקה"}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-navy/55 backdrop-blur-md"
                  >
                    <MuteIcon muted={isMuted} className="h-4 w-4" />
                  </button>
                  {!previewMode && (
                    <button
                      type="button"
                      onClick={() => void handleContinueClick()}
                      disabled={advancing}
                      className="rounded-full bg-gradient-to-b from-mint to-[#00d494] px-4 py-2 text-xs font-bold text-navy disabled:opacity-60"
                    >
                      {advancing ? <Spinner /> : "לתחנה הבאה ←"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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

      {continueButton}
    </div>
  );
}
