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

// Curated matchday showcases matching Image 5 aesthetic
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
  fallbackImageUrl,
  slides,
  heroConfig,
}: {
  headline: string;
  subheadline: string;
  fallbackImageUrl: string | null;
  slides: HeroSlide[];
  heroConfig: HeroCustomConfig;
}) {
  // Combine provided slides with default showcases so we always have 3 rich kits
  const activeSlides = useMemo(() => {
    if (slides.length > 0) {
      if (slides.length >= 3) return slides;
      return [...slides, ...DEFAULT_MATCHDAY_SHOWCASE.slice(slides.length)];
    }
    if (fallbackImageUrl) {
      return [
        {
          id: "custom-fallback",
          slug: null,
          imageUrl: fallbackImageUrl,
          name: "JAF Matchday Edition",
          priceCents: 120000,
        },
        ...DEFAULT_MATCHDAY_SHOWCASE.slice(1),
      ];
    }
    return DEFAULT_MATCHDAY_SHOWCASE;
  }, [slides, fallbackImageUrl]);

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
    <section className="relative w-full overflow-hidden bg-white text-slate-900 select-none">
      {/* ===================================================================== */}
      {/* 1. DAYLIGHT STADIUM BACKGROUND WITH SOFT WHITE SHADE (Picture 2 style) */}
      {/* ===================================================================== */}
      <div className="absolute inset-0 z-0">
        <Image
          src={STADIUM_DAYLIGHT_BG}
          alt="Daylight Football Stadium Matchday Arena"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center filter brightness-[1.16] contrast-[0.92] saturate-[0.55]"
        />

        {/* Global soft white wash over entire banner (silvery, bright daylight atmosphere) */}
        <div className="pointer-events-none absolute inset-0 bg-white/20 backdrop-blur-[0.5px]" />

        {/* Sunlight flare & ambient brightness in the upper sky */}
        <div className="pointer-events-none absolute inset-0 bg-radial-at-t from-amber-100/40 via-sky-50/20 to-transparent" />

        {/* Left-to-right soft white gradient (pure minimal white for headlines) */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-white via-white/80 to-white/20 sm:via-white/70 sm:to-white/10" />

        {/* Top sky soft white wash */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-linear-to-b from-white/10 via-white/35 to-transparent" />

        {/* Bottom soft white ground fade blending seamlessly into the page */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 sm:h-52 bg-linear-to-t from-white via-white/70 to-transparent" />
      </div>

      {/* Giant Faint 2026 Watermark in bottom-right (Picture 2 style) */}
      <div className="pointer-events-none absolute right-4 sm:right-10 bottom-6 sm:bottom-10 z-10 select-none font-display text-8xl sm:text-9xl lg:text-[140px] xl:text-[160px] font-black tracking-tighter text-slate-900/5 leading-none">
        2026
      </div>

      {/* ===================================================================== */}
      {/* 2. MAIN STAGE CONTENT (Left Headline + Right Floating Jersey)         */}
      {/* ===================================================================== */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-10 pb-16 sm:px-6 sm:pt-14 sm:pb-20 lg:px-8 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
          {/* ----------------------------------------------------------------- */}
          {/* LEFT COLUMN (Grid 6 cols): Typography, Eyebrow, CTAs, Watermark   */}
          {/* ----------------------------------------------------------------- */}
          <div className="order-2 flex flex-col items-start lg:order-1 lg:col-span-6 xl:col-span-6">
            {/* Tag / Eyebrow Row */}
            <div className="mb-4 sm:mb-6 flex flex-wrap items-center gap-2.5">
              <span
                className="text-xs sm:text-sm font-black uppercase tracking-[0.22em] text-slate-800"
                style={
                  heroConfig?.eyebrowColor
                    ? { color: heroConfig.eyebrowColor }
                    : undefined
                }
              >
                {heroConfig?.eyebrow || "Authentic Football Jerseys"}
              </span>
              <span className="rounded-md bg-amber-400 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-950 shadow-xs">
                NEW DROP
              </span>
            </div>

            {/* Dynamic Headline configured from Dashboard */}
            <h1
              className="font-display text-4xl sm:text-6xl lg:text-7xl xl:text-8xl uppercase leading-[0.92] tracking-tight text-slate-950 drop-shadow-xs"
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

            {/* Subheadline configured from Dashboard */}
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

            {/* CTA Buttons Row from Dashboard Config */}
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
                            ? "group inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-7 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-950 shadow-md shadow-amber-400/25 hover:bg-amber-500 hover:shadow-lg hover:shadow-amber-400/35 active:scale-[0.98] transition-all cursor-pointer"
                            : "inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white/80 backdrop-blur-xs px-7 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 shadow-2xs hover:border-slate-950 hover:bg-white active:scale-[0.98] transition-all cursor-pointer"
                        }
                      >
                        <span>{btn.label}</span>
                        {(btn.icon === "arrow-right" ||
                          (!btn.icon && isPrimary)) && (
                          <ArrowRight
                            size={16}
                            className="transition-transform duration-200 group-hover:translate-x-1"
                          />
                        )}
                      </Link>
                    );
                  })}
                  {heroConfig.buttons.length === 1 && (
                    <Link
                      href="/category/club-jerseys"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white/80 backdrop-blur-xs px-7 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 shadow-2xs hover:border-slate-950 hover:bg-white active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <span>EXPLORE COLLECTION</span>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    href="/shop"
                    className="group inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-7 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-950 shadow-md shadow-amber-400/25 hover:bg-amber-500 hover:shadow-lg hover:shadow-amber-400/35 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span>SHOP NEW KITS</span>
                    <ArrowRight
                      size={16}
                      className="transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </Link>

                  <Link
                    href="/category/club-jerseys"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white/80 backdrop-blur-xs px-7 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 shadow-2xs hover:border-slate-950 hover:bg-white active:scale-[0.98] transition-all cursor-pointer"
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

            {/* Bottom-Left Ethos Watermark (Image 5 style) */}
            <div className="mt-10 sm:mt-14 flex items-center gap-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
              <span>MORE THAN A JERSEY</span>
              <span className="inline-block h-0.5 w-5 bg-amber-400" />
              <span className="text-slate-600">IT&apos;S A LIFESTYLE</span>
            </div>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* RIGHT COLUMN (Grid 6 cols): Suspended Floating Jersey & Badges     */}
          {/* ----------------------------------------------------------------- */}
          <div className="order-1 relative flex items-center justify-center lg:order-2 lg:col-span-6 xl:col-span-6 min-h-[460px] sm:min-h-[560px] lg:min-h-[640px] xl:min-h-[720px]">
            {/* Top-Right Dynamic Kit Title Badge (Picture 2 style in Official Kit position) */}
            <div className="absolute right-0 sm:-right-2 -top-2 sm:-top-3 z-20 flex items-stretch gap-2.5 text-left rounded-xl bg-white/95 backdrop-blur-md px-3.5 sm:px-4 py-2 sm:py-2.5 border border-slate-200/90 shadow-sm select-none transition-all duration-300">
              {/* Architectural bracket with top & bottom ticks */}
              <div className="relative w-1.5 border-l-2 border-slate-950 flex flex-col justify-between py-0.5">
                <span className="h-0.5 w-1.5 bg-slate-950 block" />
                <span className="h-0.5 w-1.5 bg-slate-950 block" />
              </div>

              {/* Dynamic Kit Title Stack */}
              <div className="flex flex-col gap-0.5 font-sans uppercase tracking-[0.18em] leading-tight">
                <p className="text-[11px] sm:text-xs font-black text-slate-950 max-w-44 sm:max-w-64 leading-snug">
                  {currentSlide.name || "MATCHDAY KIT"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 text-[9px] sm:text-[10px] font-extrabold">
                  <span className="text-slate-500">AUTHENTIC FIT</span>
                  <span className="text-amber-500 font-black">• 2026</span>
                </div>
              </div>
            </div>

            {/* Top Center "NEW DROP" Badge hovering above jersey */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1 z-20">
              <span className="rounded-md bg-amber-400 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-950 shadow-sm">
                NEW DROP
              </span>
            </div>

            {/* Floating Suspended Jersey Container (Hero Scale) */}
            <div className="relative w-full max-w-[360px] sm:max-w-[460px] md:max-w-[520px] lg:max-w-[600px] xl:max-w-[680px] h-[400px] sm:h-[500px] md:h-[560px] lg:h-[640px] xl:h-[700px] flex items-center justify-center">
              {/* Soft Ground Shadow underneath floating jersey */}
              <div className="absolute bottom-4 sm:bottom-6 h-8 sm:h-12 w-4/5 rounded-full bg-slate-950/15 blur-xl pointer-events-none" />

              {/* Suspended Jersey with Float Keyframe Animation */}
              <div className="relative w-full h-full animate-jersey-float flex items-center justify-center">
                {activeSlides.map((slide, idx) => {
                  const isCurrent = idx === active;
                  return (
                    <div
                      key={slide.id}
                      aria-hidden={!isCurrent}
                      className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out ${
                        isCurrent
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-95 pointer-events-none"
                      }`}
                    >
                      {slide.slug ? (
                        <Link
                          href={`/product/${slide.slug}`}
                          className="relative w-full h-full flex items-center justify-center cursor-pointer group"
                        >
                          <Image
                            src={slide.imageUrl}
                            alt={slide.name || "Matchday Kit"}
                            fill
                            priority={idx === 0}
                            sizes="(max-width: 768px) 90vw, (max-width: 1200px) 50vw, 45vw"
                            className="object-contain filter drop-shadow-[0_28px_40px_rgba(0,0,0,0.20)] transition-transform duration-500 group-hover:scale-105"
                          />
                        </Link>
                      ) : (
                        <div className="relative w-full h-full flex items-center justify-center">
                          <Image
                            src={slide.imageUrl}
                            alt={slide.name || "Matchday Kit"}
                            fill
                            priority={idx === 0}
                            sizes="(max-width: 768px) 90vw, (max-width: 1200px) 50vw, 45vw"
                            className="object-contain filter drop-shadow-[0_28px_40px_rgba(0,0,0,0.20)]"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Horizontal Leader Line pointing to Price Callout Pill (Image 5 style) */}
                <div className="pointer-events-none absolute -right-2 sm:-right-4 lg:-right-6 top-1/2 -translate-y-1/2 z-30 flex items-center">
                  <span className="hidden sm:inline-block w-8 sm:w-14 h-0.5 bg-amber-400" />
                  <div className="rounded-full bg-white/95 px-4 py-1.5 shadow-lg border border-slate-200 backdrop-blur-md">
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

      {/* ===================================================================== */}
      {/* BOTTOM-LEFT: Slider Indication Lines (Outside container, banner edge) */}
      {/* ===================================================================== */}
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
                className={`h-0.5 sm:h-1 transition-all duration-300 rounded-full ${
                  isActive
                    ? "w-7 sm:w-10 bg-amber-400 shadow-xs"
                    : "w-3 sm:w-4 bg-slate-300 group-hover:bg-slate-400 group-hover:w-5"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* BOTTOM-RIGHT: Circular Navigation Arrow Controls (Outside container)   */}
      {/* ===================================================================== */}
      <div className="absolute right-5 bottom-5 sm:right-8 sm:bottom-7 lg:right-10 lg:bottom-8 xl:right-12 xl:bottom-9 z-30 flex items-center gap-2 select-none">
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous jersey"
          className="size-8 sm:size-9 rounded-full border border-slate-300 bg-white/90 text-slate-800 backdrop-blur-xs shadow-2xs hover:border-slate-950 hover:bg-white active:scale-95 flex items-center justify-center transition-all cursor-pointer"
        >
          <ChevronLeft size={15} />
        </button>
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next jersey"
          className="size-8 sm:size-9 rounded-full border border-slate-300 bg-white/90 text-slate-800 backdrop-blur-xs shadow-2xs hover:border-slate-950 hover:bg-white active:scale-95 flex items-center justify-center transition-all cursor-pointer"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </section>
  );
}
