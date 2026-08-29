import localFont from "next/font/local";

/**
 * Mugrabi — display face for large headlines only (hero titles, section
 * titles). Not intended for body copy or UI chrome.
 */
export const mugrabi = localFont({
  src: [
    {
      path: "../public/fonts/mugrabi/mugrabi-light-aaa.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/mugrabi/mugrabi-regular-aaa.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/mugrabi/mugrabi-bold-aaa.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-mugrabi",
  display: "swap",
});

/** Mugrabi Stencil — decorative accent face for badges/step numbers only. */
export const mugrabiStencil = localFont({
  src: "../public/fonts/mugrabi/mugrabi-stencil-aaa.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-mugrabi-stencil",
  display: "swap",
});

/**
 * Asimon — the app's workhorse typeface: body copy, buttons, form fields,
 * navigation, everything that isn't a large headline.
 */
export const asimon = localFont({
  src: [
    {
      path: "../public/fonts/asimon/asimon-light-aaa.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/asimon/asimon-regular-aaa.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/asimon/asimon-medium-aaa.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/asimon/asimon-bold-aaa.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/asimon/asimon-black-aaa.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-asimon",
  display: "swap",
});
