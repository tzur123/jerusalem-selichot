import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { mugrabi, mugrabiStencil, asimon } from "./fonts";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { AppBackground } from "@/components/brand/AppBackground";
import { FloatingControls } from "@/components/ui/FloatingControls";
import { TourTimer } from "@/components/tour/TourTimer";
import { SoundProvider } from "@/lib/sound/SoundProvider";
import { AccessibilityProvider, A11Y_BOOT_SCRIPT } from "@/lib/accessibility/AccessibilityContext";
import { AccessibilityWidget } from "@/components/accessibility/AccessibilityWidget";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { ThirdPartyPageViewTracker } from "@/components/analytics/ThirdPartyPageViewTracker";
import { META_PIXEL_ID, GOOGLE_ADS_ID } from "@/lib/analytics/third-party";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const SITE_TITLE = "סיורי סליחות בירושלים";
const SITE_DESCRIPTION =
  "סיור סליחות עצמאי ברגל בין 5 נקודות ציון בירושלים — ניווט חי, קודי QR וסרטונים שנפתחים בכל תחנה. בקצב שלכם, בלי מדריך ובלי קבוצה.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | סיורי סליחות בירושלים",
  },
  description: SITE_DESCRIPTION,
  applicationName: "סיורי סליחות בירושלים",
  keywords: [
    "סיורי סליחות בירושלים",
    "סיור סליחות",
    "סליחות ירושלים",
    "סיור לילי בירושלים",
    "סיור סליחות עצמאי",
    "העיר העתיקה בלילה",
    "מגדל דוד",
    "תיירות בירושלים",
    "אטרקציות בירושלים",
  ],
  authors: [{ name: "סיורי סליחות בירושלים" }],
  creator: "סיורי סליחות בירושלים",
  publisher: "סיורי סליחות בירושלים",
  category: "travel",
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "סיורי סליחות בירושלים",
    locale: "he_IL",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "סיורי סליחות בירושלים — מגדל דוד בלילה",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: [{ url: "/icons/icon-192" }, { url: "/icons/icon-512" }],
    apple: [{ url: "/icons/icon-192" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // No maximumScale cap: locking pinch-zoom fails WCAG 1.4.4 (Resize Text) /
  // the Israeli IS 5568 standard. Visitors must be able to zoom the page.
  viewportFit: "cover",
  themeColor: "#001b33",
};

/** Site-wide structured data (schema.org). Page-specific data, e.g. the
 *  tour's itinerary, lives on the pages that have the data to back it. */
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: "סיורי סליחות בירושלים",
  description: SITE_DESCRIPTION,
  inLanguage: "he-IL",
  publisher: {
    "@type": "Organization",
    name: "סיורי סליחות בירושלים",
    url: SITE_URL,
    logo: `${SITE_URL}/icons/icon-512`,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${mugrabi.variable} ${mugrabiStencil.variable} ${asimon.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        {/* Applies any saved accessibility preferences before first paint,
            so a returning visitor never sees a flash of un-adjusted content. */}
        <script dangerouslySetInnerHTML={{ __html: A11Y_BOOT_SCRIPT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c") }}
        />

        {/* Meta Pixel */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height={1}
            width={1}
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>

        {/* Google tag (gtag.js) */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-tag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GOOGLE_ADS_ID}');
          `}
        </Script>
      </head>
      <body className="min-h-dvh-safe flex flex-col antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:right-3 focus:z-[100] focus:rounded-xl focus:bg-mint focus:px-4 focus:py-2 focus:text-navy focus:font-bold"
        >
          דלגו לתוכן הראשי
        </a>
        <AccessibilityProvider>
          <SoundProvider>
            <PageViewTracker />
            <ThirdPartyPageViewTracker />
            <AppBackground />
            <OfflineBanner />
            <FloatingControls />
            <TourTimer />
            <AccessibilityWidget />
            <ServiceWorkerRegister />
            {children}
          </SoundProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
