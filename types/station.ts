export type Station = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  longDescription: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  orderIndex: number;
  isDefaultStart: boolean;
  arrivalRadiusM: number;
  videoPath: string | null;
  posterPath: string | null;
  captionsPath: string | null;
  isPublished: boolean;
  /** Public "hero" image shown at the top of the /places/[slug] page, stored in the public `station-public` bucket. */
  heroImagePath: string | null;
  /** Admin-editable overrides for the public /places/[slug] article. Empty fields fall back to the built-in default copy. */
  articleSeoTitle: string | null;
  articleMetaDescription: string | null;
  articleKeywords: string | null;
  articleHeading: string | null;
  articleDuration: string | null;
  articleBody: string | null;
};

/** A station that is guaranteed to have coordinates (safe for map/nav use). */
export type LocatableStation = Station & { latitude: number; longitude: number };

export function isLocatable(station: Station): station is LocatableStation {
  return typeof station.latitude === "number" && typeof station.longitude === "number";
}
