import type { Metadata } from "next";
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
  "JAF is a premium football and sports fashion jersey brand. Authentic club, national team and retro jerseys.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "JAF — We Are The Ion To Fashion",
    template: "%s | JAF",
  },
  description,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    siteName: "JAF",
    type: "website",
    title: "JAF — We Are The Ion To Fashion",
    description,
    images: [{ url: "/logo.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "JAF — We Are The Ion To Fashion",
    description,
    images: ["/logo.png"],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "JAF",
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
      className={`${anton.variable} ${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
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
          footer={<Footer />}
        >
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
