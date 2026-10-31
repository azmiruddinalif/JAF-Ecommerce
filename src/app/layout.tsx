import type { Metadata, Viewport } from "next";
import { Anton, Inter, Playfair_Display } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { AnnouncementBar, AnnouncementBarSkeleton } from "@/components/layout/announcement-bar";
import { NavbarServer, NavbarSkeleton } from "@/components/layout/navbar-server";
import { Footer } from "@/components/layout/footer";
import { SiteChrome } from "@/components/layout/site-chrome";

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const description =
  "Shop authentic football jerseys, club kits, national team shirts, and retro soccer apparel at JAF (Jerseys & Fashion). Premium matchday and streetwear football kits delivered nationwide with Cash on Delivery.";

export const viewport: Viewport = {
  themeColor: "#0a0b09",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.jpg", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icon.jpg", sizes: "any" },
    ],
    shortcut: "/icon.jpg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "JAF",
  },
  title: {
    default: "JAF — Authentic Football Jerseys, Club Kits & Retro Soccer Apparel",
    template: "%s | JAF — Jerseys & Fashion",
  },
  description,
  keywords: [
    "football jerseys",
    "soccer jerseys",
    "club football kits",
    "national team jerseys",
    "retro football shirts",
    "home away third kits",
    "premier league jerseys",
    "la liga jerseys",
    "football streetwear",
    "buy football jersey online Bangladesh",
    "JAF Jerseys and Fashion",
  ],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    siteName: "JAF — Jerseys & Fashion",
    type: "website",
    title: "JAF — Authentic Football Jerseys, Club Kits & Retro Soccer Apparel",
    description,
    images: [{ url: "/logo.png", alt: "JAF — Jerseys & Fashion" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "JAF — Authentic Football Jerseys, Club Kits & Retro Soccer Apparel",
    description,
    images: ["/logo.png"],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SportingGoodsStore",
  name: "JAF — Jerseys & Fashion",
  description,
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "JAF",
  url: siteUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/shop?query={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${anton.variable} ${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <SiteChrome
          announcementBar={
            <Suspense fallback={<AnnouncementBarSkeleton />}>
              <AnnouncementBar />
            </Suspense>
          }
          navbar={
            <Suspense fallback={<NavbarSkeleton />}>
              <NavbarServer />
            </Suspense>
          }
          footer={
            <Suspense fallback={<footer className="h-64 border-t border-ink-border bg-ink" />}>
              <Footer />
            </Suspense>
          }
        >
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
