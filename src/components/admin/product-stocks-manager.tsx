"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  ExternalLink,
  FolderTree,
  LayoutGrid,
  ListFilter,
  Loader2,
  Package,
  Pencil,
  Plus,
  Search,
  Table2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PwaInstallButton } from "@/components/admin/pwa-install-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export interface StockPaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

type SortByOption = "default" | "stock-asc" | "stock-desc" | "name-asc";
type ActiveTab = "overview" | "status";
type StockStatusFilter = "all" | "in" | "low" | "out";

function getOrderedProductVariants(product: StockProductRow): StockVariantItem[] {
  if (!product.hasSizes) {
    return product.variants;
  }
  const sizeOrder = new Map<string, number>(
    AVAILABLE_SIZES.map((s, idx) => [s.toUpperCase(), idx]),
  );
  return [...product.variants].sort((a, b) => {
    const idxA = sizeOrder.get(a.size.toUpperCase()) ?? 999;
    const idxB = sizeOrder.get(b.size.toUpperCase()) ?? 999;
    return idxA - idxB;
  });
}

function buildPageNumbers(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "ellipsis")[] = [1];
  if (currentPage > 3) {
    pages.push("ellipsis");
  }
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let p = start; p <= end; p++) {
    pages.push(p);
  }
  if (currentPage < totalPages - 2) {
    pages.push("ellipsis");
  }
  pages.push(totalPages);
  return pages;
}

export function ProductStocksManager({
  initialProducts,
  initialPagination,
  sizeTotals,
  attentionProducts,
  categories,
  totals,
}: {
  initialProducts: StockProductRow[];
  initialPagination: StockPaginationMeta;
  sizeTotals: Record<string, number>;
  attentionProducts: StockProductRow[];
  categories: StockCategorySummary[];
  totals: StockTotals;
}) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [products, setProducts] = useState<StockProductRow[]>(initialProducts);
  const [page, setPage] = useState<number>(initialPagination.page);
  const [pageSize, setPageSize] = useState<number>(initialPagination.pageSize);
  const [totalItems, setTotalItems] = useState<number>(initialPagination.totalItems);
  const [totalPages, setTotalPages] = useState<number>(initialPagination.totalPages);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>(ALL);
  const [stockFilter, setStockFilter] = useState<StockStatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortByOption>("default");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());

  const isFirstMount = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchPaginatedStocks = useCallback(
    async (params: {
      nextPage: number;
      nextPageSize: number;
      category: string;
      status: StockStatusFilter;
      search: string;
      sort: SortByOption;
    }) => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      try {
        const sp = new URLSearchParams({
          page: String(params.nextPage),
          pageSize: String(params.nextPageSize),
          category: params.category,
          status: params.status,
          search: params.search,
          sortBy: params.sort,
        });
        const res = await fetch(`/api/admin/stocks?${sp.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          items: StockProductRow[];
          page: number;
          pageSize: number;
          totalItems: number;
          totalPages: number;
        };
        setProducts(data.items);
        setPage(data.page);
        setPageSize(data.pageSize);
        setTotalItems(data.totalItems);
        setTotalPages(data.totalPages);
        setExpandedProductIds(new Set());
        if (tableContainerRef.current) {
          tableContainerRef.current.scrollTop = 0;
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Failed to fetch paginated stocks:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  // Trigger API call when filters/search/sort/pageSize change (resets to page 1)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    void fetchPaginatedStocks({
      nextPage: 1,
      nextPageSize: pageSize,
      category: selectedCategorySlug,
      status: stockFilter,
      search: debouncedSearch,
      sort: sortBy,
    });
  }, [
    selectedCategorySlug,
    stockFilter,
    debouncedSearch,
    sortBy,
    pageSize,
    fetchPaginatedStocks,
  ]);

  function handlePageChange(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setPage(nextPage);
    void fetchPaginatedStocks({
      nextPage,
      nextPageSize: pageSize,
      category: selectedCategorySlug,
      status: stockFilter,
      search: debouncedSearch,
      sort: sortBy,
    });
  }

  function openStatusWithFilter(opts: {
    categorySlug?: string;
    status?: StockStatusFilter;
  }) {
    if (opts.categorySlug !== undefined) {
      setSelectedCategorySlug(opts.categorySlug);
    }
    if (opts.status !== undefined) {
      setStockFilter(opts.status);
    }
    setActiveTab("status");
  }

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

  const maxSizeCount = useMemo(() => {
    const counts = Object.values(sizeTotals);
    return Math.max(1, ...counts);
  }, [sizeTotals]);

  const sizedProductsInView = products.filter((p) => p.hasSizes);
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

  const hasActiveFilters =
    selectedCategorySlug !== ALL ||
    stockFilter !== "all" ||
    searchQuery.trim().length > 0 ||
    sortBy !== "default";

  const rangeStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(totalItems, page * pageSize);
  const pageNumbers = useMemo(() => buildPageNumbers(page, totalPages), [page, totalPages]);

  const isDesktopFixedTable = activeTab === "status" && viewMode === "table";

  return (
    <div
      className={`flex min-w-0 flex-col gap-4 ${
        isDesktopFixedTable
          ? "min-[1200px]:h-[calc(100dvh-4rem)] min-[1200px]:overflow-hidden"
          : "sm:gap-6"
      }`}
    >
      {/* Page Header */}
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="gold">Inventory Control</Badge>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-paper-dim">
              Live Sync
            </span>
          </div>
          <h1 className="mt-1 font-display text-2xl text-paper sm:text-3xl">
            PRODUCT STOCKS
          </h1>
          <p className="mt-0.5 text-xs text-paper-dim sm:text-sm">
            Monitor warehouse totals by size and category or inspect product-by-product stock status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <PwaInstallButton label="Download App" variant="outline" />
          <Button variant="secondary" size="sm" asChild>
            <Link href="/admin/products">
              <Package size={15} />
              <span>All Products</span>
            </Link>
          </Button>
          <Button variant="primary" size="sm" asChild>
            <Link href="/admin/products/new">
              <Plus size={15} />
              <span>Add Product</span>
            </Link>
          </Button>
        </div>
      </div>

      <Separator className="shrink-0" />

      {/* Main Shadcn Tabs (Overview vs Stock Status) */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as ActiveTab)}
        className={`w-full gap-4 ${
          isDesktopFixedTable ? "min-[1200px]:min-h-0 min-[1200px]:flex-1" : "sm:gap-5"
        }`}
      >
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="grid h-auto w-full grid-cols-2 p-1 sm:w-auto sm:min-w-105">
            <TabsTrigger value="overview" className="gap-2 py-2.5 sm:px-5">
              <BarChart3 size={15} />
              <span>Stock Overview</span>
              <Badge
                variant={activeTab === "overview" ? "neutral" : "gold"}
                className="ml-1 hidden px-1.5 py-0.5 text-[10px] sm:inline-flex"
              >
                {totals.totalUnitsInStock}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="status" className="gap-2 py-2.5 sm:px-5">
              <ClipboardList size={15} />
              <span>Stock Status</span>
              <Badge
                variant={activeTab === "status" ? "neutral" : "emerald"}
                className="ml-1 px-1.5 py-0.5 text-[10px]"
              >
                {totalItems}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Contextual Quick Summary on Tablet/Desktop */}
          <div className="hidden items-center gap-2 text-xs text-paper-dim md:flex">
            <span>
              In-Stock Rate: <strong className="text-emerald-400">{inStockRatio}%</strong>
            </span>
            <span>·</span>
            <span>
              Total Units: <strong className="font-mono text-gold">{totals.totalUnitsInStock}</strong>
            </span>
          </div>
        </div>

        {/* ================================================================= */}
        {/* TAB 1: STOCK OVERVIEW                                             */}
        {/* ================================================================= */}
        <TabsContent value="overview" className="flex flex-col gap-5 sm:gap-6">
          {/* 1. 4 KPI Summary Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <Card
              role="button"
              tabIndex={0}
              onClick={() => openStatusWithFilter({ categorySlug: ALL, status: "all" })}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openStatusWithFilter({ categorySlug: ALL, status: "all" });
                }
              }}
              className="group cursor-pointer transition-colors hover:border-gold"
            >
              <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
                <CardDescription className="text-[11px] font-semibold uppercase tracking-wider text-paper-dim">
                  Total Products
                </CardDescription>
                <span className="flex size-8 shrink-0 items-center justify-center border border-ink-border bg-ink text-paper-dim transition-colors group-hover:border-gold/40 group-hover:text-gold">
                  <Package size={15} />
                </span>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="font-display text-2xl text-paper sm:text-3xl">
                  {totals.totalProducts}
                </div>
                <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-gold group-hover:underline">
                  <span>View all products</span>
                  <ArrowRight size={12} />
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
                <CardDescription className="text-[11px] font-semibold uppercase tracking-wider text-paper-dim">
                  Total Stock Units
                </CardDescription>
                <span className="flex size-8 shrink-0 items-center justify-center border border-gold/30 bg-gold/10 text-gold">
                  <Boxes size={15} />
                </span>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="font-display text-2xl text-gold sm:text-3xl">
                  {totals.totalUnitsInStock}
                </div>
                <p className="mt-1 truncate text-[11px] text-paper-dim">
                  Across {categories.length} active categories
                </p>
              </CardContent>
            </Card>

            <Card
              role="button"
              tabIndex={0}
              onClick={() => openStatusWithFilter({ status: "in" })}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openStatusWithFilter({ status: "in" });
                }
              }}
              className="group cursor-pointer transition-colors hover:border-emerald-500/60"
            >
              <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
                <CardDescription className="text-[11px] font-semibold uppercase tracking-wider text-paper-dim">
                  In Stock
                </CardDescription>
                <span className="flex size-8 shrink-0 items-center justify-center border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 size={15} />
                </span>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-2xl text-emerald-400 sm:text-3xl">
                    {totals.inStockProductsCount}
                  </span>
                  <Badge variant="success" className="px-1.5 py-0.5 text-[10px]">
                    {inStockRatio}%
                  </Badge>
                </div>
                <Progress
                  value={inStockRatio}
                  indicatorClassName="bg-emerald-400"
                  className="mt-2 h-1.5"
                />
              </CardContent>
            </Card>

            <Card
              role="button"
              tabIndex={0}
              onClick={() => openStatusWithFilter({ status: "out" })}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openStatusWithFilter({ status: "out" });
                }
              }}
              className="group cursor-pointer transition-colors hover:border-danger/60"
            >
              <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
                <CardDescription className="text-[11px] font-semibold uppercase tracking-wider text-paper-dim">
                  Out / Low Stock
                </CardDescription>
                <span className="flex size-8 shrink-0 items-center justify-center border border-danger/30 bg-danger/10 text-danger">
                  <AlertTriangle size={15} />
                </span>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-2xl text-danger sm:text-3xl">
                    {totals.outOfStockProductsCount}
                  </span>
                  <span className="text-xs font-medium text-gold">
                    · {totals.lowStockProductsCount} low
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-danger group-hover:underline">
                  <span>Inspect alerts</span>
                  <ArrowRight size={12} />
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 2. Warehouse Stock by Size Card */}
          <Card>
            <CardHeader className="flex flex-col gap-2 border-b border-ink-border sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Total Warehouse Stock by Size</CardTitle>
                <CardDescription className="mt-0.5">
                  Combined available units for each jersey size across all categories
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("status")}
                className="w-full sm:w-auto"
              >
                <span>Open Stock Status</span>
                <ArrowRight size={14} />
              </Button>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-5">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5 sm:gap-3.5">
                {AVAILABLE_SIZES.filter(
                  (size) =>
                    (sizeTotals[size] ?? 0) > 0 ||
                    ["S", "M", "L", "XL", "XXL"].includes(size),
                ).map((size) => {
                  const count = sizeTotals[size] ?? 0;
                  const share = Math.round((count / maxSizeCount) * 100);
                  return (
                    <div
                      key={size}
                      className="flex flex-col justify-between border border-ink-border bg-ink p-3 sm:p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest text-paper-dim">
                          Size {size}
                        </span>
                        <Badge variant={count > 0 ? "neutral" : "danger"} className="px-1.5 py-0.5">
                          {count > 0 ? "Active" : "Empty"}
                        </Badge>
                      </div>
                      <div className="my-2.5 flex items-baseline gap-1.5">
                        <span className="font-display text-2xl text-gold-bright sm:text-3xl">
                          {count}
                        </span>
                        <span className="text-[11px] uppercase tracking-wider text-paper-dim">
                          units
                        </span>
                      </div>
                      <Progress value={share} className="h-1.5" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 3. Category-Wise Stock Overview */}
          <Card>
            <CardHeader className="border-b border-ink-border">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center border border-gold/40 bg-gold/10 text-gold">
                  <FolderTree size={16} />
                </span>
                <div>
                  <CardTitle>Category-Wise Stock Overview</CardTitle>
                  <CardDescription className="mt-0.5">
                    Select any category below to filter its products in the Stock Status tab
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-5">
              <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
                {categories.map((cat) => {
                  const isJersey = isJerseySubCategory(cat);
                  const healthPercent =
                    cat.productCount > 0
                      ? Math.round((cat.inStockCount / cat.productCount) * 100)
                      : 0;

                  return (
                    <Card
                      key={cat.id}
                      className="justify-between bg-ink transition-colors hover:border-gold-bright"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-gold">
                              {isJersey ? "Jersey Category" : "Product Category"}
                            </span>
                            <CardTitle className="mt-1 text-base">{cat.name}</CardTitle>
                          </div>
                          <Badge variant={cat.totalStock > 0 ? "gold" : "danger"}>
                            {cat.totalStock} {cat.totalStock === 1 ? "unit" : "units"}
                          </Badge>
                        </div>

                        <div className="mt-3 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-paper-dim">
                            <span>Availability Ratio</span>
                            <span className="font-mono font-semibold text-paper">
                              {healthPercent}%
                            </span>
                          </div>
                          <Progress
                            value={healthPercent}
                            indicatorClassName={
                              cat.totalStock === 0
                                ? "bg-danger"
                                : healthPercent === 100
                                  ? "bg-emerald-400"
                                  : "bg-gold-bright"
                            }
                          />
                        </div>
                      </CardHeader>

                      <CardContent className="pb-3">
                        <div className="grid grid-cols-3 gap-2 border-t border-ink-border pt-3 text-center">
                          <div className="border border-ink-border bg-ink-raised/50 px-2 py-2">
                            <p className="text-[10px] uppercase tracking-wider text-paper-dim">
                              Products
                            </p>
                            <p className="mt-0.5 font-mono text-sm font-bold text-paper">
                              {cat.productCount}
                            </p>
                          </div>
                          <div className="border border-emerald-500/20 bg-emerald-500/5 px-2 py-2">
                            <p className="text-[10px] uppercase tracking-wider text-emerald-400">
                              In Stock
                            </p>
                            <p className="mt-0.5 font-mono text-sm font-bold text-emerald-400">
                              {cat.inStockCount}
                            </p>
                          </div>
                          <div className="border border-danger/20 bg-danger/5 px-2 py-2">
                            <p className="text-[10px] uppercase tracking-wider text-paper-dim">
                              Out
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
                      </CardContent>

                      <CardFooter className="bg-ink-raised/40 py-2.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            openStatusWithFilter({ categorySlug: cat.slug, status: "all" })
                          }
                          className="w-full justify-between px-0 py-1 text-xs text-gold hover:text-gold-bright"
                        >
                          <span>Inspect {cat.name} Stock</span>
                          <ArrowRight size={14} />
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 4. Low / Out of Stock Restock Watchlist Card */}
          {attentionProducts.length > 0 && (
            <Card className="border-gold/40">
              <CardHeader className="flex flex-col gap-2 border-b border-ink-border sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center border border-danger/40 bg-danger/10 text-danger">
                    <AlertTriangle size={16} />
                  </span>
                  <div>
                    <CardTitle>Restock Priority Watchlist</CardTitle>
                    <CardDescription className="mt-0.5">
                      Products currently out of stock or running low (5 units or fewer)
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => openStatusWithFilter({ status: "low" })}
                  className="w-full sm:w-auto"
                >
                  <span>View All Low Stock</span>
                  <ArrowRight size={14} />
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {attentionProducts.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 border border-ink-border bg-ink p-3"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/admin/products/${item.id}`}
                          className="block truncate text-xs font-semibold text-paper hover:text-gold"
                        >
                          {item.name}
                        </Link>
                        <p className="mt-0.5 font-mono text-[11px] text-paper-dim">
                          {item.categoryName} · {item.sku}
                        </p>
                      </div>
                      <Badge variant={item.totalStock === 0 ? "danger" : "gold"}>
                        {item.totalStock === 0 ? "Out" : `${item.totalStock} left`}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ================================================================= */}
        {/* TAB 2: STOCK STATUS (Screen-Height Table + API Pagination)        */}
        {/* ================================================================= */}
        <TabsContent
          value="status"
          className={`flex flex-col gap-3.5 ${
            isDesktopFixedTable ? "min-[1200px]:min-h-0 min-[1200px]:flex-1" : ""
          }`}
        >
          {/* Controls Card using Shadcn Tabs, Input, Select & Buttons */}
          <Card className="shrink-0">
            <CardHeader className="gap-3 border-b border-ink-border px-4 py-3">
              <div className="flex flex-col gap-3 min-[1200px]:flex-row min-[1200px]:items-center min-[1200px]:justify-between">
                {/* Status Filter Shadcn Tabs */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-paper-dim">
                    <ListFilter size={14} className="text-gold" />
                    <span>Status:</span>
                  </span>
                  <Tabs
                    value={stockFilter}
                    onValueChange={(v) => setStockFilter(v as StockStatusFilter)}
                    className="w-full sm:w-auto"
                  >
                    <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-ink p-1 sm:inline-flex sm:w-auto">
                      <TabsTrigger value="all" className="px-3 py-1.5 text-[11px]">
                        All ({totals.totalProducts})
                      </TabsTrigger>
                      <TabsTrigger value="in" className="px-3 py-1.5 text-[11px]">
                        In Stock ({totals.inStockProductsCount})
                      </TabsTrigger>
                      <TabsTrigger value="low" className="px-3 py-1.5 text-[11px]">
                        Low ({totals.lowStockProductsCount})
                      </TabsTrigger>
                      <TabsTrigger value="out" className="px-3 py-1.5 text-[11px]">
                        Out ({totals.outOfStockProductsCount})
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Desktop View Switcher (Table vs Cards) + Expand All (>= 1200px) */}
                <div className="hidden items-center gap-2.5 min-[1200px]:flex">
                  {viewMode === "table" && sizedProductsInView.length > 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={toggleExpandAll}
                      className="h-9 px-3"
                    >
                      {allSizedExpanded ? (
                        <>
                          <ChevronUp size={14} />
                          <span>Collapse All</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown size={14} />
                          <span>Expand All</span>
                        </>
                      )}
                    </Button>
                  )}

                  <Tabs
                    value={viewMode}
                    onValueChange={(v) => setViewMode(v as "table" | "cards")}
                  >
                    <TabsList className="h-9 min-h-9 bg-ink p-1">
                      <TabsTrigger value="table" className="h-7 px-3 py-1 text-[11px]">
                        <Table2 size={14} />
                        <span>Table</span>
                      </TabsTrigger>
                      <TabsTrigger value="cards" className="h-7 px-3 py-1 text-[11px]">
                        <LayoutGrid size={14} />
                        <span>Cards</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-4 py-3">
              <div className="flex flex-col gap-3 min-[1200px]:flex-row min-[1200px]:items-center min-[1200px]:justify-between">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 min-[1200px]:flex min-[1200px]:flex-1 min-[1200px]:items-center min-[1200px]:gap-3">
                  {/* Search Input */}
                  <div className="relative sm:col-span-2 md:col-span-1 min-[1200px]:max-w-xs min-[1200px]:flex-1">
                    <Search
                      size={15}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-paper-dim"
                    />
                    <Input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search product, SKU, category..."
                      className="h-10 bg-ink py-2 pl-9 pr-3 text-sm"
                    />
                  </div>

                  {/* Category Select */}
                  <Select
                    value={selectedCategorySlug}
                    onValueChange={setSelectedCategorySlug}
                  >
                    <SelectTrigger
                      aria-label="Filter by category"
                      className="h-10 w-full bg-ink min-[1200px]:w-48"
                    >
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

                  {/* Sort Select */}
                  <Select
                    value={sortBy}
                    onValueChange={(val) => setSortBy(val as SortByOption)}
                  >
                    <SelectTrigger
                      aria-label="Sort products"
                      className="h-10 w-full bg-ink min-[1200px]:w-52"
                    >
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Sort: Category &amp; Newest</SelectItem>
                      <SelectItem value="stock-asc">Stock: Low to High</SelectItem>
                      <SelectItem value="stock-desc">Stock: High to Low</SelectItem>
                      <SelectItem value="name-asc">Product Name: A–Z</SelectItem>
                    </SelectContent>
                  </Select>

                  {hasActiveFilters && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedCategorySlug(ALL);
                        setStockFilter("all");
                        setSearchQuery("");
                        setSortBy("default");
                      }}
                      className="h-10 px-3 sm:col-span-2 md:col-span-3 min-[1200px]:w-auto"
                    >
                      <X size={14} />
                      <span>Reset</span>
                    </Button>
                  )}
                </div>

                {/* Result Count + Loading Indicator + Mobile/Tablet Expand Toggle */}
                <div className="flex shrink-0 items-center justify-between gap-3 border-t border-ink-border pt-2.5 min-[1200px]:border-t-0 min-[1200px]:pt-0">
                  <div className="flex items-center gap-2 text-xs text-paper-dim">
                    {isLoading && (
                      <Loader2 size={14} className="animate-spin text-gold-bright" />
                    )}
                    <span>
                      Showing{" "}
                      <strong className="text-paper">
                        {rangeStart}–{rangeEnd}
                      </strong>{" "}
                      of <strong className="text-paper">{totalItems}</strong> products
                    </span>
                  </div>
                  {sizedProductsInView.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleExpandAll}
                      className="h-auto px-2 py-1 text-xs text-gold min-[1200px]:hidden"
                    >
                      {allSizedExpanded ? (
                        <>
                          <span>Hide SKUs</span>
                          <ChevronUp size={13} />
                        </>
                      ) : (
                        <>
                          <span>Show SKUs</span>
                          <ChevronDown size={13} />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Stock Status Results */}
          {products.length === 0 && !isLoading ? (
            <Card className="py-12 text-center">
              <CardContent className="flex flex-col items-center justify-center gap-3 pt-6">
                <Package size={36} className="text-paper-dim" />
                <div>
                  <p className="text-base font-semibold text-paper">No matching products found</p>
                  <p className="mt-1 text-xs text-paper-dim">
                    Try clearing your search query or switching the category/status filter.
                  </p>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCategorySlug(ALL);
                      setStockFilter("all");
                      setSearchQuery("");
                      setSortBy("default");
                    }}
                  >
                    <X size={14} />
                    <span>Reset All Filters</span>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div
              className={`transition-opacity duration-200 ${isLoading ? "opacity-60" : ""} ${
                isDesktopFixedTable
                  ? "min-[1200px]:flex min-[1200px]:min-h-0 min-[1200px]:flex-1 min-[1200px]:flex-col"
                  : ""
              }`}
            >
              {/* MOBILE & TABLET VIEW (< 1200px) OR DESKTOP CARD VIEW */}
              <div
                className={
                  viewMode === "cards"
                    ? "grid grid-cols-1 gap-4 md:grid-cols-2 min-[1200px]:grid-cols-3"
                    : "grid grid-cols-1 gap-3.5 md:grid-cols-2 min-[1200px]:hidden"
                }
              >
                {products.map((product) => (
                  <ProductStockStatusCard
                    key={product.id}
                    product={product}
                    isExpanded={expandedProductIds.has(product.id)}
                    onToggleExpand={() => toggleExpand(product.id)}
                  />
                ))}
              </div>

              {/* DESKTOP SCREEN-HEIGHT TABLE VIEW (>= 1200px when viewMode === "table") */}
              {viewMode === "table" && (
                <div
                  ref={tableContainerRef}
                  className="hidden min-[1200px]:flex min-[1200px]:min-h-0 min-[1200px]:flex-1 min-[1200px]:flex-col"
                >
                  <Table containerClassName="h-full min-h-0 flex-1 overflow-y-auto">
                    <TableHeader className="sticky top-0 z-10 bg-ink-raised shadow-xs">
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Product &amp; SKU</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Sizes &amp; Stock Quantity</TableHead>
                        <TableHead className="text-center">Total Stock</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => {
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
                          <ProductStockTableRow
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
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          {/* Shadcn Pagination Bar calling /api/admin/stocks */}
          {totalItems > 0 && (
            <Card className="shrink-0">
              <CardContent className="flex flex-col items-center justify-between gap-3 px-4 py-2.5 sm:flex-row sm:px-5">
                <div className="flex flex-wrap items-center gap-3 text-xs text-paper-dim">
                  <span>
                    Page <strong className="text-paper">{page}</strong> of{" "}
                    <strong className="text-paper">{totalPages}</strong> ({totalItems} total)
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-paper-dim">Rows:</span>
                    <Select
                      value={String(pageSize)}
                      onValueChange={(v) => setPageSize(Number(v))}
                    >
                      <SelectTrigger
                        aria-label="Rows per page"
                        className="h-9 w-22 bg-ink px-2.5 py-1 text-xs"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 / pg</SelectItem>
                        <SelectItem value="20">20 / pg</SelectItem>
                        <SelectItem value="30">30 / pg</SelectItem>
                        <SelectItem value="50">50 / pg</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        disabled={page <= 1 || isLoading}
                        onClick={() => handlePageChange(page - 1)}
                      />
                    </PaginationItem>

                    {pageNumbers.map((item, idx) =>
                      item === "ellipsis" ? (
                        <PaginationItem key={`ellipsis-${idx}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={item}>
                          <PaginationButton
                            isActive={item === page}
                            disabled={isLoading}
                            onClick={() => handlePageChange(item)}
                          >
                            {item}
                          </PaginationButton>
                        </PaginationItem>
                      ),
                    )}

                    <PaginationItem>
                      <PaginationNext
                        disabled={page >= totalPages || isLoading}
                        onClick={() => handlePageChange(page + 1)}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ========================================================================= */
/* Responsive Shadcn Card for Mobile, Tablet (2-col), and Desktop Card View  */
/* ========================================================================= */
function ProductStockStatusCard({
  product,
  isExpanded,
  onToggleExpand,
}: {
  product: StockProductRow;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
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
  const inStock = product.totalStock > 0;

  return (
    <Card className="justify-between overflow-hidden transition-colors hover:border-ink-border/90">
      <div>
        <CardHeader className="flex-row items-start gap-3.5 border-b border-ink-border bg-ink-raised/60 p-3.5 sm:p-4">
          <Link
            href={`/admin/products/${product.id}`}
            className="relative h-16 w-14 shrink-0 overflow-hidden border border-ink-border bg-ink"
          >
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
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <span className="truncate text-[10px] font-semibold uppercase tracking-widest text-gold">
                {isJersey ? `Jersey · ${product.categoryName}` : product.categoryName}
                {subTypeLabel ? ` · ${subTypeLabel}` : ""}
              </span>
              <Badge variant={inStock ? "emerald" : "danger"}>
                {inStock ? `${product.totalStock} in stock` : "Out of Stock"}
              </Badge>
            </div>

            <Link
              href={`/admin/products/${product.id}`}
              className="mt-1 line-clamp-1 block text-sm font-semibold text-paper hover:text-gold sm:text-base"
            >
              {product.name}
            </Link>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-paper-dim">
              <span className="font-mono">
                SKU: <strong className="text-paper/85">{product.sku || "—"}</strong>
              </span>
              {!product.published && (
                <Badge variant="neutral" className="px-1.5 py-0 text-[9px]">
                  Draft
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3.5 sm:p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-paper-dim">
              {product.hasSizes ? "Stock by Size" : "Inventory Quantity"}
            </span>
            <span className="font-mono text-xs font-bold text-gold">
              Total: {product.totalStock} {product.totalStock === 1 ? "unit" : "units"}
            </span>
          </div>

          {!product.hasSizes ? (
            <div className="flex items-center justify-between border border-ink-border bg-ink px-3.5 py-2.5">
              <span className="text-xs text-paper-dim">Regular Stock (No Sizes)</span>
              <span
                className={`font-mono text-sm font-bold ${
                  inStock ? "text-emerald-400" : "text-danger"
                }`}
              >
                {product.totalStock} {product.totalStock === 1 ? "unit" : "units"}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {orderedVariants.map((v) => {
                const sizeInStock = v.stock > 0;
                const isLow = v.stock > 0 && v.stock <= 3;
                return (
                  <div
                    key={v.id}
                    className={`flex flex-col items-center justify-center border py-2 text-center transition-colors ${
                      !sizeInStock
                        ? "border-danger/40 bg-danger/10 text-danger"
                        : isLow
                          ? "border-gold/50 bg-gold/10 text-gold"
                          : "border-ink-border bg-ink text-paper"
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                      {v.size}
                    </span>
                    <span className="mt-0.5 font-mono text-sm font-bold">{v.stock}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Expandable Detailed Variant SKU Table */}
          {isExpanded && product.hasSizes && (
            <div className="mt-3.5">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-8 px-2.5 py-1.5 text-[10px]">Size</TableHead>
                    <TableHead className="h-8 px-2.5 py-1.5 text-[10px]">Variant SKU</TableHead>
                    <TableHead className="h-8 px-2.5 py-1.5 text-right text-[10px]">Qty</TableHead>
                    <TableHead className="h-8 px-2.5 py-1.5 text-right text-[10px]">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderedVariants.map((v) => {
                    const sizeInStock = v.stock > 0;
                    return (
                      <TableRow key={v.id}>
                        <TableCell className="px-2.5 py-2 text-xs font-semibold text-paper">
                          {v.size}
                        </TableCell>
                        <TableCell className="px-2.5 py-2 font-mono text-[11px] text-paper-dim">
                          {v.sku}
                        </TableCell>
                        <TableCell
                          className={`px-2.5 py-2 text-right font-mono text-xs font-bold ${
                            sizeInStock ? "text-paper" : "text-danger"
                          }`}
                        >
                          {v.stock}
                        </TableCell>
                        <TableCell className="px-2.5 py-2 text-right">
                          <Badge
                            variant={sizeInStock ? "success" : "danger"}
                            className="px-1.5 py-0.5 text-[9px]"
                          >
                            {sizeInStock ? "In Stock" : "Out"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </div>

      <CardFooter className="grid grid-cols-2 gap-2 border-t border-ink-border bg-ink px-3.5 py-2.5 sm:px-4">
        {product.hasSizes ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={onToggleExpand}
            className="w-full px-2.5 py-2 text-[11px]"
          >
            {isExpanded ? (
              <>
                <span>Hide SKUs</span>
                <ChevronUp size={13} />
              </>
            ) : (
              <>
                <span>SKU Details</span>
                <ChevronDown size={13} />
              </>
            )}
          </Button>
        ) : (
          <div className="flex items-center justify-center border border-ink-border bg-ink-raised py-2 text-[11px] uppercase tracking-wider text-paper-dim">
            Single SKU
          </div>
        )}

        <Button variant="outline" size="sm" asChild className="w-full px-2.5 py-2 text-[11px]">
          <Link href={`/admin/products/${product.id}`}>
            <Pencil size={13} />
            <span>Edit Stock</span>
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

/* ========================================================================= */
/* Desktop Shadcn Table Row with Expandable Variant Breakdown                */
/* ========================================================================= */
function ProductStockTableRow({
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
      <TableRow
        data-state={isExpanded ? "selected" : undefined}
        onClick={() => {
          if (product.hasSizes) onToggleExpand();
        }}
        className={product.hasSizes ? "cursor-pointer" : ""}
      >
        <TableCell className="py-3">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-10 shrink-0 overflow-hidden border border-ink-border bg-ink-raised">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[9px] text-paper-dim">
                  No img
                </div>
              )}
            </div>
            <div className="min-w-0">
              <Link
                href={`/admin/products/${product.id}`}
                onClick={(e) => e.stopPropagation()}
                className="line-clamp-1 font-medium text-paper hover:text-gold"
              >
                {product.name}
              </Link>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-paper-dim">
                <span className="font-mono text-paper-dim">{product.sku || "—"}</span>
                {!product.published && (
                  <Badge variant="neutral" className="px-1.5 py-0 text-[9px]">
                    Draft
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </TableCell>

        <TableCell className="whitespace-nowrap py-3">
          <Badge variant="neutral">
            {isJersey ? `Jersey · ${product.categoryName}` : product.categoryName}
          </Badge>
          {subTypeLabel && (
            <p className="mt-1 text-[11px] text-paper-dim">{subTypeLabel}</p>
          )}
        </TableCell>

        <TableCell className="py-3">
          {!product.hasSizes ? (
            <div className="inline-flex items-center gap-2.5 border border-ink-border bg-ink-raised px-3 py-1.5">
              <span className="text-xs text-paper-dim">Regular Stock:</span>
              <span
                className={`font-mono text-xs font-bold ${
                  product.totalStock > 0 ? "text-emerald-400" : "text-danger"
                }`}
              >
                {product.totalStock} {product.totalStock === 1 ? "unit" : "units"}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              {orderedVariants.map((v) => {
                const sizeInStock = v.stock > 0;
                const isLow = v.stock > 0 && v.stock <= 3;
                return (
                  <div
                    key={v.id}
                    className={`flex w-11 flex-col items-center border py-1 text-center ${
                      !sizeInStock
                        ? "border-danger/35 bg-danger/10 text-danger"
                        : isLow
                          ? "border-gold/50 bg-gold/10 text-gold"
                          : "border-ink-border bg-ink-raised text-paper"
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
        </TableCell>

        <TableCell className="whitespace-nowrap py-3 text-center">
          <div className="flex flex-col items-center gap-1">
            <span
              className={`font-mono text-sm font-bold ${
                product.totalStock > 0 ? "text-gold" : "text-danger"
              }`}
            >
              {product.totalStock} {product.totalStock === 1 ? "unit" : "units"}
            </span>
            <Badge
              variant={inStock ? "emerald" : "danger"}
              className="px-2 py-0.5 text-[10px]"
            >
              {inStock ? "In Stock" : "Out of Stock"}
            </Badge>
          </div>
        </TableCell>

        <TableCell
          className="whitespace-nowrap py-3 text-right"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-end gap-1.5">
            {product.hasSizes && (
              <Button
                variant={isExpanded ? "primary" : "secondary"}
                size="sm"
                onClick={onToggleExpand}
                className="h-8 px-2.5 py-1 text-[11px]"
              >
                {isExpanded ? (
                  <>
                    <span>Hide</span>
                    <ChevronUp size={13} />
                  </>
                ) : (
                  <>
                    <span>SKUs</span>
                    <ChevronDown size={13} />
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-8 px-2.5 py-1 text-[11px]"
            >
              <Link href={`/admin/products/${product.id}`}>
                <span>Edit</span>
                <ExternalLink size={12} />
              </Link>
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {isExpanded && product.hasSizes && (
        <TableRow className="bg-ink-raised/50 hover:bg-ink-raised/50">
          <TableCell colSpan={5} className="p-4">
            <Card className="bg-ink">
              <CardContent className="grid grid-cols-1 gap-5 p-4 lg:grid-cols-12">
                <div className="flex flex-col justify-between border-b border-ink-border pb-4 lg:col-span-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
                  <div>
                    <Badge variant="gold" className="mb-2">
                      Size-Wise Inventory
                    </Badge>
                    <h4 className="text-base font-semibold text-paper">{product.name}</h4>
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
                        {orderedVariants.filter((v) => v.stock > 0).length} /{" "}
                        {orderedVariants.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-8">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Size</TableHead>
                        <TableHead>Variant SKU</TableHead>
                        <TableHead className="text-right">Available Quantity</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderedVariants.map((v) => {
                        const sizeInStock = v.stock > 0;
                        return (
                          <TableRow key={v.id}>
                            <TableCell className="py-2 font-semibold text-paper">
                              {isNoSizeVariant(v.size) ? "Regular" : v.size}
                            </TableCell>
                            <TableCell className="py-2 font-mono text-xs text-paper-dim">
                              {v.sku}
                            </TableCell>
                            <TableCell
                              className={`py-2 text-right font-mono text-sm font-bold ${
                                sizeInStock ? "text-paper" : "text-danger"
                              }`}
                            >
                              {v.stock}
                            </TableCell>
                            <TableCell className="py-2.5 text-right">
                              <Badge variant={sizeInStock ? "emerald" : "danger"}>
                                {sizeInStock ? "In Stock" : "Out of Stock"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={2} className="py-2.5 font-semibold">
                          Total Stock
                        </TableCell>
                        <TableCell className="py-2.5 text-right font-mono text-sm font-bold text-gold">
                          {product.totalStock} units
                        </TableCell>
                        <TableCell className="py-2.5 text-right">
                          <Badge variant={inStock ? "emerald" : "danger"}>
                            {inStock ? "In Stock" : "Out of Stock"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
