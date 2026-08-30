import type { Metadata, Viewport } from "next";
import "./globals.css";
import { mugrabi, mugrabiStencil, asimon } from "./fonts";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { AppBackground } from "@/components/brand/AppBackground";
import { FloatingControls } from "@/components/ui/FloatingControls";
import { SoundProvider } from "@/lib/sound/SoundProvider";
import { AccessibilityProvider, A11Y_BOOT_SCRIPT } from "@/lib/accessibility/AccessibilityContext";
import { AccessibilityWidget } from "@/components/accessibility/AccessibilityWidget";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "ירושלים — סיור סליחות דיגיטלי",
    template: "%s | סיור סליחות ירושלים",
  },
  description:
    "5 תחנות. סיפור אחד. סיור סליחות עצמאי בירושלים — ניווט, QR וסרטונים בכף היד.",
  applicationName: "סיור סליחות ירושלים",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "ירושלים — סיור סליחות דיגיטלי",
    description: "5 תחנות. סיפור אחד. ירושלים בלילה.",
    locale: "he_IL",
    type: "website",
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
            <AppBackground />
            <OfflineBanner />
            <FloatingControls />
            <AccessibilityWidget />
            <ServiceWorkerRegister />
            {children}
          </SoundProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
