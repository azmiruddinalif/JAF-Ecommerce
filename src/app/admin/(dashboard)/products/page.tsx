import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getAdminProducts } from "@/lib/data/products";
import { getAllCategories } from "@/lib/data/categories";
import { ProductsTable } from "@/components/admin/products-table";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Products", robots: { index: false } };
export const instant = false;

type ProductsSearchParams = {
  query?: string;
  category?: string;
  type?: string;
  page?: string;
};

async function ProductsContent({
  searchParams,
}: {
  searchParams: Promise<ProductsSearchParams>;
}) {
  const params = await searchParams;
  const [result, categories] = await Promise.all([
    getAdminProducts({
      query: params.query,
      category: params.category,
      type: params.type,
      page: params.page ? Number(params.page) : 1,
    }),
    getAllCategories(),
  ]);

  function buildHref(page: number) {
    const sp = new URLSearchParams();
    if (params.query) sp.set("query", params.query);
    if (params.category) sp.set("category", params.category);
    if (params.type) sp.set("type", params.type);
    sp.set("page", String(page));
    return `/admin/products?${sp.toString()}`;
  }

  const rangeStart =
    result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const rangeEnd = Math.min(result.total, result.page * result.pageSize);
  const pages = Array.from({ length: result.totalPages }, (_, i) => i + 1);

  return (
    <div className="min-[1200px]:flex min-[1200px]:min-h-0 min-[1200px]:flex-1 min-[1200px]:flex-col">
      <ProductsTable
        categories={categories.map((c) => ({ name: c.name, slug: c.slug }))}
        products={result.items.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          categoryName: p.category.name,
          categorySlug: p.category.slug,
          type: p.type,
          tags: p.tags,
          basePriceCents: p.basePriceCents,
          discountPriceCents: p.discountPriceCents,
          imageUrl: p.images[0]?.secureUrl ?? null,
          featured: p.featured,
          newArrival: p.newArrival,
          published: p.published,
          showInHeroBanner: p.showInHeroBanner,
          totalStock: p.variants.reduce((sum, v) => sum + v.stock, 0),
        }))}
      />

      {result.total > 0 && (
        <div className="mt-3 flex shrink-0 flex-col items-center justify-between gap-3 border border-ink-border bg-ink-raised px-4 py-2.5 sm:flex-row">
          <span className="text-xs text-paper-dim">
            Showing{" "}
            <strong className="text-paper">
              {rangeStart}–{rangeEnd}
            </strong>{" "}
            of <strong className="text-paper">{result.total}</strong> products
            (10 per page)
          </span>

          <nav className="flex items-center gap-1.5" aria-label="Pagination">
            <Link
              href={buildHref(Math.max(1, result.page - 1))}
              aria-disabled={result.page === 1}
              className={`border border-ink-border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                result.page === 1
                  ? "pointer-events-none opacity-40"
                  : "bg-ink text-paper hover:border-gold hover:text-gold"
              }`}
            >
              Prev
            </Link>
            {pages.map((p) => (
              <Link
                key={p}
                href={buildHref(p)}
                aria-current={p === result.page ? "page" : undefined}
                className={`flex h-8 w-8 items-center justify-center border text-xs font-semibold transition-colors ${
                  p === result.page
                    ? "border-gold-bright bg-gold-bright text-ink"
                    : "border-ink-border bg-ink text-paper hover:border-gold hover:text-gold"
                }`}
              >
                {p}
              </Link>
            ))}
            <Link
              href={buildHref(Math.min(result.totalPages, result.page + 1))}
              aria-disabled={result.page === result.totalPages}
              className={`border border-ink-border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                result.page === result.totalPages
                  ? "pointer-events-none opacity-40"
                  : "bg-ink text-paper hover:border-gold hover:text-gold"
              }`}
            >
              Next
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}

export default function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<ProductsSearchParams>;
}) {
  return (
    <div className="min-[1200px]:flex min-[1200px]:h-[calc(100dvh-4rem)] min-[1200px]:flex-col min-[1200px]:overflow-hidden">
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <h1 className="font-display text-3xl">PRODUCTS</h1>
        <Link href="/admin/products/new">
          <Button variant="primary">
            <Plus size={16} /> ADD PRODUCT
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div className="h-96 animate-pulse bg-ink-raised" />}>
        <ProductsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
