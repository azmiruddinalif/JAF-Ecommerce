import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getAdminProducts } from "@/lib/data/products";
import { getAllCategories } from "@/lib/data/categories";
import { ProductsTable } from "@/components/admin/products-table";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/products/pagination";

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

  return (
    <>
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

      <Pagination page={result.page} totalPages={result.totalPages} buildHref={buildHref} />
    </>
  );
}

export default function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<ProductsSearchParams>;
}) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
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
