"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Flame,
  ShoppingBag,
  Sparkles,
  Tag,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCentsBDT } from "@/lib/money";
import type {
  HeroButtonConfig,
  HeroButtonIcon,
  HeroCustomConfig,
  HeroPromoSlide,
} from "@/lib/data/settings";

export interface HeroSlide {
  id: string;
  // null for a slide that has a custom image but no (or no resolved) linked
  // product — it still shows, just without the name/price card or a link.
  slug: string | null;
  imageUrl: string;
  name: string | null;
  priceCents: number | null;
}

const AUTO_ADVANCE_MS = 5000;
const SLIDE_SLOTS = 3;

// Fades the hero image itself to transparent at the seam (rather than painting a color
// block over it), so it dissolves into the ground behind it with no visible edge at all.
const HERO_MASK =
  "[mask-image:linear-gradient(to_bottom,rgba(0,0,0,0)_0%,rgba(0,0,0,0.05)_15%,rgba(0,0,0,0.16)_28%,rgba(0,0,0,0.34)_40%,rgba(0,0,0,0.56)_52%,rgba(0,0,0,0.76)_64%,rgba(0,0,0,0.9)_76%,rgba(0,0,0,0.98)_88%,rgba(0,0,0,1)_100%)] " +
  "[-webkit-mask-image:linear-gradient(to_bottom,rgba(0,0,0,0)_0%,rgba(0,0,0,0.05)_15%,rgba(0,0,0,0.16)_28%,rgba(0,0,0,0.34)_40%,rgba(0,0,0,0.56)_52%,rgba(0,0,0,0.76)_64%,rgba(0,0,0,0.9)_76%,rgba(0,0,0,0.98)_88%,rgba(0,0,0,1)_100%)] " +
  "lg:[mask-image:linear-gradient(to_right,rgba(0,0,0,0)_0%,rgba(0,0,0,0.05)_15%,rgba(0,0,0,0.16)_28%,rgba(0,0,0,0.34)_40%,rgba(0,0,0,0.56)_52%,rgba(0,0,0,0.76)_64%,rgba(0,0,0,0.9)_76%,rgba(0,0,0,0.98)_88%,rgba(0,0,0,1)_100%)] " +
  "lg:[-webkit-mask-image:linear-gradient(to_right,rgba(0,0,0,0)_0%,rgba(0,0,0,0.05)_15%,rgba(0,0,0,0.16)_28%,rgba(0,0,0,0.34)_40%,rgba(0,0,0,0.56)_52%,rgba(0,0,0,0.76)_64%,rgba(0,0,0,0.9)_76%,rgba(0,0,0,0.98)_88%,rgba(0,0,0,1)_100%)]";

function renderHeadline(headline: string, accentWord = "fashion", accentColor?: string) {
  const targets = accentWord
    .split(",")
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
  if (targets.length === 0) targets.push("fashion");

  return headline.split(/(\s+)/).map((part, i) => {
    const bare = part.replace(/[.,!?;:]+$/, "").toLowerCase();
    if (targets.includes(bare)) {
      return (
        <span
          key={i}
          className="text-gold-bright"
          style={accentColor ? { color: accentColor } : undefined}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

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

function HeroButtonsRow({
  buttons,
}: {
  buttons: HeroButtonConfig[];
}) {
  if (buttons.length === 0) return null;

  return (
    <div className="mt-9 flex flex-wrap items-center gap-3">
      {buttons.map((btn, idx) => {
        const customStyle: React.CSSProperties = {};
        if (btn.bgColor) {
          customStyle.backgroundColor = btn.bgColor;
          customStyle.borderColor = btn.bgColor;
        }
        if (btn.textColor) {
          customStyle.color = btn.textColor;
        }
        const resolvedIcon: HeroButtonIcon =
          btn.icon ?? (idx === 0 ? "arrow-right" : "none");
        return (
          <Link key={btn.id || idx} href={btn.href || "/shop"} className="inline-block">
            <Button
              variant={btn.variant || "primary"}
              size="lg"
              className="group"
              style={Object.keys(customStyle).length > 0 ? customStyle : undefined}
            >
              <ButtonIconGraphic icon={resolvedIcon} />
              {btn.label}
            </Button>
          </Link>
        );
      })}
    </div>
  );
}

function FullWidthBannerSlider({
  promoSlides,
  heroConfig,
}: {
  promoSlides: HeroPromoSlide[];
  heroConfig: HeroCustomConfig;
}) {
  const count = promoSlides.length;
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (count < 2) return;
    const id = setInterval(() => setActive((i) => (i + 1) % count), AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [count]);

  const safeActive = active < count ? active : 0;

  return (
    <section
      className="relative overflow-hidden bg-ink"
      style={heroConfig.bgColor ? { backgroundColor: heroConfig.bgColor } : undefined}
    >
      <div className="relative h-105 w-full sm:h-135 lg:h-165">
        {promoSlides.map((slide, i) => {
          const isCurrent = i === safeActive;
          const isImageOnly = slide.textAlign === "none";
          const slideAccent = slide.accentColor || heroConfig.accentColor || "";
          const slideText = slide.textColor || heroConfig.textColor || "";
          const slideEyebrowColor =
            slide.eyebrowColor || heroConfig.eyebrowColor || heroConfig.subtextColor || "";
          const slideSubtextColor =
            slide.subtextColor || heroConfig.subtextColor || "";
          const activeButtons =
            slide.buttons && slide.buttons.length > 0 ? slide.buttons : heroConfig.buttons;

          const imageNode = (
            <Image
              src={slide.imageUrl}
              alt={slide.headline || `Banner slide ${i + 1}`}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
          );

          if (isImageOnly) {
            return (
              <Link
                key={slide.id}
                href={slide.linkHref || "/shop"}
                aria-hidden={!isCurrent}
                tabIndex={isCurrent ? undefined : -1}
                className={`absolute inset-0 block transition-opacity duration-1000 ease-in-out ${
                  isCurrent ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                {imageNode}
              </Link>
            );
          }

          const alignClasses =
            slide.textAlign === "center"
              ? "items-center text-center mx-auto"
              : "items-start text-left";

          return (
            <div
              key={slide.id}
              aria-hidden={!isCurrent}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isCurrent ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              {imageNode}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundColor: `rgba(11, 11, 11, ${(slide.overlayOpacity ?? 45) / 100})`,
                }}
              />
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-ink via-transparent to-transparent opacity-80" />

              <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-12">
                <div className={`flex max-w-2xl flex-col ${alignClasses}`}>
                  {slide.eyebrow && (
                    <p
                      className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-paper-dim"
                      style={
                        slideEyebrowColor ? { color: slideEyebrowColor } : undefined
                      }
                    >
                      <span
                        className="size-1.5 shrink-0 rounded-full bg-gold-bright"
                        style={slideAccent ? { backgroundColor: slideAccent } : undefined}
                      />
                      {slide.eyebrow}
                    </p>
                  )}
                  {slide.headline && (
                    <h1
                      className="font-display text-5xl uppercase leading-[0.95] text-paper sm:text-7xl"
                      style={slideText ? { color: slideText } : undefined}
                    >
                      {renderHeadline(slide.headline, heroConfig.accentWord, slideAccent)}
                    </h1>
                  )}
                  {slide.subheadline && (
                    <p
                      className="mt-5 max-w-xl text-sm text-paper-dim sm:text-base"
                      style={
                        slideSubtextColor ? { color: slideSubtextColor } : undefined
                      }
                    >
                      {slide.subheadline}
                    </p>
                  )}
                  <HeroButtonsRow buttons={activeButtons} />
                </div>
              </div>
            </div>
          );
        })}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => setActive((safeActive - 1 + count) % count)}
              aria-label="Previous banner"
              className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-gold/30 bg-ink/70 text-paper backdrop-blur-sm transition-colors hover:border-gold-bright hover:text-gold-bright"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => setActive((safeActive + 1) % count)}
              aria-label="Next banner"
              className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-gold/30 bg-ink/70 text-paper backdrop-blur-sm transition-colors hover:border-gold-bright hover:text-gold-bright"
            >
              <ChevronRight size={18} />
            </button>

            <div className="absolute inset-x-0 bottom-6 z-20 flex items-center justify-center gap-5">
              {promoSlides.map((slide, i) => {
                const isActive = i === safeActive;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setActive(i)}
                    aria-label={`Show banner slide ${i + 1}`}
                    className="flex items-center gap-2 text-xs font-semibold tabular-nums"
                  >
                    <span
                      className={isActive ? "text-gold-bright" : "text-paper-dim"}
                      style={
                        isActive && heroConfig.accentColor
                          ? { color: heroConfig.accentColor }
                          : undefined
                      }
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {isActive && (
                      <span
                        className="h-px w-6 bg-gold-bright"
                        style={
                          heroConfig.accentColor
                            ? { backgroundColor: heroConfig.accentColor }
                            : undefined
                        }
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
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
  const count = slides.length;
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (count < 2) return;
    const id = setInterval(
      () => setActive((i) => (i + 1) % count),
      AUTO_ADVANCE_MS,
    );
    return () => clearInterval(id);
  }, [count]);

  if (heroConfig.mode === "full-slider") {
    const effectivePromoSlides: HeroPromoSlide[] =
      heroConfig.promoSlides.length > 0
        ? heroConfig.promoSlides
        : slides.length > 0
          ? slides.map((s) => ({
              id: s.id,
              imageUrl: s.imageUrl,
              imagePublicId: null,
              eyebrow: heroConfig.eyebrow,
              headline,
              subheadline,
              linkHref: s.slug ? `/product/${s.slug}` : "/shop",
              textAlign: "left",
              overlayOpacity: 45,
              eyebrowColor: heroConfig.eyebrowColor,
              textColor: heroConfig.textColor,
              subtextColor: heroConfig.subtextColor,
              accentColor: heroConfig.accentColor,
              buttons: heroConfig.buttons,
            }))
          : fallbackImageUrl
            ? [
                {
                  id: "fallback-promo",
                  imageUrl: fallbackImageUrl,
                  imagePublicId: null,
                  eyebrow: heroConfig.eyebrow,
                  headline,
                  subheadline,
                  linkHref: "/shop",
                  textAlign: "left",
                  overlayOpacity: 45,
                  eyebrowColor: heroConfig.eyebrowColor,
                  textColor: heroConfig.textColor,
                  subtextColor: heroConfig.subtextColor,
                  accentColor: heroConfig.accentColor,
                  buttons: heroConfig.buttons,
                },
              ]
            : [];

    if (effectivePromoSlides.length > 0) {
      return (
        <FullWidthBannerSlider
          promoSlides={effectivePromoSlides}
          heroConfig={heroConfig}
        />
      );
    }
  }

  const sectionBgStyle = heroConfig.bgColor
    ? { backgroundColor: heroConfig.bgColor }
    : undefined;
  const rightBackdropStyle = heroConfig.imageGlowColor
    ? {
        backgroundImage: `radial-gradient(ellipse at 55% 45%, ${heroConfig.imageGlowColor} 0%, ${
          heroConfig.bgColor || "#141414"
        } 55%, ${heroConfig.bgColor || "#0b0b0b"} 100%)`,
      }
    : undefined;

  return (
    <section className="relative overflow-hidden bg-ink" style={sectionBgStyle}>
      <div className="grid lg:grid-cols-2">
        <div className="flex flex-col justify-center px-4 py-16 sm:px-6 lg:px-12 lg:py-0 xl:px-20">
          <div className="max-w-lg">
            {heroConfig.eyebrow && (
              <p
                className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-paper-dim"
                style={
                  heroConfig.eyebrowColor || heroConfig.subtextColor
                    ? { color: heroConfig.eyebrowColor || heroConfig.subtextColor }
                    : undefined
                }
              >
                <span
                  className="size-1.5 shrink-0 rounded-full bg-gold-bright"
                  style={
                    heroConfig.accentColor
                      ? { backgroundColor: heroConfig.accentColor }
                      : undefined
                  }
                />
                {heroConfig.eyebrow}
              </p>
            )}
            <h1
              className="font-display text-6xl uppercase leading-[0.95] text-paper sm:text-7xl"
              style={heroConfig.textColor ? { color: heroConfig.textColor } : undefined}
            >
              {renderHeadline(headline, heroConfig.accentWord, heroConfig.accentColor)}
            </h1>
            <p
              className="mt-6 text-sm text-paper-dim sm:text-base"
              style={
                heroConfig.subtextColor ? { color: heroConfig.subtextColor } : undefined
              }
            >
              {subheadline}
            </p>

            <HeroButtonsRow buttons={heroConfig.buttons} />

            {count > 0 && (
              <div className="mt-10 flex items-center gap-5">
                {Array.from({ length: SLIDE_SLOTS }, (_, i) => {
                  const enabled = i < count;
                  const isActive = enabled && i === active;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={!enabled}
                      onClick={() => enabled && setActive(i)}
                      aria-label={`Show slide ${i + 1}`}
                      className={`flex items-center gap-2 text-xs font-semibold tabular-nums ${
                        enabled ? "" : "cursor-default opacity-40"
                      }`}
                    >
                      <span
                        className={
                          isActive ? "text-gold-bright" : "text-paper-dim"
                        }
                        style={
                          isActive && heroConfig.accentColor
                            ? { color: heroConfig.accentColor }
                            : undefined
                        }
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {isActive && (
                        <span
                          className="h-px w-5 bg-gold-bright"
                          style={
                            heroConfig.accentColor
                              ? { backgroundColor: heroConfig.accentColor }
                              : undefined
                          }
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div
          className={`relative h-85 overflow-hidden bg-[radial-gradient(ellipse_at_55%_45%,#2a2a2a_0%,#141414_55%,#0b0b0b_100%)] sm:h-105 lg:h-165 ${HERO_MASK}`}
          style={rightBackdropStyle}
        >
          {count > 0 ? (
            <>
              {slides.map((slide, i) => {
                const image = (
                  <Image
                    src={slide.imageUrl}
                    alt={slide.name ?? ""}
                    fill
                    priority={i === 0}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                );
                const className = `absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  i === active ? "opacity-100" : "pointer-events-none opacity-0"
                }`;
                return slide.slug ? (
                  <Link
                    key={slide.id}
                    href={`/product/${slide.slug}`}
                    aria-hidden={i !== active}
                    tabIndex={i === active ? undefined : -1}
                    className={className}
                  >
                    {image}
                  </Link>
                ) : (
                  <div key={slide.id} aria-hidden={i !== active} className={className}>
                    {image}
                  </div>
                );
              })}

              {slides.map((slide, i) => {
                // Only product-linked slides have a name/price to show — a
                // custom-image-only slide (no resolved product) renders with
                // no card at all rather than a card with blank fields.
                if (!slide.slug || slide.name === null || slide.priceCents === null) return null;
                return (
                  <Link
                    key={`info-${slide.id}`}
                    href={`/product/${slide.slug}`}
                    aria-hidden={i !== active}
                    tabIndex={i === active ? undefined : -1}
                    className={`absolute inset-x-0 bottom-4 z-10 mx-auto flex w-50 flex-col gap-2 overflow-hidden rounded-2xl border border-gold-bright/25 bg-ink/65 px-3 py-3 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.35),inset_0_-10px_16px_-12px_rgba(255,255,255,0.15)] backdrop-blur-md backdrop-saturate-150 transition-opacity duration-1000 ease-in-out sm:inset-x-auto sm:right-0 sm:bottom-auto sm:top-1/2 sm:mx-0 sm:w-40.5 sm:-translate-y-1/2 sm:gap-2.5 sm:rounded-l-2xl sm:rounded-r-none sm:px-4 sm:py-4 ${
                      i === active
                        ? "opacity-100"
                        : "pointer-events-none opacity-0"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/25 via-white/0 to-transparent"
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -inset-x-2 -top-6 h-10 rotate-2 bg-white/20 blur-md"
                    />
                    <p className="relative text-[10px] font-semibold uppercase leading-normal tracking-widest text-paper sm:text-[11px]">
                      {slide.name}
                    </p>
                    <span className="relative h-px w-6 bg-gold-bright/50" />
                    <p
                      className="relative text-base font-semibold text-gold-bright sm:text-xl"
                      style={
                        heroConfig.accentColor ? { color: heroConfig.accentColor } : undefined
                      }
                    >
                      {formatCentsBDT(slide.priceCents)}
                    </p>
                  </Link>
                );
              })}
            </>
          ) : fallbackImageUrl ? (
            <Image
              src={fallbackImageUrl}
              alt=""
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-ink-raised" />
          )}
        </div>
      </div>
    </section>
  );
}
