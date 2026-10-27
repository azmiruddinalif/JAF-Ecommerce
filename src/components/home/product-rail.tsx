import Link from "next/link";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { getFeaturedProducts, getNewArrivals } from "@/lib/data/products";

async function Rail({
  eyebrow,
  title,
  href,
  fetcher,
}: {
  eyebrow: string;
  title: string;
  href: string;
  fetcher: () => Promise<Awaited<ReturnType<typeof getFeaturedProducts>>>;
}) {
  const products = await fetcher();
  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">{eyebrow}</p>
          <h2 className="font-display text-3xl sm:text-4xl">{title}</h2>
        </div>
        <Link href={href} className="text-xs font-semibold uppercase tracking-widest hover:text-gold">
          View all
        </Link>
      </div>
      <ProductGrid products={products} />
    </section>
  );
}

export async function FeaturedProducts() {
  return (
    <Rail
      eyebrow="Curated"
      title="FEATURED JERSEYS"
      href="/shop?sort=featured"
      fetcher={() => getFeaturedProducts(8)}
    />
  );
}

export async function NewArrivals() {
  return (
    <Rail eyebrow="Just Dropped" title="NEW ARRIVALS" href="/shop?sort=newest" fetcher={() => getNewArrivals(8)} />
  );
}

export function ProductRailSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <ProductGridSkeleton />
    </section>
  );
}
