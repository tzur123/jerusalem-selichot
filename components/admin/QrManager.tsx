"use client";

import { useState } from "react";
import type { QrStatus } from "@/lib/qr/service";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export function QrManager({ stationId, initialCodes }: { stationId: string; initialCodes: QrStatus[] }) {
  const [codes, setCodes] = useState(initialCodes);
  const [latestUrl, setLatestUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "יצירת הקוד נכשלה");
      setLatestUrl(data.url);
      setCodes((prev) => [
        {
          id: "temp",
          token: data.token,
          isActive: true,
          createdAt: new Date().toISOString(),
          revokedAt: null,
          qrImageUrl: data.qrImageUrl ?? null,
        },
        ...prev.map((c) => ({ ...c, isActive: false, token: null, qrImageUrl: null })),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "יצירת הקוד נכשלה");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(qrId: string) {
    setBusy(true);
    setError(null);
    try {
      await fetch("/api/admin/qr", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrId }),
      });
      setCodes((prev) =>
        prev.map((c) => (c.id === qrId ? { ...c, isActive: false, token: null, qrImageUrl: null } : c))
      );
      setLatestUrl(null);
    } finally {
      setBusy(false);
    }
  }

  const activeCode = codes.find((c) => c.isActive);

  return (
    <Card className="flex flex-col gap-4">
      <CardTitle>קוד QR לתחנה</CardTitle>
      <CardSubtitle>
        {activeCode
          ? "הקוד הפעיל מוצג תמיד כאן — אין צורך להנפיק קוד חדש כדי לצפות בו שוב."
          : "אין עדיין קוד פעיל לתחנה זו."}
      </CardSubtitle>

      {activeCode?.qrImageUrl ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={activeCode.qrImageUrl} alt="קוד QR להדפסה" width={200} height={200} />
          {latestUrl && <p className="text-navy text-xs break-all text-center">{latestUrl}</p>}
          <a
            href={activeCode.qrImageUrl}
            download={`qr-${stationId}.png`}
            className="text-xs font-bold text-deep-blue underline"
          >
            הורדת PNG להדפסה
          </a>
        </div>
      ) : activeCode ? (
        <p className="text-xs text-muted rounded-2xl bg-white/5 p-4 text-center">
          יש קוד פעיל אך תמונת ה-QR שלו אינה זמינה כרגע. ניתן להנפיק קוד חדש כדי לקבל תמונה להדפסה.
        </p>
      ) : null}

      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button onClick={generate} disabled={busy} fullWidth>
          {busy ? <Spinner /> : activeCode ? "הנפקת קוד חדש (מבטל את הישן)" : "יצירת קוד QR"}
        </Button>
        {activeCode && (
          <Button onClick={() => revoke(activeCode.id)} disabled={busy} variant="danger">
            ביטול
          </Button>
        )}
      </div>

      {codes.length > 0 && (
        <ul className="text-xs text-muted flex flex-col gap-1">
          {codes.slice(0, 5).map((c) => (
            <li key={c.id}>
              {new Date(c.createdAt).toLocaleString("he-IL")} — {c.isActive ? "פעיל" : "מבוטל"}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
