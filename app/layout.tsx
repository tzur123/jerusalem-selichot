import type { Metadata, Viewport } from "next";
import "./globals.css";
import { mugrabi, mugrabiStencil, asimon } from "./fonts";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { AppBackground } from "@/components/brand/AppBackground";

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
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#001b33",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${mugrabi.variable} ${mugrabiStencil.variable} ${asimon.variable} h-full`}
    >
      <body className="min-h-dvh-safe flex flex-col antialiased">
        <AppBackground />
        <OfflineBanner />
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
