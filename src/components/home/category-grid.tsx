import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  Dumbbell,
  Flag,
  Footprints,
  Package,
  Shield,
  Shirt,
  Watch,
} from "lucide-react";
import { getActiveCategories } from "@/lib/data/categories";

const CATEGORY_ICONS: Record<string, typeof Shirt> = {
  "national-teams": Flag,
  national: Flag,
  "club-jerseys": Shield,
  club: Shield,
  retro: Watch,
  "football-boots": Footprints,
  "tracksuits-jackets": Shirt,
  "shorts-pants": Shirt,
  "training-wear": Dumbbell,
  "accessories-gear": Package,
};

function iconForCategory(slug: string) {
  return CATEGORY_ICONS[slug] ?? Shirt;
}

export async function CategoryGrid() {
  const categories = await getActiveCategories();

  if (categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">
            Browse
          </p>
          <h2 className="font-display text-3xl sm:text-4xl">
            SHOP BY CATEGORY
          </h2>
        </div>
        <Link
          href="/shop"
          className="text-xs font-semibold uppercase tracking-widest hover:text-gold"
        >
          View all
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((category) => {
          const Icon = iconForCategory(category.slug);
          return (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="group relative flex aspect-square items-end overflow-hidden border border-ink-border bg-ink-raised transition-all duration-300 hover:border-gold/60 hover:shadow-[0_12px_32px_-8px_rgba(217,119,6,0.25)]"
            >
              {category.imageUrl ? (
                <>
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover opacity-70 transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/30 to-transparent" />
                </>
              ) : (
                <>
                  <div className="absolute inset-0 bg-linear-to-br from-slate-900 via-slate-900 to-slate-950 transition-transform duration-500 group-hover:scale-105" />
                  <div className="pointer-events-none absolute inset-0 bg-radial-at-tr from-amber-400/15 via-transparent to-transparent" />
                  <Icon
                    size={72}
                    strokeWidth={1}
                    className="pointer-events-none absolute right-3 top-3 text-amber-300/20 sm:size-20"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/20 to-transparent" />
                </>
              )}

              <ArrowUpRight
                size={16}
                strokeWidth={2.5}
                className={`absolute right-3 top-3 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
                  category.imageUrl ? "text-paper" : "text-amber-300"
                }`}
              />

              <span
                className={`relative z-10 p-4 text-sm font-semibold uppercase tracking-wider transition-colors group-hover:text-gold ${
                  category.imageUrl ? "text-paper" : "text-white"
                }`}
              >
                {category.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function CategoryGridSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse bg-ink-raised" />
        ))}
      </div>
    </section>
  );
}
