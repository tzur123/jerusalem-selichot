"use client";

import { useActionState } from "react";
import type { Station } from "@/types/station";
import { createStationAction, updateStationAction, type StationFormState } from "@/lib/admin/actions";
import { getStationArticle } from "@/lib/content/station-articles";
import { sectionsToArticleBody } from "@/lib/content/article-body";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/Card";

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  errors,
  ...rest
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  errors?: string[];
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm text-muted mb-1">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? undefined}
        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-mint outline-none"
        {...rest}
      />
      {errors?.map((err) => (
        <p key={err} className="text-xs text-red-300 mt-1">
          {err}
        </p>
      ))}
    </div>
  );
}

export function StationForm({ station }: { station?: Station }) {
  const isEdit = Boolean(station);
  const action = isEdit ? updateStationAction.bind(null, station!.id) : createStationAction;
  const [state, formAction, pending] = useActionState<StationFormState, FormData>(action, undefined);

  // Pre-fill the public-page fields from the built-in default copy when the
  // admin hasn't overridden them yet, so editing starts from today's real
  // content instead of a blank form.
  const fallbackArticle = station ? getStationArticle(station.slug) : null;
  const defaultArticleHeading = station?.articleHeading ?? fallbackArticle?.heading ?? "";
  const defaultArticleDuration = station?.articleDuration ?? fallbackArticle?.duration ?? "";
  const defaultArticleSeoTitle = station?.articleSeoTitle ?? fallbackArticle?.seoTitle ?? "";
  const defaultArticleMetaDescription = station?.articleMetaDescription ?? fallbackArticle?.metaDescription ?? "";
  const defaultArticleKeywords =
    station?.articleKeywords ??
    (fallbackArticle ? [fallbackArticle.focusKeyphrase, ...fallbackArticle.secondaryKeyphrases].join(", ") : "");
  const defaultArticleBody =
    station?.articleBody ?? (fallbackArticle ? sectionsToArticleBody(fallbackArticle.sections) : "");

  return (
    <Card>
      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="שם התחנה" name="name" defaultValue={station?.name} required errors={state?.fieldErrors?.name} />
          <Field
            label="Slug (אותיות אנגליות, מקפים)"
            name="slug"
            defaultValue={station?.slug}
            required
            errors={state?.fieldErrors?.slug}
          />
        </div>

        <Field
          label="תיאור קצר"
          name="shortDescription"
          defaultValue={station?.shortDescription ?? ""}
          errors={state?.fieldErrors?.shortDescription}
        />

        <div>
          <label htmlFor="longDescription" className="block text-sm text-muted mb-1">
            תיאור מלא
          </label>
          <textarea
            id="longDescription"
            name="longDescription"
            defaultValue={station?.longDescription ?? ""}
            rows={4}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-mint outline-none"
          />
        </div>

        <Field label="כתובת" name="address" defaultValue={station?.address ?? ""} />

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Latitude"
            name="latitude"
            type="number"
            step="any"
            defaultValue={station?.latitude ?? ""}
            errors={state?.fieldErrors?.latitude}
          />
          <Field
            label="Longitude"
            name="longitude"
            type="number"
            step="any"
            defaultValue={station?.longitude ?? ""}
            errors={state?.fieldErrors?.longitude}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="סדר במסלול"
            name="orderIndex"
            type="number"
            min={1}
            defaultValue={station?.orderIndex ?? 1}
            required
          />
          <Field
            label="רדיוס הגעה (מטרים)"
            name="arrivalRadiusM"
            type="number"
            min={5}
            max={500}
            defaultValue={station?.arrivalRadiusM ?? 45}
            required
          />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isDefaultStart" defaultChecked={station?.isDefaultStart} className="h-5 w-5" />
            נקודת פתיחה מומלצת
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isPublished" defaultChecked={station?.isPublished} className="h-5 w-5" />
            מפורסם
          </label>
        </div>

        <hr className="border-white/10" />
        <p className="text-sm text-muted -mb-2">
          נתיבי מדיה ב-Supabase Storage (bucket <code>station-videos</code>). ניתן להזין ידנית או להעלות למטה
          לאחר שמירת התחנה.
        </p>
        <Field label="נתיב וידאו" name="videoPath" defaultValue={station?.videoPath ?? ""} />
        <Field label="נתיב תמונת קאבר" name="posterPath" defaultValue={station?.posterPath ?? ""} />
        <Field label="נתיב כתוביות (WebVTT)" name="captionsPath" defaultValue={station?.captionsPath ?? ""} />

        <hr className="border-white/10" />
        <div>
          <CardTitle>דף המידע הציבורי (SEO)</CardTitle>
          <CardSubtitle>
            התוכן שמוצג בעמוד הציבורי של המיקום (<code>/places/{station?.slug || "..."}</code>), הנגיש לכל אחד
            וללא צורך בסיור פעיל. השדות כאן מגיעים ממולאים מהתוכן הקיים — אפשר לערוך ולשמור.
          </CardSubtitle>
        </div>

        <Field label="כותרת המאמר (H1)" name="articleHeading" defaultValue={defaultArticleHeading} />
        <Field label="משך ביקור מומלץ" name="articleDuration" defaultValue={defaultArticleDuration} />
        <Field label="כותרת SEO (תג Title)" name="articleSeoTitle" defaultValue={defaultArticleSeoTitle} />

        <div>
          <label htmlFor="articleMetaDescription" className="block text-sm text-muted mb-1">
            תיאור מטא (SEO)
          </label>
          <textarea
            id="articleMetaDescription"
            name="articleMetaDescription"
            defaultValue={defaultArticleMetaDescription}
            rows={2}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-mint outline-none"
          />
        </div>

        <Field
          label="מילות מפתח (מופרדות בפסיקים)"
          name="articleKeywords"
          defaultValue={defaultArticleKeywords}
        />

        <div>
          <label htmlFor="articleBody" className="block text-sm text-muted mb-1">
            תוכן המאמר
          </label>
          <p className="text-xs text-muted mb-2">
            כל פסקה בשורה נפרדת, עם שורה ריקה בין פסקה לפסקה. כדי להוסיף כותרת משנה, התחילו שורה ב־
            <code className="text-white/80">## </code> (למשל: <code className="text-white/80">## הסיפור מתחיל</code>).
          </p>
          <textarea
            id="articleBody"
            name="articleBody"
            defaultValue={defaultArticleBody}
            rows={16}
            dir="rtl"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-mint outline-none font-mono text-sm leading-relaxed"
          />
        </div>

        {station && (
          <p className="text-xs text-muted">
            להחלפת התמונה הראשית של המיקום — גללו למטה ל&quot;מדיה לתחנה&quot; ותעלו קובץ תחת &quot;תמונה
            ראשית&quot;.
          </p>
        )}

        {state?.error && (
          <p role="alert" className="text-sm text-red-300">
            {state.error}
          </p>
        )}

        <Button type="submit" fullWidth disabled={pending}>
          {pending ? "שומרים..." : isEdit ? "שמירת שינויים" : "יצירת תחנה"}
        </Button>
      </form>
    </Card>
  );
}
