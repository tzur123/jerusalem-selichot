"use client";

import { useActionState } from "react";
import type { Station } from "@/types/station";
import { createStationAction, updateStationAction, type StationFormState } from "@/lib/admin/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

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
