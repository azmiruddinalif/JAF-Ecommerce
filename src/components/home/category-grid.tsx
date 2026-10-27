import Link from "next/link";
import Image from "next/image";
import { getActiveCategories } from "@/lib/data/categories";

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
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className="group relative flex aspect-square items-end overflow-hidden bg-ink-raised"
          >
            {category.imageUrl && (
              <Image
                src={category.imageUrl}
                alt={category.name}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover opacity-70 transition-transform duration-500 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/30 to-transparent" />
            <span className="relative z-10 p-4 text-sm font-semibold uppercase tracking-wider text-paper group-hover:text-success">
              {category.name}
            </span>
          </Link>
        ))}
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
