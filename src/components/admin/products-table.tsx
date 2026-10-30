"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Copy, Trash2, X } from "lucide-react";
import { formatCents } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CLUB_TYPES,
  CLUB_TYPE_LABELS,
  getClubTypeLabel,
  isClubCategory,
} from "@/lib/constants";
import {
  deleteProductAction,
  duplicateProductAction,
  toggleProductFlagAction,
} from "@/lib/actions/admin-product-actions";

const ALL = "__all__";

export interface AdminProductRow {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryName: string;
  categorySlug: string;
  type: string;
  tags: string[];
  basePriceCents: number;
  discountPriceCents: number | null;
  imageUrl: string | null;
  featured: boolean;
  newArrival: boolean;
  published: boolean;
  showInHeroBanner: boolean;
  totalStock: number;
}

export function ProductsTable({
  products,
  categories = [],
}: {
  products: AdminProductRow[];
  categories?: { name: string; slug: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const activeCategory = searchParams.get("category") ?? "";
  const activeType = searchParams.get("type") ?? "";
  const activeQuery = searchParams.get("query") ?? "";

  const selectedCatObj = categories.find((c) => c.slug === activeCategory) ?? null;
  const showClubTypeFilter = isClubCategory(selectedCatObj);

  function updateFilter(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) {
        params.set(k, v);
      } else {
        params.delete(k);
      }
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function remove(id: string) {
    if (!confirm("Delete this product? This can't be undone.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteProductAction(id);
      if (!result.success) setError(result.message);
    });
  }

  function duplicate(id: string) {
    startTransition(async () => {
      await duplicateProductAction(id);
    });
  }

  function toggleFlag(
    id: string,
    flag: "featured" | "newArrival" | "published" | "showInHeroBanner",
  ) {
    startTransition(async () => {
      await toggleProductFlagAction(id, flag);
    });
  }

  return (
    <div>
      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              const q = form.get("query")?.toString().trim() ?? "";
              updateFilter({ query: q || null });
            }}
            className="w-full sm:w-72"
          >
            <input
              type="search"
              name="query"
              defaultValue={activeQuery}
              placeholder="Search by name or SKU..."
              className="w-full border border-ink-border bg-ink-raised px-4 py-2.5 text-sm placeholder:text-paper-dim focus:border-gold focus:outline-none"
            />
          </form>

          <Select
            value={activeCategory || ALL}
            onValueChange={(value) => {
              const nextCat = value === ALL ? null : value;
              const nextCatObj = categories.find((c) => c.slug === nextCat) ?? null;
              updateFilter({
                category: nextCat,
                ...(isClubCategory(nextCatObj) ? {} : { type: null }),
              });
            }}
          >
            <SelectTrigger aria-label="Filter by Jersey Type" className="w-48">
              <SelectValue placeholder="Jersey Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Jersey Types</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.slug} value={cat.slug}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {showClubTypeFilter && (
            <Select
              value={activeType || ALL}
              onValueChange={(value) => updateFilter({ type: value === ALL ? null : value })}
            >
              <SelectTrigger aria-label="Filter by Club Type" className="w-44">
                <SelectValue placeholder="Club Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Club Types</SelectItem>
                {CLUB_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {CLUB_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {(activeCategory || activeType || activeQuery) && (
            <button
              type="button"
              onClick={() => router.push(pathname)}
              className="flex items-center gap-1 text-xs uppercase tracking-wider text-paper-dim hover:text-gold"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="mb-4 border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div
        className={`overflow-x-auto border border-ink-border ${isPending ? "opacity-70" : ""}`}
      >
        <table className="w-full min-w-200 text-sm">
          <thead className="border-b border-ink-border bg-ink-raised text-left text-xs uppercase tracking-wider text-paper-dim">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Jersey Type</th>
              <th className="px-4 py-3">Club Type</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Flags</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-paper-dim"
                >
                  No products found.
                </td>
              </tr>
            )}
            {products.map((product) => {
              const isClub = isClubCategory({
                name: product.categoryName,
                slug: product.categorySlug,
              });
              return (
                <tr
                  key={product.id}
                  className="border-b border-ink-border last:border-0"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-10 shrink-0 overflow-hidden bg-ink-raised">
                        {product.imageUrl && (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="font-medium hover:text-gold"
                        >
                          {product.name}
                        </Link>
                        <p className="text-xs text-paper-dim">{product.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-paper-dim">
                    {product.categoryName}
                  </td>
                  <td className="px-4 py-3 text-paper-dim">
                    {isClub ? getClubTypeLabel(product.type, product.tags) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {product.discountPriceCents !== null ? (
                      <span>
                        <span className="text-gold">
                          {formatCents(product.discountPriceCents)}
                        </span>{" "}
                        <span className="text-paper-dim line-through">
                          {formatCents(product.basePriceCents)}
                        </span>
                      </span>
                    ) : (
                      formatCents(product.basePriceCents)
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={product.totalStock <= 5 ? "text-danger" : ""}
                    >
                      {product.totalStock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => toggleFlag(product.id, "published")}
                      >
                        <Badge variant={product.published ? "success" : "neutral"}>
                          {product.published ? "Published" : "Draft"}
                        </Badge>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFlag(product.id, "featured")}
                      >
                        <Badge variant={product.featured ? "gold" : "neutral"}>
                          Featured
                        </Badge>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFlag(product.id, "newArrival")}
                      >
                        <Badge variant={product.newArrival ? "emerald" : "neutral"}>
                          New
                        </Badge>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFlag(product.id, "showInHeroBanner")}
                      >
                        <Badge variant={product.showInHeroBanner ? "gold" : "neutral"}>
                          Banner
                        </Badge>
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => duplicate(product.id)}
                        aria-label="Duplicate product"
                        className="text-paper-dim hover:text-gold"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(product.id)}
                        aria-label="Delete product"
                        className="text-paper-dim hover:text-danger"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
