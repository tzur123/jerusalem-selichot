import type { Station } from "@/types/station";

/**
 * Seed / fallback station data.
 *
 * Only station #1 (בית הרב קוק) has real, verified public information
 * (address + coordinates from public heritage-site sources). Per
 * CURSOR.md §24 we must NOT invent names or coordinates for stations 2–5 —
 * they are intentionally left unpublished with empty coordinates until the
 * product owner supplies them via the admin panel.
 *
 * This file backs the in-memory "mock backend" used when Supabase is not
 * configured (see `lib/config/env.ts` → `useMockBackend`), and doubles as
 * the payload for `supabase/seed.sql`.
 */
export const SEED_STATIONS: Station[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    slug: "beit-harav-kook",
    name: "בית הרב קוק",
    shortDescription: "ביתו ומשכנו של הרב אברהם יצחק הכהן קוק, הרב הראשי הראשון לארץ ישראל.",
    longDescription:
      "בית הרב קוק שוכן ברחוב הרב קוק 9 בירושלים, הבית בו חי ופעל הרב אברהם יצחק הכהן קוק בין השנים 1923–1935. כיום משמש הבית כמוזיאון על חייו ופועלו של הרב, ובו גם אולם ישיבת מרכז הרב.",
    address: 'רחוב הרב קוק 9, ירושלים',
    latitude: 31.78333333,
    longitude: 35.22008333,
    orderIndex: 1,
    isDefaultStart: true,
    arrivalRadiusM: 45,
    videoPath: null,
    posterPath: null,
    captionsPath: null,
    isPublished: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    slug: "station-2",
    name: "נקודה 2",
    shortDescription: "תחנה ממתינה להשלמת פרטים על ידי בעל המוצר.",
    longDescription: null,
    address: null,
    latitude: null,
    longitude: null,
    orderIndex: 2,
    isDefaultStart: false,
    arrivalRadiusM: 45,
    videoPath: null,
    posterPath: null,
    captionsPath: null,
    isPublished: false,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    slug: "station-3",
    name: "נקודה 3",
    shortDescription: "תחנה ממתינה להשלמת פרטים על ידי בעל המוצר.",
    longDescription: null,
    address: null,
    latitude: null,
    longitude: null,
    orderIndex: 3,
    isDefaultStart: false,
    arrivalRadiusM: 45,
    videoPath: null,
    posterPath: null,
    captionsPath: null,
    isPublished: false,
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    slug: "station-4",
    name: "נקודה 4",
    shortDescription: "תחנה ממתינה להשלמת פרטים על ידי בעל המוצר.",
    longDescription: null,
    address: null,
    latitude: null,
    longitude: null,
    orderIndex: 4,
    isDefaultStart: false,
    arrivalRadiusM: 45,
    videoPath: null,
    posterPath: null,
    captionsPath: null,
    isPublished: false,
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    slug: "station-5",
    name: "נקודה 5",
    shortDescription: "תחנה ממתינה להשלמת פרטים על ידי בעל המוצר.",
    longDescription: null,
    address: null,
    latitude: null,
    longitude: null,
    orderIndex: 5,
    isDefaultStart: false,
    arrivalRadiusM: 45,
    videoPath: null,
    posterPath: null,
    captionsPath: null,
    isPublished: false,
  },
];
