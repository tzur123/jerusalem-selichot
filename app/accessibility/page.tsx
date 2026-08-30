import { Screen } from "@/components/brand/Screen";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "הצהרת נגישות",
  description: "הצהרת הנגישות של אתר סיור סליחות ירושלים — התאמות הנגישות הקיימות באתר ופרטי יצירת קשר.",
  alternates: { canonical: "/accessibility" },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-2">
      <CardTitle>{title}</CardTitle>
      <div className="text-sm text-muted leading-relaxed flex flex-col gap-2">{children}</div>
    </Card>
  );
}

export default function AccessibilityStatementPage() {
  return (
    <Screen className="gap-5">
      <header className="pt-4">
        <h1 className="text-2xl font-black">הצהרת נגישות</h1>
        <p className="text-muted text-sm mt-1">
          אתר &quot;סיור סליחות ירושלים&quot; פועל להנגשת השירות הדיגיטלי לכלל הציבור, לרבות אנשים עם מוגבלות.
        </p>
      </header>

      <Section title="התאמות הנגישות באתר">
        <p>
          האתר תוכנן ונבנה תוך שאיפה לעמידה בדרישות תקן ישראלי (ת&quot;י) 5568 להנגשת תכנים באינטרנט, ברמת
          AA, המבוסס על הנחיות WCAG 2.0 של ה-W3C, ובהתאם לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות
          נגישות לשירות), התשע&quot;ג-2013.
        </p>
        <p>בין ההתאמות הקיימות באתר:</p>
        <ul className="list-disc pr-5 flex flex-col gap-1">
          <li>תפריט נגישות צף (הזמין מכל עמוד) המאפשר הגדלת/הקטנת טקסט, ניגודיות גבוהה, גווני אפור, הדגשת קישורים, גופן קריא, עצירת אנימציות, סמן עכבר מוגדל, הדגשת פוקוס למקלדת וריווח טקסט מוגבר.</li>
          <li>אפשרות ניווט וסינון מלא באמצעות מקלדת, כולל קישור &quot;דלגו לתוכן הראשי&quot; בתחילת כל עמוד.</li>
          <li>מבנה סמנטי (כותרות, אזורים וטפסים מתויגים) התומך בקוראי מסך.</li>
          <li>ניגודיות צבעים נבדקת בממשק המוצג כברירת מחדל.</li>
          <li>תמיכה בהגדלת האתר (זום) בדפדפן עד 500% ללא אובדן תוכן או פונקציונליות.</li>
          <li>האתר מותאם לתצוגה בכל גודל מסך (רספונסיבי), כולל מכשירים ניידים.</li>
        </ul>
      </Section>

      <Section title="מגבלות נגישות ידועות">
        <p>
          חרף המאמצים, ייתכנו חלקים באתר שטרם הונגשו במלואם — למשל סרטונים המועלים על ידי בעל האתר עשויים
          שלא לכלול כתוביות בכל עת, והמפות האינטראקטיביות (Google Maps) כפופות לנגישות שמספקת גוגל
          עצמה. אנו פועלים לשפר זאת באופן שוטף.
        </p>
      </Section>

      <Section title="פנייה בנושא נגישות">
        <p>
          נתקלתם בבעיית נגישות באתר, או זקוקים לסיוע / למידע בפורמט נגיש חלופי? נשמח שתפנו אלינו ונטפל
          בפנייה בהקדם האפשרי:
        </p>
        <ul className="flex flex-col gap-1">
          <li>
            <span className="text-white font-semibold">רכז/ת נגישות:</span> [להשלמה בידי בעל האתר]
          </li>
          <li>
            <span className="text-white font-semibold">טלפון:</span> [להשלמה בידי בעל האתר]
          </li>
          <li>
            <span className="text-white font-semibold">דוא&quot;ל:</span> [להשלמה בידי בעל האתר]
          </li>
        </ul>
        <p>
          אם לא קיבלתם מענה מספק, ניתן לפנות לנציבות שוויון זכויות לאנשים עם מוגבלות במשרד המשפטים.
        </p>
      </Section>

      <Section title="עדכון ההצהרה">
        <p>הצהרת נגישות זו נבדקה ועודכנה לאחרונה בהתאם לגרסת האתר הנוכחית.</p>
      </Section>

      <Button href="/" variant="secondary" fullWidth>
        חזרה לדף הבית
      </Button>
    </Screen>
  );
}
