"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Copy, Pencil, Trash2, X } from "lucide-react";
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
  getSubTypeFromTags,
  isClubCategory,
  isJerseySubCategory,
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
      if (!result.success) {
        setError(result.message);
      } else {
        router.refresh();
      }
    });
  }

  function duplicate(id: string) {
    startTransition(async () => {
      await duplicateProductAction(id);
      router.refresh();
    });
  }

  function toggleFlag(
    id: string,
    flag: "featured" | "newArrival" | "published" | "showInHeroBanner",
  ) {
    startTransition(async () => {
      await toggleProductFlagAction(id, flag);
      router.refresh();
    });
  }

  return (
    <div className="min-[1200px]:flex min-[1200px]:min-h-0 min-[1200px]:flex-1 min-[1200px]:flex-col">
      {categories.length > 0 && (
        <div className="mb-4 shrink-0 grid grid-cols-1 gap-2.5 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
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

          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:items-center sm:gap-3">
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
              <SelectTrigger aria-label="Filter by Category" className="w-full sm:w-52">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.slug} value={cat.slug}>
                    {isJerseySubCategory(cat) ? `Jersey · ${cat.name}` : cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {showClubTypeFilter && (
              <Select
                value={activeType || ALL}
                onValueChange={(value) => updateFilter({ type: value === ALL ? null : value })}
              >
                <SelectTrigger aria-label="Filter by Club Type" className="w-full sm:w-44">
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
          </div>

          {(activeCategory || activeType || activeQuery) && (
            <button
              type="button"
              onClick={() => router.push(pathname)}
              className="flex items-center justify-center gap-1 border border-ink-border bg-ink-raised px-3 py-2 text-xs uppercase tracking-wider text-paper-dim hover:text-gold sm:border-0 sm:bg-transparent sm:p-0"
            >
              <X size={14} /> Clear Filters
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="mb-4 border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {/* Mobile App Card List */}
      <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 min-[1200px]:hidden ${isPending ? "opacity-70" : ""}`}>
        {products.length === 0 && (
          <div className="border border-ink-border bg-ink-raised p-8 text-center text-sm text-paper-dim">
            No products found.
          </div>
        )}
        {products.map((product) => {
          const catInfo = {
            name: product.categoryName,
            slug: product.categorySlug,
          };
          const isClub = isClubCategory(catInfo);
          const isJersey = isJerseySubCategory(catInfo);
          const subTypeLabel = isClub
            ? getClubTypeLabel(product.type, product.tags)
            : isJersey
              ? product.categoryName
              : (getSubTypeFromTags(product.tags) ?? "Standard");

          return (
            <div
              key={product.id}
              className="border border-ink-border bg-ink-raised/50 p-3.5"
            >
              <div className="flex gap-3.5">
                <Link
                  href={`/admin/products/${product.id}`}
                  className="relative h-20 w-16 shrink-0 overflow-hidden border border-ink-border bg-ink"
                >
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-paper-dim">
                      No img
                    </div>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="line-clamp-2 text-sm font-semibold leading-snug text-paper hover:text-gold"
                    >
                      {product.name}
                    </Link>
                    <span
                      className={`shrink-0 border px-2 py-0.5 font-mono text-[11px] font-bold ${
                        product.totalStock <= 5
                          ? "border-danger/40 bg-danger/10 text-danger"
                          : "border-gold/40 bg-gold/10 text-gold-bright"
                      }`}
                    >
                      {product.totalStock} in stock
                    </span>
                  </div>

                  <p className="mt-0.5 font-mono text-[11px] text-paper-dim">
                    {product.sku} ·{" "}
                    {isJersey ? `Jersey · ${product.categoryName}` : product.categoryName} ·{" "}
                    {subTypeLabel}
                  </p>

                  <div className="mt-1.5 flex items-baseline gap-2 text-sm">
                    {product.discountPriceCents !== null ? (
                      <>
                        <span className="font-semibold text-gold-bright">
                          {formatCents(product.discountPriceCents)}
                        </span>
                        <span className="text-xs text-paper-dim line-through">
                          {formatCents(product.basePriceCents)}
                        </span>
                      </>
                    ) : (
                      <span className="font-semibold text-paper">
                        {formatCents(product.basePriceCents)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Toggle Flags */}
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-ink-border pt-2.5">
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

              {/* Touch Action Bar */}
              <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-ink-border pt-2.5">
                <Link
                  href={`/admin/products/${product.id}`}
                  className="flex items-center justify-center gap-1.5 border border-ink-border bg-ink py-2 text-xs font-semibold uppercase tracking-wider text-paper hover:border-gold hover:text-gold"
                >
                  <Pencil size={13} /> Edit
                </Link>
                <button
                  type="button"
                  onClick={() => duplicate(product.id)}
                  className="flex items-center justify-center gap-1.5 border border-ink-border bg-ink py-2 text-xs font-semibold uppercase tracking-wider text-paper-dim hover:border-gold hover:text-gold"
                >
                  <Copy size={13} /> Copy
                </button>
                <button
                  type="button"
                  onClick={() => remove(product.id)}
                  className="flex items-center justify-center gap-1.5 border border-ink-border bg-ink py-2 text-xs font-semibold uppercase tracking-wider text-paper-dim hover:border-danger hover:text-danger"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table (Fixed Screen Height matching Sidebar) */}
      <div
        className={`hidden overflow-auto border border-ink-border min-[1200px]:block min-[1200px]:min-h-0 min-[1200px]:flex-1 ${isPending ? "opacity-70" : ""}`}
      >
        <table className="w-full min-w-200 text-sm">
          <thead className="sticky top-0 z-10 border-b border-ink-border bg-ink-raised text-left text-xs uppercase tracking-wider text-paper-dim shadow-xs">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Type / Sub-Type</th>
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
              const catInfo = {
                name: product.categoryName,
                slug: product.categorySlug,
              };
              const isClub = isClubCategory(catInfo);
              const isJersey = isJerseySubCategory(catInfo);
              const subTypeLabel = isClub
                ? getClubTypeLabel(product.type, product.tags)
                : isJersey
                  ? product.categoryName
                  : (getSubTypeFromTags(product.tags) ?? "Standard");
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
                    {isJersey ? `Jersey · ${product.categoryName}` : product.categoryName}
                  </td>
                  <td className="px-4 py-3 text-paper-dim">
                    {subTypeLabel}
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
                      <Link
                        href={`/admin/products/${product.id}`}
                        aria-label="Edit product"
                        className="text-paper-dim hover:text-gold"
                      >
                        <Pencil size={16} />
                      </Link>
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
