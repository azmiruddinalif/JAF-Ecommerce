import type { SVGProps } from "react";
import Link from "next/link";
import { Brand, BrandSlogan } from "./brand";

const currentYear = new Date().getFullYear();

const columns = [
  {
    number: "01",
    title: "Shop",
    links: [
      { label: "All Products", href: "/shop" },
      { label: "New Arrivals", href: "/shop?sort=newest" },
      { label: "Featured", href: "/shop?sort=featured" },
    ],
  },
  {
    number: "02",
    title: "Customer Support",
    links: [
      { label: "Shipping & Returns", href: "/shipping-returns" },
      { label: "Size Guide", href: "/shop" },
      { label: "Track Order", href: "/cart" },
    ],
  },
  {
    number: "03",
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

const socials = [
  { label: "Instagram", href: "#", icon: InstagramIcon },
  { label: "Facebook", href: "#", icon: FacebookIcon },
  { label: "TikTok", href: "#", icon: TikTokIcon },
];

const trustMarks = ["Authentic Kits", "Secure Checkout", "Worldwide Shipping"];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-ink-border bg-ink">
      {/* jersey mesh / pinstripe texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, var(--color-gold-bright) 0px, var(--color-gold-bright) 1px, transparent 1px, transparent 34px)",
        }}
      />
      {/* oversized back-number watermark */}
      <span
        aria-hidden
        className="font-display pointer-events-none absolute -right-6 -top-10 select-none text-[220px] leading-none text-paper/[0.035] sm:text-[320px]"
      >
        07
      </span>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-bright to-transparent"
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-2 gap-10 px-4 py-16 sm:px-6 md:grid-cols-5 lg:px-8">
        <div className="col-span-2 flex flex-col gap-4">
          <div className="relative w-fit">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-6 -z-10 rounded-full bg-gold/10 blur-2xl"
            />
            <Brand size="lg" />
          </div>
          <BrandSlogan className="text-sm" />
          <p className="max-w-xs text-sm leading-relaxed text-paper-dim">
            Premium kits for those who live the game. Obsessed over fit, fabric and finish —
            matchday after matchday.
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold/70">
            Est. 2024 · Crafted For The Culture
          </p>
          <div className="mt-2 flex gap-3">
            {socials.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="group flex h-10 w-10 items-center justify-center border border-gold/30 bg-ink-raised text-paper-dim transition-all duration-200 hover:-translate-y-0.5 hover:border-gold-bright hover:bg-gold-bright hover:text-ink hover:shadow-[0_0_20px_-4px_var(--color-gold-bright)]"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="mb-4 flex items-baseline gap-2 text-xs font-semibold uppercase tracking-widest text-paper-dim">
              <span className="font-display text-gold-bright">{col.number}</span>
              {col.title}
            </h3>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="relative text-sm text-paper transition-colors hover:text-gold-bright"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="relative border-t border-dashed border-ink-border px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-paper-dim">© {currentYear} JAF. All rights reserved.</p>
          <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-paper-dim">
            {trustMarks.map((mark, i) => (
              <li key={mark} className="flex items-center gap-3">
                {mark}
                {i < trustMarks.length - 1 && <span className="text-gold/50">•</span>}
              </li>
            ))}
          </ul>
          <p className="font-serif-italic text-sm text-gold/80">WE ARE THE ION TO FASHION</p>
        </div>
      </div>
    </footer>
  );
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
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

function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.8 3h-2.6v12.4a2.6 2.6 0 1 1-2.1-2.56V10.2a5.2 5.2 0 1 0 4.7 5.18V9.1a6.7 6.7 0 0 0 3.9 1.26V7.8c-2.1 0-3.9-1.3-3.9-3.3V3Z" />
    </svg>
  );
}
