"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { Station } from "@/types/station";
import { isLocatable } from "@/types/station";
import type { StationProgress, TourSession } from "@/types/session";
import type { ProgressStatus } from "@/lib/supabase/types";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { StationInfoSheet } from "@/components/map/StationInfoSheet";

const TourMap = dynamic(() => import("@/components/map/TourMap").then((m) => m.TourMap), {
  ssr: false,
  loading: () => (
    <div className="h-72 flex items-center justify-center rounded-3xl glass-card">
      <Spinner />
    </div>
  ),
});

const STATUS_LABEL: Record<ProgressStatus, string> = {
  pending: "טרם בוצע",
  arrived: "הגעתם — סרקו QR",
  unlocked: "פתוח לצפייה",
  watching: "בצפייה",
  completed: "הושלם",
};

function ctaHref(station: Station, status: ProgressStatus): string {
  if (status === "unlocked" || status === "watching" || status === "completed") {
    return `/station/${station.slug}`;
  }
  return `/navigate/${station.slug}`;
}

function ctaLabel(status: ProgressStatus): string {
  switch (status) {
    case "completed":
      return "צפייה חוזרת";
    case "unlocked":
    case "watching":
      return "צפו בסרטון";
    case "arrived":
      return "סרקו QR";
    default:
      return "נווטו לתחנה";
  }
}

export function TourView({
  stations,
  progress,
  session,
}: {
  stations: Station[];
  progress: StationProgress[];
  session: TourSession;
}) {
  const [selected, setSelected] = useState<Station | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  function openStation(station: Station) {
    setSelected(station);
    setSheetOpen(true);
  }

  const progressByStationId = useMemo(() => {
    const map = new Map<string, StationProgress>();
    for (const p of progress) map.set(p.stationId, p);
    return map;
  }, [progress]);

  const statusMap = useMemo(() => {
    const map = new Map<string, ProgressStatus>();
    for (const s of stations) map.set(s.id, progressByStationId.get(s.id)?.status ?? "pending");
    return map;
  }, [stations, progressByStationId]);

  const completedCount = stations.filter((s) => statusMap.get(s.id) === "completed").length;

  const primaryStation = useMemo(() => {
    const ordered = [...stations].sort((a, b) => a.orderIndex - b.orderIndex);
    const readyToWatch = ordered.find((s) => {
      const status = statusMap.get(s.id);
      return status === "unlocked" || status === "watching";
    });
    if (readyToWatch) return readyToWatch;

    const current =
      ordered.find((s) => s.id === session.currentStationId && statusMap.get(s.id) !== "completed") ??
      ordered.find((s) => statusMap.get(s.id) !== "completed");
    return current ?? null;
  }, [stations, statusMap, session.currentStationId]);

  const locatable = stations.filter(isLocatable);

  return (
    <div className="flex flex-col gap-5">
      <header className="pt-2">
        <h1 className="text-2xl font-black">מפת הסיור</h1>
        <ProgressBar completed={completedCount} total={stations.length} className="mt-3" />
      </header>

      <TourMap
        stations={locatable}
        progressByStationId={statusMap}
        onSelectStation={(s) => {
          const full = stations.find((st) => st.id === s.id) ?? (s as Station);
          openStation(full);
        }}
        height={280}
      />

      {primaryStation && (
        <Button href={ctaHref(primaryStation, statusMap.get(primaryStation.id) ?? "pending")} size="lg" fullWidth>
          {ctaLabel(statusMap.get(primaryStation.id) ?? "pending")} — {primaryStation.name}
        </Button>
      )}

      <div className="flex flex-col gap-3">
        {[...stations]
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((station) => {
            const status = statusMap.get(station.id) ?? "pending";
            return (
              <button key={station.id} type="button" onClick={() => openStation(station)} className="text-right">
                <Card className="flex items-center gap-3 py-3 hover:border-gold/50 transition-colors">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-stencil text-lg"
                    style={{
                      background: status === "completed" ? "rgba(0,240,168,0.2)" : "rgba(216,181,122,0.16)",
                      color: status === "completed" ? "#00F0A8" : "#D8B57A",
                    }}
                  >
                    {status === "completed" ? "✓" : station.orderIndex}
                  </span>
                  <div className="flex-1">
                    <CardTitle className="text-base">{station.name}</CardTitle>
                    <CardSubtitle className="text-xs">{STATUS_LABEL[status]}</CardSubtitle>
                  </div>
                </Card>
              </button>
            );
          })}
      </div>

      <StationInfoSheet
        station={selected}
        status={selected ? statusMap.get(selected.id) ?? "pending" : undefined}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}
