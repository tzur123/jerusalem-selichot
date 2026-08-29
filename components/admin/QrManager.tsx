"use client";

import { useState } from "react";
import QRCode from "qrcode";
import type { QrStatus } from "@/lib/qr/service";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export function QrManager({ stationId, initialCodes }: { stationId: string; initialCodes: QrStatus[] }) {
  const [codes, setCodes] = useState(initialCodes);
  const [latest, setLatest] = useState<{ token: string; url: string; qrImage: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const qrImage = await QRCode.toDataURL(data.url, { margin: 1, width: 320, color: { dark: "#001B33", light: "#F7FBFF" } });
      setLatest({ token: data.token, url: data.url, qrImage });
      setCodes((prev) => [
        { id: "temp", token: data.token, isActive: true, createdAt: new Date().toISOString(), revokedAt: null },
        ...prev.map((c) => ({ ...c, token: null })),
      ]);
    } catch {
      // no-op, UI stays as-is
    } finally {
      setBusy(false);
    }
  }

  async function revoke(qrId: string) {
    setBusy(true);
    try {
      await fetch("/api/admin/qr", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrId }),
      });
      setCodes((prev) => prev.map((c) => (c.id === qrId ? { ...c, isActive: false, token: null } : c)));
      if (latest) setLatest(null);
    } finally {
      setBusy(false);
    }
  }

  const activeCode = codes.find((c) => c.isActive);

  return (
    <Card className="flex flex-col gap-4">
      <CardTitle>קוד QR לתחנה</CardTitle>
      <CardSubtitle>
        {activeCode ? "יש קוד פעיל. ניתן להנפיק קוד חדש (הישן יבוטל אוטומטית) או לבטל ידנית." : "אין עדיין קוד פעיל לתחנה זו."}
      </CardSubtitle>

      {latest && (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={latest.qrImage} alt="קוד QR להדפסה" width={200} height={200} />
          <p className="text-navy text-xs break-all text-center">{latest.url}</p>
          <a
            href={latest.qrImage}
            download={`qr-${stationId}.png`}
            className="text-xs font-bold text-deep-blue underline"
          >
            הורדת PNG להדפסה
          </a>
        </div>
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
