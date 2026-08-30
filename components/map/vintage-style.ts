/**
 * "Old cut-paper" Google Maps theme: warm parchment tones, muted brown roads,
 * hidden POI clutter — used for the station picker so it reads like an
 * antique map rather than a generic tech-blue map.
 */
export const VINTAGE_PAPER_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#e9dcb9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#e9dcb9" }, { weight: 3 }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#5b4636" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#e9dcb9" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#ddc98f" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c3b183" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#5b4636" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#c8a96e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#a9834f" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#b98f57" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#c8a96e" }] },
  { featureType: "road.local", elementType: "geometry", stylers: [{ color: "#d3b98a" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#a9834f" }, { weight: 1 }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
];
