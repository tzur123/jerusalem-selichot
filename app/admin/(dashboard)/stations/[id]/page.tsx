import { notFound } from "next/navigation";
import { getStationById } from "@/lib/data/stations";
import { listQrForStation } from "@/lib/qr/service";
import { StationForm } from "@/components/admin/StationForm";
import { QrManager } from "@/components/admin/QrManager";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "עריכת תחנה", robots: { index: false } };

export default async function AdminStationEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";

  const station = isNew ? undefined : (await getStationById(id)) ?? undefined;
  if (!isNew && !station) notFound();

  const qrCodes = isNew ? [] : await listQrForStation(id);

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">{isNew ? "תחנה חדשה" : `עריכה: ${station?.name}`}</h1>
        <Button href="/admin/stations" variant="ghost">
          חזרה לרשימה
        </Button>
      </div>

      <StationForm station={station} />

      {!isNew && station && (
        <Card className="flex flex-col gap-4">
          <div>
            <CardTitle>מדיה לתחנה</CardTitle>
            <CardSubtitle>העלאה ישירה מהדפדפן ל-Supabase Storage — כולל סרטונים עד 300MB.</CardSubtitle>
          </div>
          <MediaUploader stationId={station.id} kind="video" currentPath={station.videoPath ?? null} />
          <MediaUploader stationId={station.id} kind="poster" currentPath={station.posterPath ?? null} />
          <MediaUploader stationId={station.id} kind="captions" currentPath={station.captionsPath ?? null} />
        </Card>
      )}

      {!isNew && station && <QrManager stationId={station.id} initialCodes={qrCodes} />}
    </div>
  );
}
