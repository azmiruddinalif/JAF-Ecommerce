import type { SVGProps } from "react";
import Link from "next/link";
import {
  Clock,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { Brand, BrandSlogan } from "./brand";
import { ShowroomStatusBadge } from "./showroom-status-badge";
import { getStoreSettings, DEFAULT_FOOTER_CONFIG } from "@/lib/data/settings";

const currentYear = new Date().getFullYear();

const navigationColumns = [
  {
    number: "01",
    title: "Jerseys",
    links: [
      { label: "All Jerseys", href: "/shop" },
      { label: "Club Kits", href: "/category/club-jerseys" },
      { label: "National Team Kits", href: "/category/national-teams" },
      { label: "Retro Classics", href: "/category/retro" },
    ],
  },
  {
    number: "02",
    title: "Support",
    links: [
      { label: "Delivery & Shipping", href: "/shipping-returns" },
      { label: "Size Exchange Guarantee", href: "/shipping-returns" },
      { label: "My Cart / Order", href: "/cart" },
    ],
  },
  {
    number: "03",
    title: "About",
    links: [
      { label: "About JAF", href: "/about" },
      { label: "Matchday Blog", href: "/blog" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

const trustMarks = [
  "Authentic Club Kits",
  "Doorstep COD Across BD",
  "Instant Size Exchange",
];

export async function Footer() {
  const settings = await getStoreSettings();
  const footerConfig = settings.footerConfig ?? DEFAULT_FOOTER_CONFIG;
  const { socials, shopInfo } = footerConfig;

  const socialLinksList = [
    socials.instagram?.enabled && socials.instagram?.url
      ? { label: "Instagram", href: socials.instagram.url, icon: InstagramIcon }
      : null,
    socials.facebook?.enabled && socials.facebook?.url
      ? { label: "Facebook", href: socials.facebook.url, icon: FacebookIcon }
      : null,
    socials.twitter?.enabled && socials.twitter?.url
      ? { label: "X (Twitter)", href: socials.twitter.url, icon: TwitterIcon }
      : null,
    socials.whatsapp?.enabled && socials.whatsapp?.url
      ? { label: "WhatsApp", href: socials.whatsapp.url, icon: WhatsAppIcon }
      : null,
    socials.tiktok?.enabled && socials.tiktok?.url
      ? { label: "TikTok", href: socials.tiktok.url, icon: TikTokIcon }
      : null,
    socials.telegram?.enabled && socials.telegram?.url
      ? { label: "Telegram", href: socials.telegram.url, icon: TelegramIcon }
      : null,
  ].filter(
    (
      s,
    ): s is {
      label: string;
      href: string;
      icon: (props: SVGProps<SVGSVGElement>) => React.JSX.Element;
    } => s !== null,
  );

  return (
    <footer className="relative overflow-hidden border-t border-slate-200 bg-white text-slate-900">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-amber-400/50 to-transparent"
      />

      <div className="relative mx-auto max-w-7xl px-4 pt-14 pb-12 sm:px-6 lg:px-8">
        {shopInfo.address && (
          <div
            tabIndex={0}
            role="region"
            aria-label="Flagship Showroom & Outlet Location"
            className="group relative mb-12 sm:mb-14 w-full border border-slate-200 bg-slate-50/50 p-5 sm:p-7 transition-colors select-text"
          >
            {/* Header: Title + Live Status Badge */}
            <div className="flex flex-col gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center border border-slate-200 bg-white text-amber-500 shadow-2xs">
                  <MapPin size={14} />
                </span>
                <div>
                  <h3 className="font-display text-xs uppercase tracking-wider text-slate-900 sm:text-sm">
                    Flagship Showroom &amp; Retail Outlet
                  </h3>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
                    Official Physical Store · Dhaka, Bangladesh
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <ShowroomStatusBadge
                  schedule={shopInfo.schedule}
                  fallbackHours={shopInfo.hours}
                />
              </div>
            </div>

            {/* Content: Location details & Contact */}
            <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-8">
              <div className="flex flex-col justify-between gap-3 md:col-span-7">
                <div>
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Store Location &amp; Visit Address
                  </span>
                  <p className="mt-1 text-xs sm:text-sm font-medium leading-relaxed text-slate-800">
                    {shopInfo.address}
                  </p>
                </div>
                {shopInfo.locationBadges && shopInfo.locationBadges.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {shopInfo.locationBadges.map((badge) => (
                      <span
                        key={badge.id || badge.label}
                        className="inline-flex items-center border border-slate-200 bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-slate-600 shadow-2xs"
                      >
                        {badge.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Sleek Direct Contacts & Hours */}
              <div className="flex flex-col justify-between gap-4 border-t border-slate-200/80 pt-4 md:col-span-5 md:border-t-0 md:border-l md:border-slate-200/80 md:pl-8 md:pt-0">
                <div>
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Direct Contact &amp; Order Hotline
                  </span>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {shopInfo.phone && (
                      <a
                        href={`tel:${shopInfo.phone.replace(/[^0-9+]/g, "")}`}
                        className="group inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs font-semibold text-slate-800 shadow-2xs transition-all hover:border-slate-900 hover:bg-slate-900 hover:text-white"
                      >
                        <Phone
                          size={12}
                          className="text-amber-500 transition-colors group-hover:text-white"
                        />
                        <span>{shopInfo.phone}</span>
                      </a>
                    )}
                    {shopInfo.secondaryPhone && (
                      <a
                        href={`tel:${shopInfo.secondaryPhone.replace(/[^0-9+]/g, "")}`}
                        className="group inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs font-semibold text-slate-800 shadow-2xs transition-all hover:border-slate-900 hover:bg-slate-900 hover:text-white"
                      >
                        <Phone
                          size={12}
                          className="text-amber-500 transition-colors group-hover:text-white"
                        />
                        <span>{shopInfo.secondaryPhone}</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  {shopInfo.email && (
                    <a
                      href={`mailto:${shopInfo.email}`}
                      className="group inline-flex items-center gap-1.5 font-mono transition-colors hover:text-slate-900"
                    >
                      <Mail size={12} className="text-amber-500" />
                      <span>{shopInfo.email}</span>
                    </a>
                  )}
                  {shopInfo.hours && (
                    <span className="inline-flex items-center gap-1.5 font-mono">
                      <Clock size={12} className="text-amber-500" />
                      <span>{shopInfo.hours}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid: 12-Column Editorial Hierarchy */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Left Column: Brand & Luxury Story (5 cols on lg) */}
          <div className="flex flex-col gap-4 lg:col-span-5">
            <div className="flex items-center gap-3">
              <Brand size="lg" />
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
                  Authentic Kits
                </p>
                <p className="text-xs font-bold tracking-wider text-slate-800">
                  DHAKA · BANGLADESH
                </p>
              </div>
            </div>

            <BrandSlogan className="text-sm font-semibold tracking-wide text-amber-500" />

            <p className="max-w-md text-xs leading-relaxed text-slate-500 sm:text-sm">
              {shopInfo.aboutText ||
                "Premium football jerseys for those who live the game. Authentic club kits, retro classics, and streetwear-inspired fits crafted with performance fabrics."}
            </p>

            {/* Social Media Dock */}
            {socialLinksList.length > 0 && (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {socialLinksList.map(({ label, href, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className="flex h-9 w-9 items-center justify-center border border-slate-200 bg-white text-slate-500 shadow-2xs transition-all duration-200 hover:border-slate-900 hover:bg-slate-900 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Right Section: Clean 3-Column Navigation Grid (7 cols on lg) */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-10 lg:col-span-7 lg:pt-1">
            {navigationColumns.map((col) => (
              <div key={col.title} className="flex flex-col gap-3.5">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <span className="font-display text-xs tracking-wider text-amber-500">
                    {col.number}
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    {col.title}
                  </h3>
                </div>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center text-xs text-slate-500 transition-colors hover:text-slate-900"
                      >
                        <span className="transition-transform group-hover:translate-x-1">
                          {link.label}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar: Copyright, Trust Badges & Signature */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {currentYear} JAF™. All rights reserved. Crafted for Football Culture.
          </p>

          <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] font-mono uppercase tracking-widest text-slate-400">
            {trustMarks.map((mark, i) => (
              <li key={mark} className="flex items-center gap-3">
                <span>{mark}</span>
                {i < trustMarks.length - 1 && (
                  <span className="text-slate-300">•</span>
                )}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
            <p className="font-serif-italic text-xs font-medium text-amber-600">
              WE ARE THE ION TO FASHION
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 21v-7.2h2.4l.4-2.8h-2.8V9.1c0-.8.2-1.4 1.4-1.4h1.5V5.2C15.9 5.1 15 5 13.9 5c-2.3 0-3.9 1.4-3.9 4v2h-2.4v2.8h2.4V21h3.5Z" />
    </svg>
  );
}

function TwitterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.82 14.16c-.24.68-1.39 1.3-1.92 1.37-.5.07-1.14.1-3.32-.8-2.62-1.08-4.32-3.72-4.45-3.89-.13-.18-1.07-1.42-1.07-2.72 0-1.29.68-1.93.92-2.19.24-.26.53-.33.71-.33.18 0 .36 0 .52.01.17.01.39-.06.61.47.23.55.78 1.91.85 2.05.07.15.11.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.61.17.29.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.35 1.45.29.15.46.13.63-.07.17-.19.74-.86.94-1.15.19-.29.39-.24.66-.14.26.1 1.67.79 1.96.93.29.15.48.22.55.34.07.13.07.74-.17 1.42z" />
    </svg>
  );
}

function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.8 3h-2.6v12.4a2.6 2.6 0 1 1-2.1-2.56V10.2a5.2 5.2 0 1 0 4.7 5.18V9.1a6.7 6.7 0 0 0 3.9 1.26V7.8c-2.1 0-3.9-1.3-3.9-3.3V3Z" />
    </svg>
  );
}

function TelegramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
  );
}
