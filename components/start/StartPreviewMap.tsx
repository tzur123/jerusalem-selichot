"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { loadGoogleMaps, isGoogleMapsConfigured } from "@/lib/google-maps/loader";
import { MAP_DARK_STYLE, goldPinIcon } from "@/components/map/map-style";
import { getStationPublicMediaUrl } from "@/lib/media/public-url";
import { stationImage } from "@/lib/data/station-image";
import type { Station } from "@/types/station";
import { isLocatable } from "@/types/station";
import { Card, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

function CloseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Always-visible "vintage map" preview shown above the start-flow header -
 * every station pinned at a glance, before the visitor commits to a route.
 * Tapping a pin opens a small card (image, name, navigate + watch-video)
 * right on the map, similar to a listings-map popup.
 */
export function StartPreviewMap({
  stations,
  onNavigate,
  pendingId,
}: {
  stations: Station[];
  onNavigate: (station: Station) => void;
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
    if (!isGoogleMapsConfigured()) return;
    let cancelled = false;

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !mapRef.current) return;

        const center = locatable[0] ?? { latitude: 31.7767, longitude: 35.2345 };
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: center.latitude, lng: center.longitude },
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: false,
          gestureHandling: "cooperative",
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
          map.fitBounds(bounds, 36);
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
  }, []);

  // No Google Maps key configured, or it failed to load - the two buttons
  // below the header still cover starting the tour, so just omit the map.
  if (status === "error") return null;

  return (
    <div
      className="relative w-full overflow-hidden rounded-[28px] ring-[3px] ring-[#e7d8ae]/70 shadow-[0_20px_50px_-18px_rgba(0,0,0,0.75),inset_0_0_46px_14px_rgba(80,58,20,0.4)]"
      style={{ height: "30vh" }}
    >
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center glass-card rounded-none">
          <Spinner />
        </div>
      )}
      <div ref={mapRef} className="h-full w-full" style={{ display: status === "ready" ? "block" : "none" }} />

      {/* Aged-paper vignette + hairline - a nod to an old cut-paper map without
          touching Google's own tile styling (which is what actually renders). */}
      <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-inset ring-gold/25" />
      <div className="pointer-events-none absolute inset-0 rounded-[28px] opacity-[0.08] mix-blend-overlay [background-image:radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:3px_3px]" />

      {selected && (
        <div className="absolute inset-x-2 bottom-2 z-10">
          <Card className="flex gap-2.5 p-2.5 !rounded-2xl">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-1 ring-gold/30">
              <Image
                src={getStationPublicMediaUrl(selected.heroImagePath) ?? stationImage(selected.orderIndex)}
                alt={selected.name}
                fill
                sizes="64px"
                className="object-cover"
              />
              <span className="absolute top-0.5 start-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-navy font-stencil text-[9px] leading-none">
                {selected.orderIndex}
              </span>
            </div>
            <div className="flex flex-1 min-w-0 flex-col justify-between gap-1.5">
              <CardTitle className="text-sm truncate">{selected.name}</CardTitle>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => onNavigate(selected)}
                  disabled={pendingId !== null}
                  className="flex flex-1 items-center justify-center rounded-xl glass-button border border-gold/40 px-2 py-1.5 text-xs font-bold text-white hover:border-gold disabled:opacity-50"
                >
                  {pendingId === selected.id ? <Spinner /> : "????? ???"}
                </button>
                <Link
                  href={`/station/${selected.slug}`}
                  className="flex flex-1 items-center justify-center rounded-xl bg-gradient-to-b from-mint to-[#00d494] px-2 py-1.5 text-center text-xs font-bold text-navy"
                >
                  ?????? ????
                </Link>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="?????"
              className="self-start p-1 text-white/60 transition-colors hover:text-white"
            >
              <CloseIcon />
            </button>
          </Card>
        </div>
      )}
    </div>
  );
}
