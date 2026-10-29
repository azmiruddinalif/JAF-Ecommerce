import { Suspense } from "react";
import type { Metadata } from "next";
import { getActiveCategories } from "@/lib/data/categories";
import { getShopProducts, type SortOption } from "@/lib/data/products";
import { ShopFilters } from "@/components/products/shop-filters";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/products/pagination";

export const metadata: Metadata = {
  title: "Shop All Football Jerseys — Club, National Team & Retro Kits",
  description:
    "Browse the complete JAF collection of authentic football jerseys, including Home, Away, Third, and Retro soccer kits across Premier League, La Liga, and international teams.",
  alternates: { canonical: "/shop" },
  openGraph: {
    title: "Shop All Football Jerseys — Club, National Team & Retro Kits | JAF",
    description:
      "Explore JAF's full catalog of club kits, national team shirts, and classic retro football jerseys in sizes S–XXL with Cash on Delivery.",
  },
};

// Filterable by live search params, stock and pricing — always request-time.
export const instant = false;

type ShopSearchParams = {
  query?: string;
  category?: string;
  type?: string;
  size?: string;
  minPrice?: string;
  maxPrice?: string;
  availability?: string;
  sort?: string;
  page?: string;
};

async function ShopResults({ searchParams }: { searchParams: ShopSearchParams }) {
  const [categories, result] = await Promise.all([
    getActiveCategories(),
    getShopProducts({
      query: searchParams.query,
      category: searchParams.category,
      type: searchParams.type,
      size: searchParams.size,
      minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
      maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
      availability: searchParams.availability === "in-stock" ? "in-stock" : "all",
      sort: (searchParams.sort as SortOption) ?? "newest",
      page: searchParams.page ? Number(searchParams.page) : 1,
    }),
  ]);

  function buildHref(page: number) {
    const params = new URLSearchParams(searchParams as Record<string, string>);
    params.set("page", String(page));
    return `/shop?${params.toString()}`;
  }

  return (
    <>
      <ShopFilters categories={categories.map((c) => ({ name: c.name, slug: c.slug }))} />
      <p className="mb-6 text-xs uppercase tracking-wider text-paper-dim">
        {result.total} {result.total === 1 ? "product" : "products"}
      </p>
      <ProductGrid products={result.items} />
      <Pagination page={result.page} totalPages={result.totalPages} buildHref={buildHref} />
    </>
  );
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 font-display text-4xl">SHOP ALL</h1>
      <Suspense fallback={<ProductGridSkeleton />}>
        <ShopResults searchParams={params} />
      </Suspense>
    </div>
  );
}
