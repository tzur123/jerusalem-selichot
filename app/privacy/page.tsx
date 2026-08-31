import { Screen } from "@/components/brand/Screen";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "מדיניות פרטיות",
  description: "מדיניות הפרטיות של אתר סיורי סליחות בירושלים — אילו נתונים נאספים, כיצד הם נשמרים ומשמשים, ומהן זכויותיכם.",
  alternates: { canonical: "/privacy" },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-2">
      <CardTitle>{title}</CardTitle>
      <div className="text-sm text-muted leading-relaxed flex flex-col gap-2">{children}</div>
    </Card>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <Screen className="gap-5" wide>
      <header className="pt-4">
        <h1 className="text-2xl md:text-3xl font-black">מדיניות פרטיות</h1>
        <p className="text-muted text-sm mt-1">
          אתר &quot;סיורי סליחות בירושלים&quot; מכבד את פרטיותכם. מסמך זה מסביר אילו נתונים נאספים בעת השימוש
          באתר ובאפליקציית הסיור, כיצד הם נשמרים ומשמשים, ומהן זכויותיכם.
        </p>
      </header>

      <Section title="אילו נתונים נאספים">
        <ul className="list-disc pr-5 flex flex-col gap-1">
          <li>
            <span className="text-white font-semibold">מזהה סיור אנונימי:</span> בעת תחילת סיור נוצר עוגיית
            מזהה טכני, אקראי וללא זיהוי אישי, שמשמש רק כדי לשמור את התקדמותכם בין התחנות (אילו תחנות נפתחו,
            אילו סרטונים נצפו). המזהה אינו כולל שם, טלפון או כתובת דוא&quot;ל.
          </li>
          <li>
            <span className="text-white font-semibold">מיקום גיאוגרפי:</span> באישורכם המפורש בדפדפן, המיקום
            משמש בזמן אמת בלבד כדי להציג מפה, לחשב מסלול הליכה ולזהות הגעה לתחנה. המיקום אינו נשלח לשרת
            ואינו נשמר — הוא מעובד במכשיר שלכם בלבד.
          </li>
          <li>
            <span className="text-white font-semibold">מצלמה:</span> גישה למצלמה, באישורכם, משמשת אך ורק
            לסריקת קוד ה-QR הפיזי בתחנות. תמונת המצלמה אינה מצולמת, נשמרת או נשלחת לשרת.
          </li>
          <li>
            <span className="text-white font-semibold">נתוני שימוש אנונימיים:</span> אנו אוספים נתונים
            סטטיסטיים בסיסיים כגון צפיות בדפים, התחלת/סיום סיור, הגעה לתחנות וצפייה בסרטונים, לצורך שיפור
            השירות. נתונים אלו אינם כוללים פרטים מזהים ואינם משמשים למעקב פרסומי.
          </li>
        </ul>
      </Section>

      <Section title="כיצד הנתונים משמשים">
        <p>
          הנתונים שנאספים משמשים אך ורק להפעלה תקינה של הסיור (שמירת התקדמות, ניווט, פתיחת תוכן תחנות) ולניתוח
          סטטיסטי כללי שמסייע לעיריית ירושלים ולמפעילי האתר לשפר את החוויה. איננו מוכרים, משכירים או משתפים
          מידע אישי עם צדדים שלישיים למטרות שיווק.
        </p>
      </Section>

      <Section title="שירותי צד שלישי">
        <p>האתר משתמש בשירותי תשתית חיצוניים לצורך הפעלתו התקינה:</p>
        <ul className="list-disc pr-5 flex flex-col gap-1">
          <li>Google Maps — להצגת מפות וחישוב מסלולי הליכה.</li>
          <li>Supabase — אחסון נתוני התחנות, קבצי המדיה והתקדמות הסיור.</li>
          <li>Vercel — אחסון והפעלת האתר עצמו.</li>
        </ul>
        <p>לשירותים אלה מדיניות פרטיות משלהם, החלה על השימוש הטכני שהם עושים בנתונים בעת אספקת השירות.</p>
      </Section>

      <Section title="עוגיות (Cookies)">
        <p>
          האתר משתמש בעוגיה טכנית אחת בלבד — מזהה הסיור האנונימי המתואר לעיל — ובעוגיה נוספת השומרת את
          העדפות הנגישות שבחרתם. לא נעשה שימוש בעוגיות פרסום או מעקב של צדדים שלישיים.
        </p>
      </Section>

      <Section title="זכויותיכם">
        <p>
          מאחר שהאתר אינו אוסף פרטים מזהים אישיים, אין ברשותנו מידע לצפייה, תיקון או מחיקה המקושר לזהותכם.
          ניתן בכל עת למחוק את נתוני הסיור המקומיים על ידי מחיקת נתוני האתר/העוגיות בדפדפן שלכם.
        </p>
      </Section>

      <Section title="פנייה בנושא פרטיות">
        <p>שאלות או בקשות בנוגע למדיניות פרטיות זו ניתן להפנות באמצעות פרטי יצירת הקשר המופיעים בתפריט האתר.</p>
      </Section>

      <Section title="עדכון המדיניות">
        <p>מדיניות פרטיות זו עשויה להתעדכן מעת לעת בהתאם לשינויים באתר או בדרישות הדין, ותפורסם תמיד בעמוד זה.</p>
      </Section>

      <Button href="/" variant="secondary" fullWidth>
        חזרה לדף הבית
      </Button>
    </Screen>
  );
}
