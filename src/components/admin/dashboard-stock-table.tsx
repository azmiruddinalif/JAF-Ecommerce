"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { AVAILABLE_SIZES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type {
  StockPaginationMeta,
  StockProductRow,
} from "@/components/admin/product-stocks-manager";

export function DashboardStockTable({
  initialProducts,
  initialPagination,
}: {
  initialProducts: StockProductRow[];
  initialPagination: StockPaginationMeta;
}) {
  const [products, setProducts] = useState<StockProductRow[]>(initialProducts);
  const [page, setPage] = useState<number>(initialPagination.page);
  const [totalPages, setTotalPages] = useState<number>(initialPagination.totalPages);
  const [totalItems, setTotalItems] = useState<number>(initialPagination.totalItems);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const pageSize = 10;

  async function handlePageChange(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/stocks?page=${nextPage}&pageSize=${pageSize}&category=__all__&status=all&sortBy=default`,
        { cache: "no-store" },
      );
      if (!res.ok) return;
      const data = (await res.json()) as {
        items: StockProductRow[];
        page: number;
        totalPages: number;
        totalItems: number;
      };
      setProducts(data.items);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
    } finally {
      setIsLoading(false);
    }
  }

  if (products.length === 0 && !isLoading) {
    return (
      <p className="px-5 py-8 text-center text-sm text-paper-dim">
        No products in inventory yet.
      </p>
    );
  }

  const rangeStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(totalItems, page * pageSize);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className={isLoading ? "opacity-60 transition-opacity" : ""}>
      {/* Mobile & Tablet Stock Cards (< 1200px) */}
      <div className="divide-y divide-ink-border min-[1200px]:hidden">
        {products.slice(0, 10).map((product) => (
          <div key={product.id} className="p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  href={`/admin/products/${product.id}`}
                  className="line-clamp-1 text-xs font-semibold text-paper hover:text-gold"
                >
                  {product.name}
                </Link>
                <p className="mt-0.5 font-mono text-[10px] text-paper-dim">
                  {product.sku} · {product.categoryName}
                </p>
              </div>
              <Badge variant={product.totalStock > 0 ? "emerald" : "danger"}>
                {product.totalStock} units
              </Badge>
            </div>

            {product.hasSizes && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {AVAILABLE_SIZES.map((size) => {
                  const qty = product.sizeStocks[size] ?? 0;
                  return (
                    <span
                      key={size}
                      className={`inline-flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[10px] ${
                        qty === 0
                          ? "border-ink-border text-paper-dim/40"
                          : "border-gold/30 bg-ink-raised text-paper"
                      }`}
                    >
                      <span className="text-paper-dim">{size}:</span>
                      <strong className={qty > 0 ? "text-gold-bright" : ""}>{qty}</strong>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Product Size Stock Matrix (Fixed Screen-Height Table, 10 Products per Page) */}
      <div className="hidden max-h-[calc(100dvh-16rem)] overflow-auto min-[1200px]:block">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 z-10 border-b border-ink-border bg-ink-raised text-[11px] uppercase tracking-wider text-paper-dim shadow-xs">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3 text-center">Total Stock</th>
              <th className="px-3 py-3 text-center">Status</th>
              {AVAILABLE_SIZES.map((size) => (
                <th key={size} className="px-2.5 py-3 text-center">
                  {size}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.slice(0, 10).map((product) => (
              <tr
                key={product.id}
                className="border-b border-ink-border last:border-0 hover:bg-ink-raised"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="font-medium text-paper hover:text-gold"
                  >
                    {product.name}
                  </Link>
                  <p className="font-mono text-[10px] text-paper-dim">{product.sku}</p>
                </td>
                <td className="px-3 py-3 text-paper-dim">{product.categoryName}</td>
                <td className="px-3 py-3 text-center">
                  <span
                    className={
                      product.totalStock === 0
                        ? "font-bold text-danger"
                        : "font-bold text-gold"
                    }
                  >
                    {product.totalStock}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <Badge variant={product.totalStock > 0 ? "emerald" : "danger"}>
                    {product.totalStock > 0 ? "In Stock" : "Out of Stock"}
                  </Badge>
                </td>
                {!product.hasSizes ? (
                  <td
                    colSpan={AVAILABLE_SIZES.length}
                    className="px-3 py-3 text-center text-paper-dim"
                  >
                    Regular Stock (No Sizes):{" "}
                    <span className="font-mono font-semibold text-paper">
                      {product.totalStock} units
                    </span>
                  </td>
                ) : (
                  AVAILABLE_SIZES.map((size) => {
                    const qty = product.sizeStocks[size] ?? 0;
                    return (
                      <td key={size} className="px-2.5 py-3 text-center font-mono">
                        <span
                          className={
                            qty === 0
                              ? "text-paper-dim/40"
                              : "font-semibold text-paper"
                          }
                        >
                          {qty}
                        </span>
                      </td>
                    );
                  })
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer (10 products per page) */}
      {totalItems > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-ink-border bg-ink-raised/60 px-4 py-3 sm:flex-row">
          <div className="flex items-center gap-2 text-xs text-paper-dim">
            {isLoading && <Loader2 size={14} className="animate-spin text-gold" />}
            <span>
              Showing <strong className="text-paper">{rangeStart}–{rangeEnd}</strong> of{" "}
              <strong className="text-paper">{totalItems}</strong> products (10 per page)
            </span>
          </div>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  disabled={page <= 1 || isLoading}
                  onClick={() => handlePageChange(page - 1)}
                />
              </PaginationItem>
              {pages.map((p) => (
                <PaginationItem key={p}>
                  <PaginationButton
                    isActive={p === page}
                    disabled={isLoading}
                    onClick={() => handlePageChange(p)}
                  >
                    {p}
                  </PaginationButton>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  disabled={page >= totalPages || isLoading}
                  onClick={() => handlePageChange(page + 1)}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

