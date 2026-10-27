"use client";

import { useState } from "react";
import Image from "next/image";

export function Gallery({
  images,
  productName,
}: {
  images: { id: string; secureUrl: string; altText: string | null }[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return <div className="aspect-[3/4] w-full bg-ink-raised" />;
  }

  const active = images[activeIndex];

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="order-2 flex gap-3 overflow-x-auto sm:order-1 sm:w-20 sm:flex-col sm:overflow-y-auto">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`View image ${index + 1}`}
            className={`relative h-20 w-16 shrink-0 overflow-hidden border sm:w-full ${
              index === activeIndex ? "border-gold" : "border-ink-border opacity-70 hover:opacity-100"
            }`}
          >
            <Image src={image.secureUrl} alt={image.altText ?? productName} fill sizes="80px" className="object-cover" />
          </button>
        ))}
      </div>

      <div className="relative order-1 aspect-[3/4] w-full overflow-hidden bg-ink-raised sm:order-2">
        <Image
          key={active.id}
          src={active.secureUrl}
          alt={active.altText ?? productName}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}
