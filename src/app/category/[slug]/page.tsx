import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getActiveCategories } from "@/lib/data/categories";
import { getShopProducts, type SortOption } from "@/lib/data/products";
import { ShopFilters } from "@/components/products/shop-filters";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/products/pagination";

// Live stock/pricing per category — always render at request time rather
// than maintaining a static shell.
export const instant = false;

type CategorySearchParams = {
  type?: string;
  size?: string;
  minPrice?: string;
  maxPrice?: string;
  availability?: string;
  sort?: string;
  page?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  const title = `${category.name} — Football Jerseys & Kits`;
  const description =
    category.description ??
    `Shop authentic ${category.name} football jerseys at JAF. Browse Home, Away, Third, and Retro soccer kits in sizes S to XXL with fast nationwide Cash on Delivery.`;

  return {
    title,
    description,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: {
      title: `${title} | JAF`,
      description,
      images: category.imageUrl ? [{ url: category.imageUrl, alt: category.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | JAF`,
      description,
      images: category.imageUrl ? [category.imageUrl] : undefined,
    },
  };
}

async function CategoryResults({
  categorySlug,
  searchParams,
}: {
  categorySlug: string;
  searchParams: CategorySearchParams;
}) {
  const [categories, result] = await Promise.all([
    getActiveCategories(),
    getShopProducts({
      category: categorySlug,
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
    return `/category/${categorySlug}?${params.toString()}`;
  }

  return (
    <>
      <ShopFilters
        categories={categories.map((c) => ({ name: c.name, slug: c.slug }))}
        lockCategory
        lockedCategorySlug={categorySlug}
      />
      <p className="mb-6 text-xs uppercase tracking-wider text-paper-dim">
        {result.total} {result.total === 1 ? "product" : "products"}
      </p>
      <ProductGrid
        products={result.items}
        emptyTitle="No products in this category yet"
        emptyDescription="Check back soon or browse the full shop."
      />
      <Pagination page={result.page} totalPages={result.totalPages} buildHref={buildHref} />
    </>
  );
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<CategorySearchParams>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const category = await getCategoryBySlug(slug);

  if (!category || !category.enabled) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold">Jersey Type</p>
      <h1 className="mb-8 font-display text-4xl">{category.name.toUpperCase()}</h1>
      {category.description && (
        <p className="mb-8 max-w-2xl text-sm text-paper-dim">{category.description}</p>
      )}
      <Suspense fallback={<ProductGridSkeleton />}>
        <CategoryResults categorySlug={slug} searchParams={resolvedSearchParams} />
      </Suspense>
    </div>
  );
}
