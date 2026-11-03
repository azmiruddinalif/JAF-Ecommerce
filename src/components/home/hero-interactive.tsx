"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { formatCentsBDT } from "@/lib/money";
import type { HeroCustomConfig } from "@/lib/data/settings";

export interface HeroSlide {
  id: string;
  slug: string | null;
  imageUrl: string;
  name: string | null;
  priceCents: number | null;
}

const AUTO_ADVANCE_MS = 6000;

const DEFAULT_MATCHDAY_SHOWCASE: HeroSlide[] = [
  {
    id: "showcase-madrid",
    slug: "ac-milan-retro-2006",
    imageUrl:
      "https://res.cloudinary.com/dk0xywcum/image/upload/v1793466053/settings/hero-showcase/fql6gbbw3bczyvtx69rs.jpg",
    name: "Madrid 25/26 Home Kit",
    priceCents: 120000,
  },
  {
    id: "showcase-arsenal",
    slug: "ac-milan-retro-2006",
    imageUrl:
      "https://res.cloudinary.com/dk0xywcum/image/upload/v1793466054/settings/hero-showcase/bhfmrrwsfghmrfrb5n97.jpg",
    name: "Arsenal 26/27 Away Jersey",
    priceCents: 120000,
  },
  {
    id: "showcase-brazil",
    slug: "ac-milan-retro-2006",
    imageUrl:
      "https://res.cloudinary.com/dk0xywcum/image/upload/v1793464350/settings/hero-showcase/ry5244fpiykmykt9ubk6.jpg",
    name: "Brazil 1998 Retro Classic",
    priceCents: 185000,
  },
];

const STADIUM_DAYLIGHT_BG = "/images/hero-stadium-daylight.jpg";

function sanitizeBannerUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return STADIUM_DAYLIGHT_BG;
  const trimmed = url.trim();
  if (!trimmed) return STADIUM_DAYLIGHT_BG;
  if (trimmed.includes("unsplash.com/photos/")) {
    const clean = trimmed.split("?")[0].replace(/\/+$/, "");
    const segment = clean.split("/").pop() ?? "";
    const photoId = segment.includes("-") ? segment.split("-").pop() : segment;
    if (photoId && /^[a-zA-Z0-9_]+$/.test(photoId)) {
      return `https://unsplash.com/photos/${photoId}/download?force=true`;
    }
  }
  return trimmed;
}

function renderHeadline(
  headline: string,
  accentWord = "fashion",
  accentColor?: string,
) {
  if (!headline) return null;
  const targets = (accentWord || "")
    .split(",")
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);

  return headline.split(/(\s+)/).map((part, i) => {
    const bare = part.replace(/[.,!?;:]+$/, "").toLowerCase();
    if (targets.length > 0 && targets.includes(bare)) {
      return (
        <span
          key={i}
          className={
            accentColor
              ? undefined
              : "bg-linear-to-br from-amber-300 via-amber-400 to-amber-600 bg-clip-text text-transparent"
          }
          style={accentColor ? { color: accentColor } : undefined}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

export function HeroInteractive({
  headline,
  subheadline,
  bannerImageUrl,
  fallbackImageUrl,
  slides,
  heroConfig,
}: {
  headline: string;
  subheadline: string;
  bannerImageUrl?: string | null;
  fallbackImageUrl?: string | null;
  slides: HeroSlide[];
  heroConfig: HeroCustomConfig;
}) {
  const [bgFailed, setBgFailed] = useState(false);
  const rawBg = bannerImageUrl || fallbackImageUrl;
  const activeBannerBg = bgFailed
    ? STADIUM_DAYLIGHT_BG
    : sanitizeBannerUrl(rawBg);
  const dynamicYear = new Date().getFullYear();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBgFailed(false);
  }, [bannerImageUrl, fallbackImageUrl]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBgFailed(false);
  }, [bannerImageUrl, fallbackImageUrl]);

  const activeSlides = useMemo(() => {
    if (slides.length > 0) {
      if (slides.length >= 3) return slides;
      return [...slides, ...DEFAULT_MATCHDAY_SHOWCASE.slice(slides.length)];
    }
    return DEFAULT_MATCHDAY_SHOWCASE;
  }, [slides]);

  const count = activeSlides.length;
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % count);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [count]);

  const currentSlide = activeSlides[active] ?? activeSlides[0];

  const formattedPrice = currentSlide.priceCents
    ? formatCentsBDT(currentSlide.priceCents)
    : "BDT 1,200";

  return (
    <section
      className="relative w-full overflow-hidden bg-white text-slate-900 select-none"
      style={
        heroConfig?.bgColor
          ? { backgroundColor: heroConfig.bgColor }
          : undefined
      }
    >
      <div className="absolute inset-0 z-0">
        <Image
          src={activeBannerBg}
          alt="Hero Matchday Banner Background"
          fill
          priority
          sizes="100vw"
          unoptimized={
            activeBannerBg.startsWith("/") ||
            (!activeBannerBg.includes("res.cloudinary.com") &&
              !activeBannerBg.includes("images.unsplash.com"))
          }
          onError={() => setBgFailed(true)}
          className="object-cover object-center filter brightness-[1.03] contrast-[1.02] saturate-[0.82]"
        />

        {/* Soft atmospheric white overlay so the stadium background remains clearly visible */}
        <div className="pointer-events-none absolute inset-0 bg-radial-at-t from-amber-100/20 via-transparent to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-radial-at-r from-amber-200/25 via-transparent to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-white/90 via-white/40 to-transparent sm:from-white/85 sm:via-white/25 sm:to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-white/35 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 sm:h-24 bg-linear-to-t from-white/30 to-transparent" />
        {/* Subtle photographic vignette for a richer, more editorial finish */}
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_180px_rgba(9,9,11,0.2)]" />
        {/* Fine film grain for a cinematic, photographic finish */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
          }}
        />
      </div>

      {/* Hairline gold frame — boutique-store finish */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-linear-to-r from-transparent via-amber-400/70 to-transparent" />


      {/* Dynamic Architectural Watermark Year — mix-blend-difference keeps it legible whether it's sitting over the bright pitch or the dark stands, instead of a fixed dark tint that disappears on dark photo areas. Low opacity keeps it a soft watermark rather than a solid block, and it's lifted clear of the wave edge so it never straddles that seam. */}
      <div className="pointer-events-none absolute right-4 sm:right-8 lg:right-12 bottom-20 sm:bottom-24 lg:bottom-28 z-10 mix-blend-difference opacity-30 select-none font-display text-8xl sm:text-9xl lg:text-[140px] xl:text-[170px] font-black tracking-tighter text-slate-400 leading-none">
        {dynamicYear}
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-5 pb-7 sm:px-6 sm:pt-10 sm:pb-20 md:pb-28 lg:px-8 lg:pt-16 lg:pb-32 xl:pb-40">
        <div className="grid grid-cols-1 items-center gap-5 sm:gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="relative order-2 flex flex-col items-start lg:order-1 lg:col-span-6 xl:col-span-6">
            {/* Boutique corner mark */}
            <span className="pointer-events-none absolute -top-3 -left-1 hidden h-4 w-4 border-t-2 border-l-2 border-amber-400/80 sm:block" />

            <div className="mb-4 sm:mb-6 flex flex-wrap items-center gap-2.5">
              <span className="hidden sm:inline-block h-px w-6 bg-amber-400" />
              <span
                className="text-xs sm:text-sm font-semibold uppercase tracking-[0.22em] text-slate-800"
                style={
                  heroConfig?.eyebrowColor
                    ? { color: heroConfig.eyebrowColor }
                    : undefined
                }
              >
                {heroConfig?.eyebrow || "Authentic Football Jerseys"}
              </span>
              <span className="relative overflow-hidden rounded-none bg-linear-to-br from-amber-300 via-amber-400 to-amber-600 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-950 shadow-[0_2px_10px_rgba(217,119,6,0.4)] ring-1 ring-inset ring-amber-200/60">
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/60 to-transparent animate-badge-shine" />
                <span className="relative">NEW DROP</span>
              </span>
            </div>

            <h1
              className={`font-display text-4xl sm:text-6xl lg:text-7xl uppercase tracking-tight drop-shadow-sm ${
                heroConfig?.textColor
                  ? "text-slate-950"
                  : "bg-linear-to-br from-slate-950 via-slate-800 to-slate-600 bg-clip-text text-transparent"
              }`}
              style={
                heroConfig?.textColor
                  ? { color: heroConfig.textColor }
                  : undefined
              }
            >
              {renderHeadline(
                headline || "WE ARE THE DEFINITIVE IN FOOTBALL FASHION",
                heroConfig?.accentWord,
                heroConfig?.accentColor,
              )}
            </h1>
            <span className="mt-3 sm:mt-4 inline-block h-[3px] w-14 sm:w-20 bg-linear-to-r from-amber-400 to-amber-200" />

            <p
              className="mt-4 sm:mt-6 max-w-xl text-xs sm:text-base leading-relaxed text-slate-950 font-medium"
              style={
                heroConfig?.subtextColor
                  ? { color: heroConfig.subtextColor }
                  : undefined
              }
            >
              {subheadline ||
                "Premium football jerseys crafted for the modern fan. Discover iconic club designs, authentic-inspired fits, and timeless football culture blended with contemporary streetwear style."}
            </p>

            <div className="mt-7 sm:mt-9 flex flex-wrap items-center gap-3 sm:gap-4">
              {heroConfig?.buttons && heroConfig.buttons.length > 0 ? (
                <>
                  {heroConfig.buttons.map((btn, idx) => {
                    const isPrimary = btn.variant === "primary";
                    const customStyle: React.CSSProperties = {};
                    if (btn.bgColor) {
                      customStyle.backgroundColor = btn.bgColor;
                      customStyle.borderColor = btn.bgColor;
                    }
                    if (btn.textColor) {
                      customStyle.color = btn.textColor;
                    }

                    return (
                      <Link
                        key={btn.id || idx}
                        href={btn.href || "/shop"}
                        style={
                          Object.keys(customStyle).length > 0
                            ? customStyle
                            : undefined
                        }
                        className={
                          isPrimary
                            ? "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-none bg-amber-400 px-5 sm:px-6 py-2.5 sm:py-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-950 border border-amber-500/30 shadow-[0_10px_28px_-8px_rgba(217,119,6,0.55)] ring-1 ring-inset ring-white/40 hover:bg-amber-500 hover:shadow-[0_14px_32px_-8px_rgba(217,119,6,0.65)] active:scale-[0.98] transition-all cursor-pointer"
                            : "inline-flex items-center justify-center gap-2 rounded-none border border-slate-300 bg-white/80 backdrop-blur-sm px-5 sm:px-6 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-900 shadow-[0_4px_16px_-4px_rgba(15,23,42,0.12)] hover:border-slate-950 hover:bg-white hover:shadow-[0_6px_20px_-4px_rgba(15,23,42,0.18)] active:scale-[0.98] transition-all cursor-pointer"
                        }
                      >
                        {isPrimary && (
                          <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-linear-to-r from-transparent via-white/50 to-transparent -translate-x-[150%] transition-transform duration-700 ease-out group-hover:translate-x-[420%]" />
                        )}
                        <span className="relative">{btn.label}</span>
                        {(btn.icon === "arrow-right" ||
                          (!btn.icon && isPrimary)) && (
                          <ArrowRight
                            size={14}
                            className="relative transition-transform duration-200 group-hover:translate-x-1"
                          />
                        )}
                      </Link>
                    );
                  })}
                  {heroConfig.buttons.length === 1 && (
                    <Link
                      href="/category/club-jerseys"
                      className="inline-flex items-center justify-center gap-2 rounded-none border border-slate-300 bg-white/80 backdrop-blur-sm px-5 py-2.5 sm:py-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-900 shadow-[0_4px_16px_-4px_rgba(15,23,42,0.12)] hover:border-slate-950 hover:bg-white hover:shadow-[0_6px_20px_-4px_rgba(15,23,42,0.18)] active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <span>EXPLORE COLLECTION</span>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    href="/shop"
                    className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-none bg-amber-400 px-5 sm:px-6 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-950 border border-amber-500/30 shadow-[0_10px_28px_-8px_rgba(217,119,6,0.55)] ring-1 ring-inset ring-white/40 hover:bg-amber-500 hover:shadow-[0_14px_32px_-8px_rgba(217,119,6,0.65)] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-linear-to-r from-transparent via-white/50 to-transparent -translate-x-[150%] transition-transform duration-700 ease-out group-hover:translate-x-[420%]" />
                    <span className="relative">SHOP NEW KITS</span>
                    <ArrowRight
                      size={14}
                      className="relative transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </Link>

                  <Link
                    href="/category/club-jerseys"
                    className="inline-flex items-center justify-center gap-2 rounded-none border border-slate-300 bg-white/80 backdrop-blur-sm px-5 sm:px-6 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-900 shadow-[0_4px_16px_-4px_rgba(15,23,42,0.12)] hover:border-slate-950 hover:bg-white hover:shadow-[0_6px_20px_-4px_rgba(15,23,42,0.18)] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span>EXPLORE COLLECTION</span>
                  </Link>
                </>
              )}
            </div>

            {/* Micro Feature Badges Row */}
            <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-2.5 sm:gap-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700">
              <div className="flex items-center gap-2 rounded-none border border-slate-200/80 bg-white/70 backdrop-blur-sm px-3 py-1.5 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.1)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_-4px_rgba(15,23,42,0.18)]">
                <span className="flex size-5 items-center justify-center bg-slate-900/5">
                  <ShieldCheck size={13} className="text-slate-900" />
                </span>
                <span>OFFICIAL GRADE</span>
              </div>
              <div className="flex items-center gap-2 rounded-none border border-amber-300/60 bg-amber-50/70 backdrop-blur-sm px-3 py-1.5 shadow-[0_2px_10px_-4px_rgba(217,119,6,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_-4px_rgba(217,119,6,0.3)]">
                <span className="flex size-5 items-center justify-center bg-amber-400/15">
                  <Sparkles size={13} className="text-amber-500" />
                </span>
                <span>{dynamicYear} DROP</span>
              </div>
              <div className="flex items-center gap-2 rounded-none border border-slate-200/80 bg-white/70 backdrop-blur-sm px-3 py-1.5 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.1)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_-4px_rgba(15,23,42,0.18)]">
                <span className="flex size-5 items-center justify-center bg-slate-900/5">
                  <Truck size={13} className="text-slate-900" />
                </span>
                <span>CASH ON DELIVERY</span>
              </div>
            </div>
          </div>

          <div className="order-1 relative flex items-center justify-center lg:order-2 lg:col-span-6 xl:col-span-6 min-h-80 sm:min-h-120 lg:min-h-140 xl:min-h-160 overflow-visible">
            <div className="absolute left-1/2 -translate-x-1/2 top-1 sm:top-2 z-20 max-w-[90%] flex items-center justify-center select-none">
              <span className="truncate rounded-none bg-amber-400 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-slate-950 shadow-sm">
                {currentSlide.name || "MATCHDAY KIT"}
              </span>
            </div>

            <div className="relative w-full max-w-90 sm:max-w-130 md:max-w-150 lg:max-w-185 xl:max-w-220 h-90 sm:h-135 md:h-155 lg:h-180 xl:h-205 flex items-center justify-center overflow-visible">
              <div className="absolute bottom-2 sm:bottom-4 h-10 sm:h-14 w-4/5 rounded-none bg-slate-950/20 blur-2xl pointer-events-none" />

              <div className="relative w-full h-full animate-jersey-float flex items-center justify-center overflow-visible scale-100 sm:scale-110 lg:scale-120 xl:scale-130 lg:-mr-6 xl:-mr-14">
                {activeSlides.map((slide, idx) => {
                  const isCurrent = idx === active;
                  return (
                    <div
                      key={slide.id}
                      aria-hidden={!isCurrent}
                      className={`absolute inset-0 flex items-center justify-center overflow-visible transition-all duration-700 ease-in-out ${
                        isCurrent
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-95 pointer-events-none"
                      }`}
                    >
                      {slide.slug ? (
                        <Link
                          href={`/product/${slide.slug}`}
                          className="relative w-full h-full flex items-center justify-center cursor-pointer group overflow-visible"
                        >
                          <Image
                            src={slide.imageUrl}
                            alt={slide.name || "Matchday Kit"}
                            fill
                            priority={idx === 0}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 55vw"
                            className="object-contain filter drop-shadow-[0_32px_48px_rgba(0,0,0,0.22)] transition-transform duration-500 group-hover:scale-105"
                          />
                        </Link>
                      ) : (
                        <div className="relative w-full h-full flex items-center justify-center overflow-visible">
                          <Image
                            src={slide.imageUrl}
                            alt={slide.name || "Matchday Kit"}
                            fill
                            priority={idx === 0}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 55vw"
                            className="object-contain filter drop-shadow-[0_32px_48px_rgba(0,0,0,0.22)]"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="pointer-events-none absolute -right-2 sm:-right-4 lg:-right-6 top-1/2 -translate-y-1/2 z-30 flex items-center">
                  <span className="hidden sm:inline-block w-8 sm:w-14 h-0.5 bg-amber-400" />
                  <div className="rounded-none bg-white/95 px-4 py-1.5 shadow-lg border border-slate-200 backdrop-blur-md">
                    <span className="text-xs sm:text-sm font-extrabold tracking-wide text-slate-950 font-sans">
                      {formattedPrice}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: simple soft white fade instead of the angular architectural shape, which reads as clutter at narrow widths. Sits at z-0 (behind the text/badges, above the photo) so it never washes out real content. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-28 w-full bg-linear-to-t from-white via-white/92 via-40% to-transparent sm:hidden" />
      <div className="pointer-events-none absolute inset-x-0 bottom-28 z-0 h-px w-full bg-linear-to-r from-transparent via-amber-400/80 to-transparent sm:hidden" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 hidden w-full overflow-hidden leading-none select-none sm:block">
        <svg
          viewBox="0 0 1440 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="relative block w-full h-24 md:h-32 lg:h-40 xl:h-48 drop-shadow-[0_-6px_16px_rgba(0,0,0,0.04)]"
        >
          {/* Soft translucent facet — extra layered step for a richer transition */}
          <defs>
            <linearGradient
              id="wave-soft-fade"
              x1="0"
              y1="-4"
              x2="0"
              y2="99"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
            </linearGradient>
          </defs>
          <path
            d="M0,98 C140,43 260,-4 400,-4 C700,-4 1000,78 1440,93 L1440,99 C1000,84 700,2 400,2 C260,2 140,49 0,104 Z"
            fill="url(#wave-soft-fade)"
          />

          {/* Top Bevel / Sunlit Facet */}
          <path
            d="M0,104 C140,49 260,2 400,2 C700,2 1000,84 1440,99 L1440,105 C1000,90 700,8 400,8 C260,8 140,55 0,110 Z"
            fill="#f8fafc"
          />

          {/* Main Pure White Architectural Facet — a single flowing curve from left (0, 110) to a soft crest near (400, 8) easing down to (1440, 105) */}
          <path
            d="M0,110 C140,55 260,8 400,8 C700,8 1000,90 1440,105 L1440,160 L0,160 Z"
            fill="#ffffff"
          />

          {/* Gold hairline tracing the architectural edge for a premium finish */}
          <defs>
            <linearGradient id="hero-edge-gold" x1="0" y1="0" x2="1440" y2="0">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0" />
              <stop offset="26%" stopColor="#f59e0b" stopOpacity="0.55" />
              <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.8" />
              <stop offset="74%" stopColor="#f59e0b" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,110 C140,55 260,8 400,8 C700,8 1000,90 1440,105"
            fill="none"
            stroke="url(#hero-edge-gold)"
            strokeWidth="2"
          />
        </svg>
      </div>
    </section>
  );
}
