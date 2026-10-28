"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCentsBDT } from "@/lib/money";

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

function renderHeadline(headline: string) {
  return headline.split(/(\s+)/).map((part, i) => {
    const bare = part.replace(/[.,!?;:]+$/, "").toLowerCase();
    if (bare === "fashion") {
      return (
        <span key={i} className="text-gold-bright">
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
}: {
  headline: string;
  subheadline: string;
  fallbackImageUrl: string | null;
  slides: HeroSlide[];
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

  return (
    <section className="relative overflow-hidden bg-ink">
      <div className="grid lg:grid-cols-2">
        <div className="flex flex-col justify-center px-4 py-16 sm:px-6 lg:px-12 lg:py-0 xl:px-20">
          <div className="max-w-lg">
            <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-paper-dim">
              <span className="size-1.5 shrink-0 rounded-full bg-gold-bright" />
              Authentic Football Jerseys
            </p>
            <h1 className="font-display text-6xl uppercase leading-[0.95] text-paper sm:text-7xl">
              {renderHeadline(headline)}
            </h1>
            <p className="mt-6 text-sm text-paper-dim sm:text-base">
              {subheadline}
            </p>
            <Link href="/shop" className="mt-9 inline-block">
              <Button variant="primary" size="lg" className="group">
                <ArrowRight
                  size={16}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
                SHOP NOW
              </Button>
            </Link>

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
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {isActive && <span className="h-px w-5 bg-gold-bright" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div
          className={`relative h-85 overflow-hidden bg-[radial-gradient(ellipse_at_55%_45%,#2a2a2a_0%,#141414_55%,#0b0b0b_100%)] sm:h-105 lg:h-165 ${HERO_MASK}`}
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
                    <p className="relative text-base font-semibold text-gold-bright sm:text-xl">
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
