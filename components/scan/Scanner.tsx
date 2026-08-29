"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Screen } from "@/components/brand/Screen";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { useSound } from "@/lib/sound/SoundProvider";

type ScanStatus = "starting" | "scanning" | "camera-error" | "validating" | "invalid" | "success";

function extractToken(rawValue: string): string {
  try {
    const url = new URL(rawValue);
    const parts = url.pathname.split("/").filter(Boolean);
    const qIndex = parts.indexOf("q");
    if (qIndex !== -1 && parts[qIndex + 1]) return parts[qIndex + 1];
  } catch {
    // Not a URL — treat the raw scanned text as the token itself.
  }
  return rawValue.trim();
}

export function Scanner({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const { playSuccess } = useSound();
  const [status, setStatus] = useState<ScanStatus>("starting");
  const [errorMessage, setErrorMessage] = useState<string | null>(
    initialError === "invalid" ? "קוד ה-QR אינו תקין או בוטל" : null
  );
  const [manualOpen, setManualOpen] = useState(false);
  const [manualValue, setManualValue] = useState("");
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const containerId = "qr-reader";

  const validateToken = useCallback(
    async (token: string) => {
      setStatus("validating");
      try {
        const res = await fetch("/api/qr/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setErrorMessage(data.error ?? "קוד לא תקין");
          setStatus("invalid");
          return;
        }
        const data = await res.json();
        setStatus("success");
        playSuccess();
        router.push(`/station/${data.station.slug}`);
      } catch {
        setErrorMessage("שגיאת רשת — נסו שוב");
        setStatus("invalid");
      }
    },
    [router, playSuccess]
  );

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            void scanner.pause(true);
            void validateToken(extractToken(decodedText));
          },
          () => {
            // per-frame decode failures are expected and ignored
          }
        );
        if (!cancelled) setStatus("scanning");
      } catch {
        if (!cancelled) setStatus("camera-error");
      }
    }

    void start();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function retry() {
    setErrorMessage(null);
    setStatus("scanning");
    void scannerRef.current?.resume();
  }

  return (
    <Screen>
      <header className="pt-2 pb-4 text-center">
        <h1 className="text-2xl font-black">סריקת QR</h1>
        <p className="text-muted text-sm mt-1">כוונו את המצלמה לקוד ה-QR שבתחנה</p>
      </header>

      {(status === "starting" || status === "scanning" || status === "validating") && (
        <div className="relative aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-3xl glass-card">
          <div id={containerId} className="h-full w-full" />
          {(status === "starting" || status === "validating") && (
            <div className="absolute inset-0 flex items-center justify-center bg-navy/60">
              <Spinner />
            </div>
          )}
        </div>
      )}

      {status === "camera-error" && (
        <ErrorState
          title="לא הצלחנו לגשת למצלמה"
          description="ודאו שאישרתם גישה למצלמה בדפדפן, או השתמשו במצלמת המכשיר לסריקת ה-QR הפיזי."
          retryLabel="נסו שוב"
          onRetry={() => window.location.reload()}
        />
      )}

      {status === "invalid" && (
        <ErrorState title="הסריקה נכשלה" description={errorMessage ?? undefined} retryLabel="נסו לסרוק שוב" onRetry={retry} />
      )}

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => setManualOpen((v) => !v)}
          className="text-xs text-muted underline underline-offset-4"
        >
          בעיה בסריקה? הזינו קוד ידנית
        </button>
        {manualOpen && (
          <Card className="mt-3 flex flex-col gap-3">
            <input
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              placeholder="הדביקו כאן קוד או קישור QR"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-muted focus:border-mint outline-none"
              aria-label="קוד QR ידני"
            />
            <Button onClick={() => manualValue && validateToken(extractToken(manualValue))} fullWidth>
              אימות קוד
            </Button>
          </Card>
        )}
      </div>
    </Screen>
  );
}

export function ScannerHint({ stationHint }: { stationHint?: string }) {
  if (!stationHint) return null;
  return (
    <Card className="mb-4 text-center">
      <CardTitle className="text-base">מחפשים את תחנת {stationHint}</CardTitle>
      <CardSubtitle>סרקו את קוד ה-QR שנמצא במקום</CardSubtitle>
    </Card>
  );
}
