"use client";

import Image from "next/image";
import type { Station } from "@/types/station";
import type { ProgressStatus } from "@/lib/supabase/types";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { stationImage } from "@/lib/data/station-image";
import { getStationPublicMediaUrl } from "@/lib/media/public-url";

const STATUS_LABEL: Record<ProgressStatus, string> = {
  pending: "טרם בוצע",
  arrived: "הגעתם — סרקו QR",
  unlocked: "פתוח לצפייה",
  watching: "בצפייה",
  completed: "הושלם ✓",
};

export function StationInfoSheet({
  station,
  status,
  open,
  onClose,
}: {
  station: Station | null;
  status?: ProgressStatus;
  open: boolean;
  onClose: () => void;
}) {
  const unlocked = status === "unlocked" || status === "watching" || status === "completed";

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      headerImage={
        station && (
          <div className="relative h-56 w-full">
            <Image
              src={getStationPublicMediaUrl(station.heroImagePath) ?? stationImage(station.orderIndex)}
              alt={station.name}
              fill
              sizes="(max-width: 512px) 100vw, 512px"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/35 to-transparent" />
            <span className="absolute top-4 start-4 flex h-11 w-11 items-center justify-center rounded-full bg-gold text-navy font-stencil text-xl shadow-[0_4px_16px_-2px_rgba(216,181,122,0.7)]">
              {station.orderIndex}
            </span>
            <div className="absolute inset-x-6 bottom-3">
              <h2 className="font-heading text-2xl font-bold text-white drop-shadow-lg">{station.name}</h2>
              {status && <p className="text-xs text-gold mt-0.5">{STATUS_LABEL[status]}</p>}
            </div>
          </div>
        )
      }
    >
      {station && (
        <div className="flex flex-col gap-4 pt-2">
          {station.shortDescription && (
            <p className="text-sm leading-relaxed text-muted">{station.shortDescription}</p>
          )}
          {station.address && <p className="text-xs text-white/50">{station.address}</p>}

          <div className="flex flex-col gap-2 pt-1">
            <Button href={`/navigate/${station.slug}`} size="lg" fullWidth>
              נווטו לתחנה
            </Button>
            {unlocked && (
              <Button href={`/station/${station.slug}`} variant="secondary" fullWidth>
                צפו בסרטון
              </Button>
            )}
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
