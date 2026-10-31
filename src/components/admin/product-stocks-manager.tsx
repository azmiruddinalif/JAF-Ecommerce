"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowUpDown,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FolderTree,
  LayoutGrid,
  ListFilter,
  Package,
  Plus,
  Search,
  Table2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AVAILABLE_SIZES,
  getClubTypeLabel,
  getSubTypeFromTags,
  isClubCategory,
  isJerseySubCategory,
  isNoSizeVariant,
} from "@/lib/constants";

const ALL = "__all__";

export interface StockVariantItem {
  id: string;
  size: string;
  sku: string;
  stock: number;
  priceCents: number | null;
}

export interface StockProductRow {
  id: string;
  name: string;
  slug: string;
  sku: string;
  published: boolean;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  type: string;
  tags: string[];
  basePriceCents: number;
  discountPriceCents: number | null;
  imageUrl: string | null;
  totalStock: number;
  hasSizes: boolean;
  sizeStocks: Record<string, number>;
  variants: StockVariantItem[];
}

export interface StockCategorySummary {
  id: string;
  name: string;
  slug: string;
  enabled: boolean;
  productCount: number;
  totalStock: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface StockTotals {
  totalProducts: number;
  totalUnitsInStock: number;
  inStockProductsCount: number;
  lowStockProductsCount: number;
  outOfStockProductsCount: number;
}

type SortByOption = "default" | "stock-asc" | "stock-desc" | "name-asc";

function getOrderedProductVariants(product: StockProductRow): StockVariantItem[] {
  if (!product.hasSizes) {
    return product.variants;
  }
  const sizeOrder = new Map<string, number>(
    AVAILABLE_SIZES.map((s, idx) => [s.toUpperCase(), idx])
  );
  return [...product.variants].sort((a, b) => {
    const idxA = sizeOrder.get(a.size.toUpperCase()) ?? 999;
    const idxB = sizeOrder.get(b.size.toUpperCase()) ?? 999;
    return idxA - idxB;
  });
}

export function ProductStocksManager({
  products,
  categories,
  totals,
}: {
  products: StockProductRow[];
  categories: StockCategorySummary[];
  totals: StockTotals;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>(ALL);
  const [stockFilter, setStockFilter] = useState<"all" | "in" | "out" | "low">("all");
  const [sortBy, setSortBy] = useState<SortByOption>("default");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());

  function toggleExpand(productId: string) {
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }

  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => {
      if (selectedCategorySlug !== ALL && p.categorySlug !== selectedCategorySlug) {
        return false;
      }
      if (stockFilter === "in" && p.totalStock <= 0) {
        return false;
      }
      if (stockFilter === "out" && p.totalStock !== 0) {
        return false;
      }
      if (stockFilter === "low" && !(p.totalStock > 0 && p.totalStock <= 5)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q)
        );
      }
      return true;
    });

    if (sortBy === "stock-asc") {
      return [...list].sort((a, b) => a.totalStock - b.totalStock);
    }
    if (sortBy === "stock-desc") {
      return [...list].sort((a, b) => b.totalStock - a.totalStock);
    }
    if (sortBy === "name-asc") {
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [products, selectedCategorySlug, stockFilter, searchQuery, sortBy]);

  const sizedProductsInView = filteredProducts.filter((p) => p.hasSizes);
  const allSizedExpanded =
    sizedProductsInView.length > 0 &&
    sizedProductsInView.every((p) => expandedProductIds.has(p.id));

  function toggleExpandAll() {
    if (allSizedExpanded) {
      setExpandedProductIds(new Set());
    } else {
      setExpandedProductIds(new Set(sizedProductsInView.map((p) => p.id)));
    }
  }

  const inStockRatio =
    totals.totalProducts > 0
      ? Math.round((totals.inStockProductsCount / totals.totalProducts) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-7">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-border pb-5">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gold">
            Automatic Inventory Tracking
          </span>
          <h1 className="mt-0.5 font-display text-3xl text-paper">PRODUCT STOCKS</h1>
          <p className="mt-1 text-sm text-paper-dim">
            Monitor category and size inventory in real time. Automatically synced with product
            creation, updates, customer orders, and cancellations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 border border-ink-border bg-ink-raised px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-paper hover:border-gold hover:text-gold transition-colors"
          >
            <Package size={15} /> All Products
          </Link>
          <Link href="/admin/products/new">
            <Button variant="primary">
              <Plus size={15} /> Add New Product
            </Button>
          </Link>
        </div>
      </div>

      {/* 1. Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => setStockFilter("all")}
          className={`group relative overflow-hidden border p-5 text-left transition-all ${
            stockFilter === "all"
              ? "border-gold bg-ink-raised shadow-sm"
              : "border-ink-border bg-ink-raised/60 hover:border-gold/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-paper-dim">
              Total Products
            </span>
            <span className="flex size-9 items-center justify-center border border-ink-border bg-ink text-paper-dim group-hover:border-gold/40 group-hover:text-gold">
              <Package size={17} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl text-paper">{totals.totalProducts}</p>
          <p className="mt-1 text-xs text-paper-dim">
            Across {categories.length} {categories.length === 1 ? "category" : "categories"}
          </p>
        </button>

        <div className="border border-ink-border bg-ink-raised/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-paper-dim">
              Total Stock Units
            </span>
            <span className="flex size-9 items-center justify-center border border-gold/30 bg-gold/10 text-gold">
              <Boxes size={17} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl text-gold">{totals.totalUnitsInStock}</p>
          <p className="mt-1 text-xs text-paper-dim">Combined available units in warehouse</p>
        </div>

        <button
          type="button"
          onClick={() => setStockFilter(stockFilter === "in" ? "all" : "in")}
          className={`group relative overflow-hidden border p-5 text-left transition-all ${
            stockFilter === "in"
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-ink-border bg-ink-raised/60 hover:border-emerald-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-paper-dim">
              In Stock
            </span>
            <span className="flex size-9 items-center justify-center border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 size={17} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <p className="font-display text-3xl text-emerald-400">{totals.inStockProductsCount}</p>
            <span className="text-xs font-medium text-emerald-400/80">({inStockRatio}%)</span>
          </div>
          <p className="mt-1 text-xs text-paper-dim">Click to view in-stock products</p>
        </button>

        <button
          type="button"
          onClick={() => setStockFilter(stockFilter === "out" ? "all" : "out")}
          className={`group relative overflow-hidden border p-5 text-left transition-all ${
            stockFilter === "out"
              ? "border-danger bg-danger/10"
              : "border-ink-border bg-ink-raised/60 hover:border-danger/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-paper-dim">
              Out of Stock
            </span>
            <span className="flex size-9 items-center justify-center border border-danger/30 bg-danger/10 text-danger">
              <AlertTriangle size={17} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <p className="font-display text-3xl text-danger">{totals.outOfStockProductsCount}</p>
            {totals.lowStockProductsCount > 0 && (
              <span className="text-xs text-gold">
                · {totals.lowStockProductsCount} low stock
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-paper-dim">Click to view out-of-stock products</p>
        </button>
      </div>

      {/* 2. Category-Wise Stock Overview */}
      <div className="border border-ink-border bg-ink-raised/30 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <FolderTree size={16} className="text-gold" />
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-paper">
                Category-Wise Stock Overview
              </h2>
              <p className="text-xs text-paper-dim">
                Select any category card below to filter products by that category
              </p>
            </div>
          </div>
          {selectedCategorySlug !== ALL && (
            <button
              type="button"
              onClick={() => setSelectedCategorySlug(ALL)}
              className="inline-flex items-center gap-1 border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold hover:bg-gold hover:text-ink transition-colors"
            >
              <X size={13} /> Clear Category Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => {
            const isJersey = isJerseySubCategory(cat);
            const active = selectedCategorySlug === cat.slug;
            const healthPercent =
              cat.productCount > 0
                ? Math.round((cat.inStockCount / cat.productCount) * 100)
                : 0;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategorySlug(active ? ALL : cat.slug)}
                className={`flex flex-col justify-between border p-4 text-left transition-all ${
                  active
                    ? "border-gold-bright bg-gold/10 ring-1 ring-gold/40"
                    : "border-ink-border bg-ink hover:border-gold/50"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-gold">
                        {isJersey ? "Jersey Category" : "Product Category"}
                      </span>
                      <h3 className="mt-0.5 text-base font-semibold text-paper">{cat.name}</h3>
                    </div>
                    <Badge variant={cat.totalStock > 0 ? "gold" : "danger"}>
                      {cat.totalStock} {cat.totalStock === 1 ? "unit" : "units"}
                    </Badge>
                  </div>

                  {/* Mini Stock Availability Progress Bar */}
                  <div className="mt-3 h-1.5 w-full overflow-hidden bg-ink-raised">
                    <div
                      className={`h-full transition-all ${
                        cat.totalStock === 0
                          ? "bg-danger"
                          : healthPercent === 100
                            ? "bg-emerald-500"
                            : "bg-gold"
                      }`}
                      style={{ width: `${cat.productCount > 0 ? Math.max(8, healthPercent) : 0}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3.5 grid grid-cols-3 gap-2 border-t border-ink-border pt-3 text-center">
                  <div className="bg-ink-raised/50 px-2 py-1.5">
                    <p className="text-[10px] uppercase tracking-wider text-paper-dim">Products</p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-paper">
                      {cat.productCount}
                    </p>
                  </div>
                  <div className="bg-emerald-500/5 px-2 py-1.5">
                    <p className="text-[10px] uppercase tracking-wider text-emerald-400/90">
                      In Stock
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-emerald-400">
                      {cat.inStockCount}
                    </p>
                  </div>
                  <div className="bg-danger/5 px-2 py-1.5">
                    <p className="text-[10px] uppercase tracking-wider text-paper-dim">
                      Out of Stock
                    </p>
                    <p
                      className={`mt-0.5 font-mono text-sm font-bold ${
                        cat.outOfStockCount > 0 ? "text-danger" : "text-paper-dim"
                      }`}
                    >
                      {cat.outOfStockCount}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. User-Friendly Filter, Search, Sort & View Controls */}
      <div className="flex flex-col gap-4 border border-ink-border bg-ink-raised/40 p-4">
        {/* Quick Status Filter Tabs + View Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-border pb-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-paper-dim">
              <ListFilter size={14} className="text-gold" /> Status:
            </span>
            {(
              [
                { key: "all", label: `All Products (${totals.totalProducts})` },
                { key: "in", label: `In Stock (${totals.inStockProductsCount})` },
                { key: "low", label: `Low Stock (${totals.lowStockProductsCount})` },
                { key: "out", label: `Out of Stock (${totals.outOfStockProductsCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStockFilter(tab.key)}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  stockFilter === tab.key
                    ? "bg-gold-bright text-ink"
                    : "border border-ink-border bg-ink text-paper-dim hover:border-gold/40 hover:text-paper"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {viewMode === "table" && sizedProductsInView.length > 0 && (
              <button
                type="button"
                onClick={toggleExpandAll}
                className="inline-flex items-center gap-1.5 border border-ink-border bg-ink px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-paper hover:border-gold hover:text-gold transition-colors"
              >
                {allSizedExpanded ? (
                  <>
                    <ChevronUp size={14} /> Collapse All Size Tables
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} /> Expand All Size Tables
                  </>
                )}
              </button>
            )}

            <div className="flex border border-ink-border bg-ink">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  viewMode === "table"
                    ? "bg-gold-bright text-ink"
                    : "text-paper-dim hover:text-paper"
                }`}
              >
                <Table2 size={14} /> Table View
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  viewMode === "cards"
                    ? "bg-gold-bright text-ink"
                    : "text-paper-dim hover:text-paper"
                }`}
              >
                <LayoutGrid size={14} /> Card Breakdown View
              </button>
            </div>
          </div>
        </div>

        {/* Search Input + Category Dropdown + Sort Dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative min-w-64 flex-1 sm:max-w-sm">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-paper-dim"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by product name, SKU, or category..."
                className="w-full border border-ink-border bg-ink py-2.5 pl-10 pr-4 text-sm text-paper placeholder:text-paper-dim focus:border-gold focus:outline-none"
              />
            </div>

            <Select value={selectedCategorySlug} onValueChange={setSelectedCategorySlug}>
              <SelectTrigger aria-label="Filter by category" className="w-52 bg-ink">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.slug} value={cat.slug}>
                    {cat.name} ({cat.totalStock} units)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sortBy}
              onValueChange={(val) => setSortBy(val as SortByOption)}
            >
              <SelectTrigger aria-label="Sort products" className="w-52 bg-ink">
                <span className="flex items-center gap-1.5">
                  <ArrowUpDown size={13} className="text-gold" />
                  <SelectValue placeholder="Sort by" />
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Sort: Category & Newest</SelectItem>
                <SelectItem value="stock-asc">Stock: Low to High</SelectItem>
                <SelectItem value="stock-desc">Stock: High to Low</SelectItem>
                <SelectItem value="name-asc">Product Name: A–Z</SelectItem>
              </SelectContent>
            </Select>

            {(selectedCategorySlug !== ALL ||
              stockFilter !== "all" ||
              searchQuery ||
              sortBy !== "default") && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategorySlug(ALL);
                  setStockFilter("all");
                  setSearchQuery("");
                  setSortBy("default");
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gold hover:underline"
              >
                <X size={14} /> Reset All
              </button>
            )}
          </div>

          <p className="text-xs text-paper-dim">
            Showing <span className="font-semibold text-paper">{filteredProducts.length}</span> of{" "}
            {products.length} products
          </p>
        </div>
      </div>

      {/* 4. Product-Wise Stock Details (Table View OR Card Breakdown View) */}
      {filteredProducts.length === 0 ? (
        <div className="border border-ink-border bg-ink-raised/30 px-6 py-14 text-center">
          <Package size={32} className="mx-auto mb-3 text-paper-dim" />
          <p className="text-base font-medium text-paper">No matching products found</p>
          <p className="mt-1 text-xs text-paper-dim">
            Try clearing your search query or switching the category/status filter.
          </p>
        </div>
      ) : viewMode === "cards" ? (
        /* Card Breakdown View: Displays every product with its full Size | Available Quantity | Status table directly visible */
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => {
            const orderedVariants = getOrderedProductVariants(product);
            const inStock = product.totalStock > 0;
            const catInfo = { name: product.categoryName, slug: product.categorySlug };
            const isJersey = isJerseySubCategory(catInfo);

            return (
              <div
                key={product.id}
                className="flex flex-col justify-between border border-ink-border bg-ink-raised/40"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start gap-3.5 border-b border-ink-border bg-ink-raised p-4">
                    <div className="relative h-16 w-14 shrink-0 overflow-hidden border border-ink-border bg-ink">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-paper-dim">
                          No img
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-gold">
                          {isJersey ? `Jersey · ${product.categoryName}` : product.categoryName}
                        </span>
                        <Badge variant={inStock ? "emerald" : "danger"}>
                          {inStock ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </div>
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="mt-0.5 block truncate text-base font-semibold text-paper hover:text-gold"
                      >
                        {product.name}
                      </Link>
                      <p className="mt-0.5 font-mono text-xs text-paper-dim">
                        SKU: {product.sku || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Card Body: Size Breakdown Table or Regular Stock */}
                  <div className="p-4">
                    {!product.hasSizes ? (
                      <div className="flex items-center justify-between border border-ink-border bg-ink p-3.5">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-paper">
                            Regular Stock (No Sizes)
                          </p>
                          <p className="mt-0.5 text-[11px] text-paper-dim">
                            Single inventory quantity
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-mono text-lg font-bold ${
                              inStock ? "text-gold" : "text-danger"
                            }`}
                          >
                            {product.totalStock} {product.totalStock === 1 ? "unit" : "units"}
                          </p>
                          <Badge variant={inStock ? "emerald" : "danger"}>
                            {inStock ? "In Stock" : "Out of Stock"}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-ink-border text-left uppercase tracking-wider text-paper-dim">
                            <th className="pb-2 pr-3">Size</th>
                            <th className="pb-2 px-3 text-right">Available Quantity</th>
                            <th className="pb-2 pl-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-border/60">
                          {orderedVariants.map((v) => {
                            const sizeInStock = v.stock > 0;
                            return (
                              <tr key={v.id}>
                                <td className="py-2 pr-3 font-semibold text-paper">{v.size}</td>
                                <td
                                  className={`py-2 px-3 text-right font-mono font-bold ${
                                    sizeInStock ? "text-paper" : "text-danger"
                                  }`}
                                >
                                  {v.stock}
                                </td>
                                <td className="py-2 pl-3 text-right">
                                  <Badge variant={sizeInStock ? "emerald" : "danger"}>
                                    {sizeInStock ? "In Stock" : "Out of Stock"}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between border-t border-ink-border bg-ink px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-paper-dim">
                    Total Stock:{" "}
                    <strong className={inStock ? "font-mono text-gold" : "font-mono text-danger"}>
                      {product.totalStock} {product.totalStock === 1 ? "unit" : "units"}
                    </strong>
                  </span>
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gold hover:underline"
                  >
                    Edit Product <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View with Interactive Visual Size Pills & Expandable Size Breakdown Table */
        <div className="overflow-x-auto border border-ink-border">
          <table className="w-full min-w-225 text-left text-sm">
            <thead className="border-b border-ink-border bg-ink-raised text-xs uppercase tracking-wider text-paper-dim">
              <tr>
                <th className="px-4 py-3.5">Product</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">SKU</th>
                <th className="px-4 py-3.5">Available Sizes & Stock Quantity</th>
                <th className="px-4 py-3.5 text-center">Total Stock</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-border">
              {filteredProducts.map((product) => {
                const catInfo = {
                  name: product.categoryName,
                  slug: product.categorySlug,
                };
                const isClub = isClubCategory(catInfo);
                const isJersey = isJerseySubCategory(catInfo);
                const subTypeLabel = isClub
                  ? getClubTypeLabel(product.type, product.tags)
                  : !isJersey
                    ? getSubTypeFromTags(product.tags)
                    : null;
                const orderedVariants = getOrderedProductVariants(product);
                const isExpanded = expandedProductIds.has(product.id);
                const inStock = product.totalStock > 0;

                return (
                  <ProductStockRow
                    key={product.id}
                    product={product}
                    isJersey={isJersey}
                    subTypeLabel={subTypeLabel}
                    orderedVariants={orderedVariants}
                    inStock={inStock}
                    isExpanded={isExpanded}
                    onToggleExpand={() => toggleExpand(product.id)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProductStockRow({
  product,
  isJersey,
  subTypeLabel,
  orderedVariants,
  inStock,
  isExpanded,
  onToggleExpand,
}: {
  product: StockProductRow;
  isJersey: boolean;
  subTypeLabel: string | null;
  orderedVariants: StockVariantItem[];
  inStock: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  return (
    <>
      <tr
        onClick={() => {
          if (product.hasSizes) onToggleExpand();
        }}
        className={`transition-colors ${
          product.hasSizes ? "cursor-pointer" : ""
        } ${isExpanded ? "bg-ink-raised/70" : "hover:bg-ink-raised/40"}`}
      >
        {/* Product Image & Name */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3.5">
            <div className="relative h-13 w-11 shrink-0 overflow-hidden border border-ink-border bg-ink-raised">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[9px] text-paper-dim">
                  No img
                </div>
              )}
            </div>
            <div>
              <Link
                href={`/admin/products/${product.id}`}
                onClick={(e) => e.stopPropagation()}
                className="font-medium text-paper hover:text-gold"
              >
                {product.name}
              </Link>
              <div className="mt-0.5 flex items-center gap-2">
                {!product.published && (
                  <span className="border border-ink-border px-1.5 py-0.5 text-[10px] uppercase text-paper-dim">
                    Draft
                  </span>
                )}
                {product.hasSizes && (
                  <span className="text-[11px] text-paper-dim">
                    {orderedVariants.length} {orderedVariants.length === 1 ? "size" : "sizes"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </td>

        {/* Category */}
        <td className="px-4 py-3.5">
          <span className="inline-block border border-ink-border bg-ink-raised px-2.5 py-1 text-xs font-semibold text-paper">
            {isJersey ? `Jersey · ${product.categoryName}` : product.categoryName}
          </span>
          {subTypeLabel && (
            <p className="mt-1 text-[11px] text-paper-dim">{subTypeLabel}</p>
          )}
        </td>

        {/* SKU */}
        <td className="px-4 py-3.5 font-mono text-xs text-paper-dim">
          {product.sku || "—"}
        </td>

        {/* Available Sizes & Per-Size Stock Boxes */}
        <td className="px-4 py-3.5">
          {!product.hasSizes ? (
            <div className="inline-flex items-center gap-3 border border-ink-border bg-ink px-3 py-1.5">
              <span className="text-xs text-paper-dim">Regular Stock (No Sizes):</span>
              <span
                className={`font-mono text-xs font-bold ${
                  product.totalStock > 0 ? "text-emerald-400" : "text-danger"
                }`}
              >
                {product.totalStock} {product.totalStock === 1 ? "unit" : "units"}
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              {orderedVariants.map((v) => {
                const sizeInStock = v.stock > 0;
                const isLow = v.stock > 0 && v.stock <= 3;
                return (
                  <div
                    key={v.id}
                    className={`flex min-w-12 flex-col items-center border px-2 py-1 text-center ${
                      !sizeInStock
                        ? "border-danger/35 bg-danger/5 text-danger"
                        : isLow
                          ? "border-gold/50 bg-gold/10 text-gold"
                          : "border-ink-border bg-ink text-paper"
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                      {v.size}
                    </span>
                    <span className="font-mono text-xs font-bold">{v.stock}</span>
                  </div>
                );
              })}
            </div>
          )}
        </td>

        {/* Total Stock */}
        <td className="px-4 py-3.5 text-center font-mono">
          <span
            className={`text-sm font-bold ${
              product.totalStock > 0 ? "text-gold" : "text-danger"
            }`}
          >
            {product.totalStock} {product.totalStock === 1 ? "unit" : "units"}
          </span>
        </td>

        {/* Status Indicator */}
        <td className="px-4 py-3.5 text-center">
          <Badge variant={inStock ? "emerald" : "danger"}>
            {inStock ? "In Stock" : "Out of Stock"}
          </Badge>
        </td>

        {/* Actions */}
        <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-2">
            {product.hasSizes && (
              <button
                type="button"
                onClick={onToggleExpand}
                className={`inline-flex items-center gap-1 border px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  isExpanded
                    ? "border-gold bg-gold text-ink"
                    : "border-ink-border bg-ink-raised text-paper hover:border-gold hover:text-gold"
                }`}
              >
                {isExpanded ? (
                  <>
                    Hide <ChevronUp size={13} />
                  </>
                ) : (
                  <>
                    Details <ChevronDown size={13} />
                  </>
                )}
              </button>
            )}
            <Link
              href={`/admin/products/${product.id}`}
              className="inline-flex items-center gap-1 border border-ink-border px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-paper-dim hover:border-gold hover:text-gold transition-colors"
            >
              Edit <ExternalLink size={12} />
            </Link>
          </div>
        </td>
      </tr>

      {/* Expandable Detailed Per-Size Breakdown Table */}
      {isExpanded && product.hasSizes && (
        <tr className="bg-ink-raised/50">
          <td colSpan={7} className="px-6 py-5">
            <div className="grid grid-cols-1 gap-6 border border-ink-border bg-ink p-5 lg:grid-cols-12">
              {/* Left Column: Product Summary */}
              <div className="flex flex-col justify-between border-b border-ink-border pb-4 lg:col-span-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-gold">
                    Size-Wise Inventory Breakdown
                  </span>
                  <h4 className="mt-1 text-base font-semibold text-paper">
                    Product: {product.name}
                  </h4>
                  <p className="mt-1 text-xs text-paper-dim">
                    Category: <span className="text-paper">{product.categoryName}</span> · SKU:{" "}
                    <span className="font-mono text-paper">{product.sku}</span>
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-ink-border pt-4">
                  <div className="border border-ink-border bg-ink-raised p-3">
                    <p className="text-[10px] uppercase tracking-wider text-paper-dim">
                      Total Stock
                    </p>
                    <p className="mt-1 font-mono text-lg font-bold text-gold">
                      {product.totalStock} units
                    </p>
                  </div>
                  <div className="border border-ink-border bg-ink-raised p-3">
                    <p className="text-[10px] uppercase tracking-wider text-paper-dim">
                      In-Stock Sizes
                    </p>
                    <p className="mt-1 font-mono text-lg font-bold text-emerald-400">
                      {orderedVariants.filter((v) => v.stock > 0).length} / {orderedVariants.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Clean Size | Available Quantity | Status Table */}
              <div className="lg:col-span-8">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-ink-border text-left uppercase tracking-wider text-paper-dim">
                      <th className="pb-2.5 pr-4">Size</th>
                      <th className="pb-2.5 px-4">SKU</th>
                      <th className="pb-2.5 px-4 text-right">Available Quantity</th>
                      <th className="pb-2.5 pl-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-border/60">
                    {orderedVariants.map((v) => {
                      const sizeInStock = v.stock > 0;
                      return (
                        <tr key={v.id} className="hover:bg-ink-raised/40">
                          <td className="py-2.5 pr-4 font-semibold text-paper">
                            {isNoSizeVariant(v.size) ? "Regular" : v.size}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-paper-dim">{v.sku}</td>
                          <td
                            className={`py-2.5 px-4 text-right font-mono text-sm font-bold ${
                              sizeInStock ? "text-paper" : "text-danger"
                            }`}
                          >
                            {v.stock}
                          </td>
                          <td className="py-2.5 pl-4 text-right">
                            <Badge variant={sizeInStock ? "emerald" : "danger"}>
                              {sizeInStock ? "In Stock" : "Out of Stock"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-ink-border font-semibold text-paper">
                      <td colSpan={2} className="pt-3 pr-4">
                        Total Stock
                      </td>
                      <td className="pt-3 px-4 text-right font-mono text-sm font-bold text-gold">
                        {product.totalStock} units
                      </td>
                      <td className="pt-3 pl-4 text-right">
                        <Badge variant={inStock ? "emerald" : "danger"}>
                          {inStock ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
