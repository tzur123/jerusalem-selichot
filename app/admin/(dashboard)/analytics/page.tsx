import { getAnalyticsSummary } from "@/lib/analytics/summary";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { formatDurationHebrew } from "@/lib/utils/duration";

export const metadata = { title: "אנליטיקס", robots: { index: false } };

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <Card className="text-center">
      <p className="text-3xl font-black text-mint">{value}</p>
      <CardSubtitle>{label}</CardSubtitle>
    </Card>
  );
}

function FunnelBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/90">{label}</span>
        <span className="text-muted">
          {value} <span className="text-xs">({pct}%)</span>
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full bg-mint" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  const s = await getAnalyticsSummary();

  const avgTourDuration = s.avgTourDurationMs != null ? formatDurationHebrew(s.avgTourDurationMs) : "אין עדיין נתונים";
  const avgEngagement = s.avgEngagementMs != null ? formatDurationHebrew(s.avgEngagementMs) : "אין עדיין נתונים";
  const locationTotal = s.locationGranted + s.locationDenied;
  const locationGrantedPct = locationTotal > 0 ? Math.round((s.locationGranted / locationTotal) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-black">אנליטיקס</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard value={s.homepageViews} label="כניסות לעמוד הבית" />
        <StatCard value={s.totalPageViews} label="סה״כ צפיות בדפים" />
        <StatCard value={s.sessionsStarted} label="סיורים שהתחילו" />
        <StatCard value={s.toursCompleted} label="סיורים שהושלמו" />
        <StatCard value={`${s.completionRatePct}%`} label="אחוז השלמה" />
        <StatCard value={avgTourDuration} label="זמן ממוצע לסיום סיור" />
        <StatCard value={avgEngagement} label="זמן שהייה ממוצע באתר" />
        <StatCard value={s.externalMapsClicks} label="מעברים ל-Google Maps" />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardTitle className="mb-4">איך התחילו את הסיור</CardTitle>
          {s.startModeBreakdown.length === 0 ? (
            <p className="text-muted text-sm">אין עדיין נתונים.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {s.startModeBreakdown.map((row) => (
                <FunnelBar key={row.mode} label={row.label} value={row.count} max={s.sessionsStarted} />
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardTitle className="mb-1">הרשאת מיקום</CardTitle>
          <CardSubtitle className="mb-3">
            {locationTotal > 0 ? `${locationGrantedPct}% אישרו גישה למיקום` : "אין עדיין נתונים"}
          </CardSubtitle>
          <div className="flex flex-col gap-3">
            <FunnelBar label="אושרה" value={s.locationGranted} max={Math.max(locationTotal, 1)} />
            <FunnelBar label="נדחתה" value={s.locationDenied} max={Math.max(locationTotal, 1)} />
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle className="mb-1">משפך צפייה בסרטונים</CardTitle>
        <CardSubtitle className="mb-4">מצטבר על פני כל התחנות</CardSubtitle>
        <div className="flex flex-col gap-3">
          <FunnelBar label="התחילו לצפות" value={s.videoFunnel.started} max={s.videoFunnel.started} />
          <FunnelBar label="הגיעו ל-25%" value={s.videoFunnel.reached25} max={s.videoFunnel.started} />
          <FunnelBar label="הגיעו ל-50%" value={s.videoFunnel.reached50} max={s.videoFunnel.started} />
          <FunnelBar label="הגיעו ל-90%" value={s.videoFunnel.reached90} max={s.videoFunnel.started} />
          <FunnelBar label="סיימו לצפות" value={s.videoFunnel.completed} max={s.videoFunnel.started} />
        </div>
      </Card>

      <Card>
        <CardTitle className="mb-4">לפי תחנה</CardTitle>
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-5 text-xs text-muted px-2 gap-1">
            <span className="col-span-1">תחנה</span>
            <span className="text-center">הגיעו</span>
            <span className="text-center">סרקו QR</span>
            <span className="text-center">התחילו סרטון</span>
            <span className="text-center">סיימו לצפות</span>
          </div>
          {s.perStation.map((row) => (
            <div key={row.stationId} className="grid grid-cols-5 items-center rounded-xl bg-white/5 px-3 py-2 gap-1">
              <span className="font-semibold truncate col-span-1">{row.stationName}</span>
              <span className="text-center text-mint font-bold">{row.arrived}</span>
              <span className="text-center text-mint font-bold">{row.scanned}</span>
              <span className="text-center text-mint font-bold">{row.videoStarted}</span>
              <span className="text-center text-mint font-bold">{row.videoCompleted}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle className="mb-4">הדפים הנצפים ביותר</CardTitle>
        {s.topPages.length === 0 ? (
          <p className="text-muted text-sm">אין עדיין נתונים.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {s.topPages.map((row) => (
              <div key={row.path} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                <span dir="ltr" className="font-mono text-sm text-white/90 truncate">
                  {row.path}
                </span>
                <span className="text-mint font-bold">{row.views}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
