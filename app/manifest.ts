import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "סיורי סליחות בירושלים",
    short_name: "סליחות ירושלים",
    description: "5 תחנות. סיפור אחד. סיור סליחות עצמאי בירושלים.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#001B33",
    theme_color: "#001B33",
    lang: "he",
    dir: "rtl",
    icons: [
      { src: "/icons/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
