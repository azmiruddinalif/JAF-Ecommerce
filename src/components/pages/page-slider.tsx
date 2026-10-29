"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PageSlide } from "@/lib/data/pages";

const AUTO_ADVANCE_MS = 5000;

export function PageSlider({ slides }: { slides: PageSlide[] }) {
  const [active, setActive] = useState(0);
  const count = slides.length;

  useEffect(() => {
    if (count < 2) return;
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % count);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [count]);

  if (count === 0) return null;

  const safeIndex = active < count ? active : 0;

  return (
    <div className="mb-10">
      <div className="relative aspect-16/9 w-full overflow-hidden border border-ink-border bg-ink-raised sm:aspect-21/9">
        {slides.map((slide, i) => {
          const isCurrent = i === safeIndex;
          const hasOverlayText = Boolean(slide.heading || slide.subheading || slide.ctaLabel);

          return (
            <div
              key={slide.id}
              aria-hidden={!isCurrent}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isCurrent ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <Image
                src={slide.imageUrl}
                alt={slide.heading || `Slide ${i + 1}`}
                fill
                priority={i === 0}
                sizes="(max-width: 1024px) 100vw, 896px"
                className="object-cover"
              />
              {hasOverlayText && (
                <>
                  <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/45 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex flex-col items-start justify-end p-6 sm:p-10">
                    {slide.heading && (
                      <h2 className="font-display text-2xl uppercase text-paper sm:text-4xl">
                        {slide.heading}
                      </h2>
                    )}
                    {slide.subheading && (
                      <p className="mt-2 max-w-xl text-xs leading-relaxed text-paper/85 sm:text-sm">
                        {slide.subheading}
                      </p>
                    )}
                    {slide.ctaLabel && slide.ctaHref && (
                      <Link href={slide.ctaHref} className="mt-4 inline-block">
                        <Button variant="primary" size="md">
                          {slide.ctaLabel}
                        </Button>
                      </Link>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => setActive((safeIndex - 1 + count) % count)}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center border border-ink-border bg-ink/75 text-paper transition-colors hover:border-gold hover:text-gold"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => setActive((safeIndex + 1) % count)}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center border border-ink-border bg-ink/75 text-paper transition-colors hover:border-gold hover:text-gold"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4">
          {slides.map((slide, i) => {
            const isCurrent = i === safeIndex;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="flex items-center gap-2 text-xs font-semibold tabular-nums"
              >
                <span className={isCurrent ? "text-gold-bright" : "text-paper-dim"}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {isCurrent && <span className="h-px w-5 bg-gold-bright" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

