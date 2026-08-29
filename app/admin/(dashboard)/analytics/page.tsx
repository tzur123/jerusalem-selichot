import { getAnalyticsSummary } from "@/lib/analytics/summary";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/Card";

export const metadata = { title: "אנליטיקס", robots: { index: false } };

export default async function AdminAnalyticsPage() {
  const summary = await getAnalyticsSummary();
  const completionRate =
    summary.sessionsStarted > 0 ? Math.round((summary.toursCompleted / summary.sessionsStarted) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-black">אנליטיקס</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-3xl font-black text-mint">{summary.sessionsStarted}</p>
          <CardSubtitle>סיורים שהתחילו</CardSubtitle>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-black text-mint">{summary.toursCompleted}</p>
          <CardSubtitle>סיורים שהושלמו</CardSubtitle>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-black text-mint">{completionRate}%</p>
          <CardSubtitle>אחוז השלמה</CardSubtitle>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-black text-mint">{summary.externalMapsClicks}</p>
          <CardSubtitle>מעברים ל-Google Maps</CardSubtitle>
        </Card>
      </div>

      <Card>
        <CardTitle className="mb-4">לפי תחנה</CardTitle>
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-3 text-xs text-muted px-2">
            <span>תחנה</span>
            <span className="text-center">סריקות</span>
            <span className="text-center">השלמות</span>
          </div>
          {summary.perStation.map((row) => (
            <div key={row.stationId} className="grid grid-cols-3 items-center rounded-xl bg-white/5 px-3 py-2">
              <span className="font-semibold truncate">{row.stationName}</span>
              <span className="text-center text-mint font-bold">{row.scans}</span>
              <span className="text-center text-mint font-bold">{row.completions}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
