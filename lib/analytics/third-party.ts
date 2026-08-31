/** Meta (Facebook) Pixel ID — public by design, safe to ship in client HTML. */
export const META_PIXEL_ID = "1577256897226771";

/** Google Ads conversion tag ID — public by design, safe to ship in client HTML. */
export const GOOGLE_ADS_ID = "AW-18322713473";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}
