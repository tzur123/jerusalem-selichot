"use client";

import { useEffect, useRef, useState } from "react";
import { createMediaUploadUrlAction, finalizeMediaUploadAction, getMediaPreviewUrlAction } from "@/lib/admin/actions";

type Kind = "video" | "poster" | "captions" | "hero";

const LABELS: Record<Kind, string> = {
  video: "סרטון",
  poster: "תמונת קאבר",
  captions: "כתוביות (WebVTT)",
  hero: "תמונה ראשית (לדף המידע הציבורי)",
};

const MAX_MB: Record<Kind, number> = {
  video: 300,
  poster: 20,
  captions: 5,
  hero: 20,
};

const ACCEPT: Record<Kind, string> = {
  video: "video/*",
  poster: "image/*",
  captions: ".vtt,text/vtt",
  hero: "image/*",
};

/**
 * Uploads directly from the browser to Supabase Storage using a short-lived
 * signed upload URL, bypassing our own server/serverless function entirely.
 * This is required to support files up to 300MB — Vercel's serverless
 * functions cap request bodies far below that, so routing the bytes through
 * a Server Action or API route would fail long before the size limit here.
 */
export function MediaUploader({
  stationId,
  kind,
  currentPath,
}: {
  stationId: string;
  kind: Kind;
  currentPath: string | null;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [savedPath, setSavedPath] = useState(currentPath);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!savedPath) {
      queueMicrotask(() => setPreviewUrl(null));
      return;
    }
    let cancelled = false;
    getMediaPreviewUrlAction(kind, savedPath).then((res) => {
      if (cancelled) return;
      if (res.url) {
        setPreviewUrl(res.url);
        setPreviewError(null);
      } else {
        setPreviewError(res.error ?? "לא ניתן להציג תצוגה מקדימה");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [kind, savedPath]);

  async function handleFile(file: File) {
    setError(null);
    const maxBytes = MAX_MB[kind] * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`הקובץ גדול מדי (מקסימום ${MAX_MB[kind]}MB)`);
      setStatus("error");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setStatus("uploading");
    setProgress(0);

    try {
      const { error: urlError, path, token, signedUrl } = await createMediaUploadUrlAction(
        stationId,
        kind,
        file.name
      );
      if (urlError || !path || !token || !signedUrl) {
        throw new Error(urlError ?? "יצירת קישור העלאה נכשלה");
      }

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signedUrl);
        xhr.setRequestHeader("content-type", file.type || "application/octet-stream");
        xhr.setRequestHeader("cache-control", "max-age=3600");
        xhr.setRequestHeader("x-upsert", "true");
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (anonKey) {
          xhr.setRequestHeader("apikey", anonKey);
          xhr.setRequestHeader("authorization", `Bearer ${anonKey}`);
        }
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`ההעלאה נכשלה (קוד ${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error("ההעלאה נכשלה — בדקו את החיבור לאינטרנט ונסו שוב"));
        xhr.send(file);
      });

      setStatus("saving");
      const { error: finalizeError } = await finalizeMediaUploadAction(stationId, kind, path);
      if (finalizeError) throw new Error(finalizeError);

      setSavedPath(path);
      setStatus("done");
      setProgress(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ההעלאה נכשלה");
      setStatus("error");
      setProgress(null);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const busy = status === "uploading" || status === "saving";

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-white/5 border border-white/10 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted">
          {LABELS[kind]} — עד {MAX_MB[kind]}MB
        </span>
        {status === "uploading" && progress !== null && <span className="text-xs text-mint">{progress}%</span>}
      </div>

      {savedPath && (
        <div className="flex flex-col gap-2">
          {(kind === "poster" || kind === "hero") && previewUrl && (
            /* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URLs; next/image's optimizer can't cache these usefully */
            <img
              src={previewUrl}
              alt={`${LABELS[kind]} נוכחית`}
              className="max-h-40 w-auto rounded-lg border border-white/10 object-contain"
            />
          )}
          {kind === "video" && previewUrl && (
            <video src={previewUrl} controls preload="metadata" className="max-h-56 w-full rounded-lg border border-white/10" />
          )}
          {previewError && <p className="text-xs text-white/40">{previewError}</p>}
          <p className="text-xs text-white/70 break-all">
            קובץ נוכחי: <code>{savedPath}</code>
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT[kind]}
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
        className="text-sm text-white/80 file:me-3 file:rounded-lg file:border-0 file:bg-mint file:px-3 file:py-2 file:text-navy file:font-bold file:cursor-pointer disabled:opacity-50"
      />

      {status === "uploading" && progress !== null && (
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-mint transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {status === "saving" && <p className="text-xs text-muted">שומרים...</p>}
      {status === "done" && <p className="text-xs text-mint">הועלה בהצלחה</p>}
      {error && (
        <p role="alert" className="text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
