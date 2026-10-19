import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ASSET_ORIGIN, SITE_NAME, SITE_URL, TITLE_IMAGE } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_NAME,
  keywords: ["gennesis", "dumbass", "stupid", "website", "retro", "ig"],
  authors: [{ name: "gennesis" }],
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: `${ASSET_ORIGIN}/17b101cc0128bc6a.png`, type: "image/png", sizes: "32x32" },
      { url: `${ASSET_ORIGIN}/c5dbdffa64dafd9f.png`, type: "image/png", sizes: "16x16" },
    ],
    apple: [{ url: `${ASSET_ORIGIN}/8130fd5ca623f635.png`, sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_NAME,
    images: [TITLE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_NAME,
    images: [TITLE_IMAGE],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href={ASSET_ORIGIN} crossOrigin="" />
      </head>
      <body>{children}</body>
    </html>
  );
}
