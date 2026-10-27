"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Copy, Trash2 } from "lucide-react";
import { formatCents } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { JERSEY_TYPE_LABELS } from "@/lib/constants";
import {
  deleteProductAction,
  duplicateProductAction,
  toggleProductFlagAction,
} from "@/lib/actions/admin-product-actions";

export interface AdminProductRow {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryName: string;
  type: string;
  basePriceCents: number;
  discountPriceCents: number | null;
  imageUrl: string | null;
  featured: boolean;
  newArrival: boolean;
  published: boolean;
  showInHeroBanner: boolean;
  totalStock: number;
}

export function ProductsTable({ products }: { products: AdminProductRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Type</th>
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
            {products.map((product) => (
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
                  {JERSEY_TYPE_LABELS[product.type as keyof typeof JERSEY_TYPE_LABELS] ?? product.type}
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
