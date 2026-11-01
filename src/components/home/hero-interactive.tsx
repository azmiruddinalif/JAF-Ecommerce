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
  Flame,
  ShoppingBag,
  Tag,
  Zap,
} from "lucide-react";
import { formatCentsBDT } from "@/lib/money";
import type {
  HeroButtonConfig,
  HeroButtonIcon,
  HeroCustomConfig,
  HeroPromoSlide,
} from "@/lib/data/settings";

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

const STADIUM_DAYLIGHT_BG =
  "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=2000&q=85&auto=format";

function ButtonIconGraphic({ icon }: { icon?: HeroButtonIcon }) {
  switch (icon) {
    case "none":
      return null;
    case "shopping-bag":
      return <ShoppingBag size={16} />;
    case "tag":
      return <Tag size={16} />;
    case "sparkles":
      return <Sparkles size={16} />;
    case "flame":
      return <Flame size={16} />;
    case "zap":
      return <Zap size={16} />;
    case "arrow-right":
    default:
      return (
        <ArrowRight
          size={16}
          className="transition-transform duration-200 group-hover:translate-x-1"
        />
      );
  }
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

  // Format active price display (e.g. "BDT 1,200")
  const formattedPrice = currentSlide.priceCents
    ? formatCentsBDT(currentSlide.priceCents)
    : "BDT 1,200";

  return (
    <section className="relative w-full overflow-hidden bg-white text-slate-900 select-none">
      {/* ===================================================================== */}
      {/* 1. DAYLIGHT STADIUM BACKGROUND (Matchday Daylight Arena)              */}
      {/* ===================================================================== */}
      <div className="absolute inset-0 z-0">
        <Image
          src={STADIUM_DAYLIGHT_BG}
          alt="Daylight Football Stadium Matchday Arena"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center filter brightness-[1.03] contrast-[0.98]"
        />

        {/* Sunlight flare & ambient brightness in the upper sky */}
        <div className="pointer-events-none absolute inset-0 bg-radial-at-t from-amber-100/35 via-sky-50/20 to-transparent" />

        {/* Atmospheric White Gradient for text legibility on left (pure minimal white) */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-white/95 via-white/85 to-white/20 sm:via-white/70 sm:to-transparent lg:w-3/5" />

        {/* Multi-angle subtle vignette to frame the open stadium pitch */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-white/90 via-transparent to-transparent lg:from-white/40" />

        {/* Bottom Concrete Stadium Parapet / Railing Geometry */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 sm:h-14 bg-linear-to-t from-slate-900/10 via-slate-900/5 to-transparent border-t border-slate-300/40 backdrop-blur-[2px]" />
      </div>

      {/* ===================================================================== */}
      {/* 2. MAIN STAGE CONTENT (Left Headline + Right Floating Jersey)         */}
      {/* ===================================================================== */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-10 pb-16 sm:px-6 sm:pt-14 sm:pb-20 lg:px-8 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
          {/* ----------------------------------------------------------------- */}
          {/* LEFT COLUMN (Grid 7 cols): Typography, Eyebrow, CTAs, Watermark   */}
          {/* ----------------------------------------------------------------- */}
          <div className="order-2 flex flex-col items-start lg:order-1 lg:col-span-6 xl:col-span-7">
            {/* Tag / Eyebrow Row */}
            <div className="mb-4 sm:mb-6 flex flex-wrap items-center gap-2.5">
              <span className="text-xs sm:text-sm font-black uppercase tracking-[0.22em] text-slate-800">
                2026 MATCHDAY COLLECTION
              </span>
              <span className="rounded-md bg-amber-400 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-950 shadow-xs">
                NEW DROP
              </span>
            </div>

            {/* Massive Condensed Headline — "WEAR THE PASSION." (Original JAF copy to avoid copyright) */}
            <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl xl:text-[96px] uppercase leading-[0.88] tracking-tight text-slate-950 drop-shadow-xs">
              WEAR <br />
              <span className="text-slate-950">THE PASSION.</span>
            </h1>

            {/* Subheadline */}
            <p className="mt-4 sm:mt-6 max-w-xl text-xs sm:text-base leading-relaxed text-slate-600 font-medium">
              {subheadline ||
                "Engineered with authentic matchday mesh, high-definition club crests, and moisture-wicking technology. Hand-inspected quality delivered across Bangladesh."}
            </p>

            {/* CTA Buttons Row (Image 5 style: warm amber pill + outline pill) */}
            <div className="mt-7 sm:mt-9 flex flex-wrap items-center gap-3 sm:gap-4">
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
          {/* RIGHT COLUMN (Grid 5 cols): Suspended Floating Jersey & Badges     */}
          {/* ----------------------------------------------------------------- */}
          <div className="order-1 relative flex items-center justify-center lg:order-2 lg:col-span-6 xl:col-span-5 min-h-[380px] sm:min-h-[460px] lg:min-h-[520px]">
            {/* Top-Right Official Kit Badge (Floating Pill) */}
            <div className="absolute right-0 top-0 z-20 flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-1.5 shadow-sm backdrop-blur-md">
              <span className="text-base">🛡️</span>
              <div className="text-left">
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-950 leading-tight">
                  OFFICIAL KIT
                </div>
                <div className="text-[9px] font-semibold text-slate-500 leading-none">
                  2026 EDITION
                </div>
              </div>
            </div>

            {/* Top Center "NEW DROP" Badge hovering above jersey */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1 z-20">
              <span className="rounded-md bg-amber-400 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-950 shadow-sm">
                NEW DROP
              </span>
            </div>

            {/* Floating Suspended Jersey Container */}
            <div className="relative w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[460px] aspect-square flex items-center justify-center">
              {/* Soft Ground Shadow underneath floating jersey */}
              <div className="absolute bottom-6 h-8 w-3/4 rounded-full bg-slate-950/15 blur-xl pointer-events-none" />

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
                            sizes="(max-width: 768px) 85vw, 45vw"
                            className="object-contain filter drop-shadow-[0_25px_35px_rgba(0,0,0,0.18)] transition-transform duration-500 group-hover:scale-105"
                          />
                        </Link>
                      ) : (
                        <div className="relative w-full h-full flex items-center justify-center">
                          <Image
                            src={slide.imageUrl}
                            alt={slide.name || "Matchday Kit"}
                            fill
                            priority={idx === 0}
                            sizes="(max-width: 768px) 85vw, 45vw"
                            className="object-contain filter drop-shadow-[0_25px_35px_rgba(0,0,0,0.18)]"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Horizontal Leader Line pointing to Price Callout Pill (Image 5 style) */}
                <div className="pointer-events-none absolute right-[-10px] sm:right-2 top-1/2 -translate-y-1/2 z-30 flex items-center">
                  <span className="hidden sm:inline-block w-10 sm:w-16 h-0.5 bg-amber-400" />
                  <div className="rounded-full bg-white/95 px-4 py-1.5 shadow-lg border border-slate-200 backdrop-blur-md">
                    <span className="text-xs sm:text-sm font-extrabold tracking-wide text-slate-950 font-sans">
                      {formattedPrice}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Slide Navigation Dots (Mobile friendly) */}
            <div className="absolute bottom-[-18px] left-1/2 -translate-x-1/2 flex items-center gap-2 sm:hidden z-20">
              {activeSlides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Jump to slide ${i + 1}`}
                  className={`h-1.5 transition-all rounded-full ${
                    i === active ? "w-6 bg-slate-950" : "w-1.5 bg-slate-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* BOTTOM-RIGHT: Technical Bracket Kit Title + Circular Arrow Controls   */}
      {/* Positioned outside max-w-7xl container, at the banner's outer edge   */}
      {/* ===================================================================== */}
      <div className="absolute right-5 bottom-5 sm:right-8 sm:bottom-7 lg:right-10 lg:bottom-8 xl:right-12 xl:bottom-9 z-30 flex flex-col items-end gap-3 sm:gap-4 select-none">
        {/* Technical Bracket + Stacked Kit Title */}
        <div className="flex items-stretch gap-2.5 text-left">
          {/* Architectural bracket with top & bottom ticks */}
          <div className="relative w-1.5 border-l-2 border-white/80 flex flex-col justify-between py-0.5">
            <span className="h-[2px] w-1.5 bg-white/80 block" />
            <span className="h-[2px] w-1.5 bg-white/80 block" />
          </div>

          {/* Stacked typography */}
          <div className="flex flex-col gap-0.5 font-sans uppercase tracking-[0.2em] leading-tight">
            <p className="text-[11px] sm:text-xs font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              {currentSlide.name || "MATCHDAY KIT"}
            </p>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              AUTHENTIC FIT
            </p>
            <p className="text-[9px] sm:text-[10px] font-black text-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              2026
            </p>
          </div>
        </div>

        {/* Circular Navigation Buttons (Dark Translucent Pills from Reference) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous jersey"
            className="size-9 sm:size-10 rounded-full border border-white/30 bg-white/50 text-white backdrop-blur-md shadow-lg hover:bg-black/80 hover:border-white/60 active:scale-95 flex items-center justify-center transition-all cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next jersey"
            className="size-9 sm:size-10 rounded-full border border-white/30 bg-black/50 text-white backdrop-blur-md shadow-lg hover:bg-black/80 hover:border-white/60 active:scale-95 flex items-center justify-center transition-all cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
