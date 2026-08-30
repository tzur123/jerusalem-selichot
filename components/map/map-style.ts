/** Shared dark navy Google Maps theme used across the app's map views. */
export const MAP_DARK_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0b1f33" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b1f33" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#93a6b5" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#17324a" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#001b33" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
];

/** A luxurious gold teardrop pin with the station number baked in — used for
 * plain "pick a station" maps that don't carry per-station status colors. */
export function goldPinIcon(google: typeof globalThis.google, order: number): google.maps.Icon {
  const svg = `
    <svg width="38" height="50" viewBox="0 0 38 50" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pinGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#F4E2B8"/>
          <stop offset="100%" stop-color="#C89A4F"/>
        </linearGradient>
      </defs>
      <path d="M19 1.5C9.9 1.5 2.5 8.9 2.5 18c0 12.4 16.5 29.7 16.5 29.7S35.5 30.4 35.5 18C35.5 8.9 28.1 1.5 19 1.5Z"
        fill="url(#pinGrad)" stroke="#4a3418" stroke-width="1.4"/>
      <circle cx="19" cy="18.5" r="10.5" fill="#001B33" stroke="#F4E2B8" stroke-width="1.4"/>
      <text x="19" y="23.5" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="13" font-weight="700" fill="#F4E2B8">${order}</text>
    </svg>`.trim();

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(38, 50),
    anchor: new google.maps.Point(19, 48),
  };
}

/** Same luxurious teardrop shape as {@link goldPinIcon}, but with the outer
 * fill driven by a per-station status color (progress state) instead of a
 * fixed gold gradient — the gold ring/typeface tie it back to the same
 * design language while still communicating tour progress at a glance. */
export function statusPinIcon(google: typeof globalThis.google, order: number, color: string): google.maps.Icon {
  const svg = `
    <svg width="36" height="48" viewBox="0 0 36 48" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 1.5C9.4 1.5 2.5 8.6 2.5 17c0 11.7 15.5 28 15.5 28S33.5 28.7 33.5 17C33.5 8.6 26.6 1.5 18 1.5Z"
        fill="${color}" stroke="#F4E2B8" stroke-opacity="0.55" stroke-width="1.3"/>
      <circle cx="18" cy="17.5" r="10" fill="#001B33" stroke="#F4E2B8" stroke-width="1.3" stroke-opacity="0.85"/>
      <text x="18" y="22" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="12.5" font-weight="700" fill="#F4E2B8">${order}</text>
    </svg>`.trim();

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(36, 48),
    anchor: new google.maps.Point(18, 46),
  };
}
