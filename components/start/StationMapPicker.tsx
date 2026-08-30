"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps, isGoogleMapsConfigured } from "@/lib/google-maps/loader";
import { MAP_DARK_STYLE, goldPinIcon } from "@/components/map/map-style";
import type { Station } from "@/types/station";
import { isLocatable } from "@/types/station";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

export function StationMapPicker({
  stations,
  open,
  onClose,
  onSelect,
  pendingId,
}: {
  stations: Station[];
  open: boolean;
  onClose: () => void;
  onSelect: (station: Station) => void;
  pendingId: string | null;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const markers = useRef<google.maps.Marker[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(() =>
    isGoogleMapsConfigured() ? "loading" : "error"
  );
  const [selected, setSelected] = useState<Station | null>(null);

  const locatable = stations.filter(isLocatable);

  useEffect(() => {
    if (!open || !isGoogleMapsConfigured()) return;

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setStatus("loading");
      setSelected(null);
    });

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !mapRef.current) return;

        const center = locatable[0] ?? { latitude: 31.7767, longitude: 35.2345 };
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: center.latitude, lng: center.longitude },
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
          styles: MAP_DARK_STYLE,
        });

        markers.current = locatable.map((station) => {
          const marker = new google.maps.Marker({
            position: { lat: station.latitude, lng: station.longitude },
            map,
            icon: goldPinIcon(google, station.orderIndex),
            title: station.name,
            optimized: false,
          });
          marker.addListener("click", () => setSelected(station));
          return marker;
        });

        if (locatable.length > 1) {
          const bounds = new google.maps.LatLngBounds();
          locatable.forEach((s) => bounds.extend({ lat: s.latitude, lng: s.longitude }));
          map.fitBounds(bounds, 48);
        }

        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      markers.current.forEach((m) => m.setMap(null));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <BottomSheet open={open} onClose={onClose} title="בחרו תחנה על המפה">
      {status !== "error" && (
        <div className="relative h-[56vh] max-h-[26rem] w-full overflow-hidden rounded-2xl ring-1 ring-gold/20 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.6)]">
          {status === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center glass-card rounded-2xl">
              <Spinner />
            </div>
          )}
          <div ref={mapRef} className="h-full w-full" style={{ display: status === "ready" ? "block" : "none" }} />

          {selected && (
            <div className="absolute inset-x-3 bottom-3 z-10">
              <Card className="flex items-center gap-3 py-3 px-4 !rounded-2xl">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold text-navy font-stencil text-lg">
                  {selected.orderIndex}
                </span>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">{selected.name}</CardTitle>
                  {selected.shortDescription && (
                    <CardSubtitle className="text-xs line-clamp-1">{selected.shortDescription}</CardSubtitle>
                  )}
                </div>
                <Button
                  size="md"
                  onClick={() => onSelect(selected)}
                  disabled={pendingId !== null}
                  className="shrink-0"
                >
                  {pendingId === selected.id ? <Spinner /> : "התחילו מכאן"}
                </Button>
              </Card>
            </div>
          )}
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">המפה אינה זמינה כרגע. אפשר לבחור תחנה מהרשימה:</p>
          {stations.map((station) => (
            <button
              key={station.id}
              type="button"
              onClick={() => onSelect(station)}
              disabled={pendingId !== null}
              className="text-right disabled:cursor-default"
            >
              <Card className="flex items-center gap-3 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold font-stencil ring-1 ring-gold/30">
                  {station.orderIndex}
                </span>
                <div className="flex-1">
                  <CardTitle className="text-base">{station.name}</CardTitle>
                  {station.address && <CardSubtitle className="text-xs">{station.address}</CardSubtitle>}
                </div>
                {pendingId === station.id && <Spinner />}
              </Card>
            </button>
          ))}
        </div>
      )}
    </BottomSheet>
  );
}
