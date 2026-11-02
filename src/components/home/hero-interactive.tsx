"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
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
          className="text-amber-500"
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
  const activeBannerBg = bannerImageUrl || fallbackImageUrl || STADIUM_DAYLIGHT_BG;

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

  function handlePrev() {
    setActive((prev) => (prev - 1 + count) % count);
  }

  function handleNext() {
    setActive((prev) => (prev + 1) % count);
  }

  const formattedPrice = currentSlide.priceCents
    ? formatCentsBDT(currentSlide.priceCents)
    : "BDT 1,200";

  return (
    <section className="relative w-full overflow-hidden bg-white text-slate-900 select-none" style={heroConfig?.bgColor ? { backgroundColor: heroConfig.bgColor } : undefined}>
      <div className="absolute inset-0 z-0">
        <Image
          src={activeBannerBg}
          alt="Hero Matchday Banner Background"
          fill
          priority
          sizes="100vw"
          unoptimized={!activeBannerBg.startsWith("/") && !activeBannerBg.includes("res.cloudinary.com")}
          className="object-cover object-center filter brightness-[1.03] contrast-[0.98] saturate-[0.80]"
        />

        {/* Reduced white overlay shade so the stadium background remains clearly visible */}
        <div className="pointer-events-none absolute inset-0 bg-radial-at-t from-amber-100/20 via-transparent to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-white/90 via-white/40 to-transparent sm:from-white/85 sm:via-white/25 sm:to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-white/35 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 sm:h-40 bg-linear-to-t from-white/60 via-white/20 to-transparent" />
      </div>

      <div className="pointer-events-none absolute right-4 sm:right-10 bottom-6 sm:bottom-10 z-10 select-none font-display text-8xl sm:text-9xl lg:text-[140px] xl:text-[160px] font-black tracking-tighter text-slate-900/5 leading-none">
        2026
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-10 pb-16 sm:px-6 sm:pt-14 sm:pb-20 lg:px-8 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="order-2 flex flex-col items-start lg:order-1 lg:col-span-6 xl:col-span-6">
            <div className="mb-4 sm:mb-6 flex flex-wrap items-center gap-2.5">
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
              <span className="rounded-none bg-amber-400 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-950 shadow-xs">
                NEW DROP
              </span>
            </div>

            <h1
              className="font-display text-4xl sm:text-6xl lg:text-7xl uppercase tracking-tight text-slate-950 drop-shadow-xs"
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

            <p
              className="mt-4 sm:mt-6 max-w-xl text-xs sm:text-base leading-relaxed text-slate-600 font-medium"
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
                            ? "group inline-flex items-center justify-center gap-2 rounded-none bg-amber-400 px-5 sm:px-6 py-2.5 sm:py-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-950 border border-amber-500/30 hover:bg-amber-500 active:scale-[0.98] transition-all cursor-pointer"
                            : "inline-flex items-center justify-center gap-2 rounded-none border border-slate-300 bg-white/80 backdrop-blur-xs px-5 sm:px-6 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-900 shadow-2xs hover:border-slate-950 hover:bg-white active:scale-[0.98] transition-all cursor-pointer"
                        }
                      >
                        <span>{btn.label}</span>
                        {(btn.icon === "arrow-right" ||
                          (!btn.icon && isPrimary)) && (
                          <ArrowRight
                            size={14}
                            className="transition-transform duration-200 group-hover:translate-x-1"
                          />
                        )}
                      </Link>
                    );
                  })}
                  {heroConfig.buttons.length === 1 && (
                    <Link
                      href="/category/club-jerseys"
                      className="inline-flex items-center justify-center gap-2 rounded-none border border-slate-300 bg-white/80 backdrop-blur-xs px-5 py-2.5 sm:py-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-900 shadow-2xs hover:border-slate-950 hover:bg-white active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <span>EXPLORE COLLECTION</span>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    href="/shop"
                    className="group inline-flex items-center justify-center gap-2 rounded-none bg-amber-400 px-5 sm:px-6 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-950 border border-amber-500/30 hover:bg-amber-500 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span>SHOP NEW KITS</span>
                    <ArrowRight
                      size={14}
                      className="transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </Link>

                  <Link
                    href="/category/club-jerseys"
                    className="inline-flex items-center justify-center gap-2 rounded-none border border-slate-300 bg-white/80 backdrop-blur-xs px-5 sm:px-6 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-900 shadow-2xs hover:border-slate-950 hover:bg-white active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span>EXPLORE COLLECTION</span>
                  </Link>
                </>
              )}
            </div>

            {/* Micro Feature Badges Row */}
            <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-3 sm:gap-5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-slate-900" />
                <span>OFFICIAL GRADE</span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <Sparkles size={15} className="text-amber-500" />
                <span>2026 DROP</span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <Truck size={15} className="text-slate-900" />
                <span>CASH ON DELIVERY</span>
              </div>
            </div>

            <div className="mt-10 sm:mt-14 flex items-center gap-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
              <span>MORE THAN A JERSEY</span>
              <span className="inline-block h-0.5 w-5 bg-amber-400" />
              <span className="text-slate-600">IT&apos;S A LIFESTYLE</span>
            </div>
          </div>

          <div className="order-1 relative flex items-center justify-center lg:order-2 lg:col-span-6 xl:col-span-6 min-h-120 sm:min-h-145 lg:min-h-165 xl:min-h-185 overflow-visible">
            <div className="absolute left-1/2 -translate-x-1/2 top-1 sm:top-2 z-20 max-w-[90%] flex items-center justify-center select-none">
              <span className="truncate rounded-none bg-amber-400 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-slate-950 shadow-sm">
                {currentSlide.name || "MATCHDAY KIT"}
              </span>
            </div>

            <div className="relative w-full max-w-105 sm:max-w-130 md:max-w-150 lg:max-w-185 xl:max-w-220 h-110 sm:h-135 md:h-155 lg:h-180 xl:h-205 flex items-center justify-center overflow-visible">
              <div className="absolute bottom-2 sm:bottom-4 h-10 sm:h-14 w-4/5 rounded-none bg-slate-950/20 blur-2xl pointer-events-none" />

              <div className="relative w-full h-full animate-jersey-float flex items-center justify-center overflow-visible scale-105 sm:scale-110 lg:scale-120 xl:scale-130 lg:-mr-6 xl:-mr-14">
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

      <div className="absolute left-5 bottom-5 sm:left-8 sm:bottom-7 lg:left-10 lg:bottom-8 xl:left-12 xl:bottom-9 z-30 flex items-center gap-2 sm:gap-3 select-none">
        {activeSlides.map((_, i) => {
          const isActive = i === active;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Jump to slide ${i + 1}`}
              className="group flex items-center gap-1.5 sm:gap-2 py-1.5 cursor-pointer transition-all focus:outline-none"
            >
              <span
                className={`font-mono text-[10px] sm:text-xs font-bold tabular-nums transition-colors ${
                  isActive
                    ? "text-slate-950 font-black"
                    : "text-slate-400 group-hover:text-slate-700"
                }`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={`h-0.5 sm:h-1 transition-all duration-300 rounded-none ${
                  isActive
                    ? "w-7 sm:w-10 bg-amber-400 shadow-xs"
                    : "w-3 sm:w-4 bg-slate-300 group-hover:bg-slate-400 group-hover:w-5"
                }`}
              />
            </button>
          );
        })}
      </div>

      <div className="absolute right-5 bottom-5 sm:right-8 sm:bottom-7 lg:right-10 lg:bottom-8 xl:right-12 xl:bottom-9 z-30 flex items-center gap-2 select-none">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous jersey"
          className="size-8 sm:size-9 rounded-none border border-slate-300 bg-white/90 text-slate-800 backdrop-blur-xs shadow-2xs hover:border-slate-950 hover:bg-white active:scale-95 flex items-center justify-center transition-all cursor-pointer"
        >
          <ChevronLeft size={15} />
        </button>
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next jersey"
          className="size-8 sm:size-9 rounded-none border border-slate-300 bg-white/90 text-slate-800 backdrop-blur-xs shadow-2xs hover:border-slate-950 hover:bg-white active:scale-95 flex items-center justify-center transition-all cursor-pointer"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </section>
  );
}
