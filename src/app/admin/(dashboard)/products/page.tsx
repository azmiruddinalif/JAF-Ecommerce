import Link from "next/link";
import { Plus } from "lucide-react";
import { getAdminProducts } from "@/lib/data/products";
import { ProductsTable } from "@/components/admin/products-table";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/products/pagination";

export const metadata = { title: "Products", robots: { index: false } };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; page?: string }>;
}) {
  const params = await searchParams;
  const result = await getAdminProducts({ query: params.query, page: params.page ? Number(params.page) : 1 });

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

      <form method="GET" className="mb-6">
        <input
          type="search"
          name="query"
          defaultValue={params.query}
          placeholder="Search by name or SKU..."
          className="w-full max-w-sm border border-ink-border bg-ink-raised px-4 py-2.5 text-sm placeholder:text-paper-dim focus:border-gold focus:outline-none"
        />
      </form>

      <ProductsTable
        products={result.items.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          categoryName: p.category.name,
          type: p.type,
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

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        buildHref={(page) => `/admin/products?${params.query ? `query=${params.query}&` : ""}page=${page}`}
      />
    </div>
  );
}
