"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import {
  AVAILABLE_SIZES,
  SORT_OPTIONS,
  CLUB_TYPES,
  CLUB_TYPE_LABELS,
  isClubCategory,
} from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ALL = "__all__";

interface CategoryOption {
  name: string;
  slug: string;
}

export function ShopFilters({
  categories,
  lockCategory = false,
  lockedCategorySlug,
}: {
  categories: CategoryOption[];
  lockCategory?: boolean;
  lockedCategorySlug?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeCategory = lockCategory ? (lockedCategorySlug ?? "") : (searchParams.get("category") ?? "");
  const activeType = searchParams.get("type") ?? "";
  const activeSize = searchParams.get("size") ?? "";
  const activeSort = searchParams.get("sort") ?? "newest";
  const activeAvailability = searchParams.get("availability") ?? "";
  const activeMinCents = searchParams.get("minPrice") ?? "";
  const activeMaxCents = searchParams.get("maxPrice") ?? "";

  const activeMinBdt =
    activeMinCents && !Number.isNaN(Number(activeMinCents))
      ? String(Math.round(Number(activeMinCents) / 100))
      : "";
  const activeMaxBdt =
    activeMaxCents && !Number.isNaN(Number(activeMaxCents))
      ? String(Math.round(Number(activeMaxCents) / 100))
      : "";

  const [minInput, setMinInput] = useState(activeMinBdt);
  const [maxInput, setMaxInput] = useState(activeMaxBdt);

  useEffect(() => {
    setMinInput(activeMinBdt);
  }, [activeMinBdt]);

  useEffect(() => {
    setMaxInput(activeMaxBdt);
  }, [activeMaxBdt]);

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function updateParam(key: string, value: string | null) {
    updateParams({ [key]: value });
  }

  function commitPriceRange(nextMinBdt: string, nextMaxBdt: string) {
    const trimmedMin = nextMinBdt.trim();
    const trimmedMax = nextMaxBdt.trim();
    const minVal =
      trimmedMin !== "" && !Number.isNaN(Number(trimmedMin)) && Number(trimmedMin) >= 0
        ? String(Math.round(Number(trimmedMin) * 100))
        : null;
    const maxVal =
      trimmedMax !== "" && !Number.isNaN(Number(trimmedMax)) && Number(trimmedMax) >= 0
        ? String(Math.round(Number(trimmedMax) * 100))
        : null;

    if ((minVal ?? "") === activeMinCents && (maxVal ?? "") === activeMaxCents) {
      return;
    }
    updateParams({ minPrice: minVal, maxPrice: maxVal });
  }

  const currentCategoryObj = categories.find((c) => c.slug === activeCategory) ?? {
    slug: activeCategory,
    name: activeCategory,
  };
  const showClubTypeSelect = !activeCategory || isClubCategory(currentCategoryObj);

  const hasActiveFilters = Boolean(
    (!lockCategory && activeCategory) ||
      activeType ||
      activeSize ||
      activeAvailability ||
      activeMinCents ||
      activeMaxCents
  );

  const controls = (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
      {!lockCategory && (
        <Select
          value={activeCategory || ALL}
          onValueChange={(value) => {
            const nextCat = value === ALL ? null : value;
            const nextCatObj = categories.find((c) => c.slug === nextCat) ?? null;
            updateParams({
              category: nextCat,
              ...(!nextCat || isClubCategory(nextCatObj) ? {} : { type: null }),
            });
          }}
        >
          <SelectTrigger aria-label="Filter by category" className="sm:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.slug} value={c.slug}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showClubTypeSelect && (
        <Select
          value={activeType || ALL}
          onValueChange={(value) => updateParam("type", value === ALL ? null : value)}
        >
          <SelectTrigger aria-label="Filter by club type" className="sm:w-44">
            <SelectValue placeholder="All Club Types" />
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

      <Select
        value={activeSize || ALL}
        onValueChange={(value) => updateParam("size", value === ALL ? null : value)}
      >
        <SelectTrigger aria-label="Filter by size" className="sm:w-32">
          <SelectValue placeholder="All Sizes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All Sizes</SelectItem>
          {AVAILABLE_SIZES.map((size) => (
            <SelectItem key={size} value={size}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={activeAvailability || ALL}
        onValueChange={(value) => updateParam("availability", value === ALL ? null : value)}
      >
        <SelectTrigger aria-label="Filter by availability" className="sm:w-40">
          <SelectValue placeholder="All Availability" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All Availability</SelectItem>
          <SelectItem value="in-stock">In Stock Only</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          placeholder="Min ৳"
          value={minInput}
          onChange={(e) => setMinInput(e.target.value)}
          onBlur={(e) => commitPriceRange(e.target.value, maxInput)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitPriceRange(e.currentTarget.value, maxInput);
            }
          }}
          className="h-10 w-24 border border-ink-border bg-ink-raised px-3 text-sm text-paper placeholder:text-paper-dim focus:border-gold focus:outline-none"
          aria-label="Minimum price"
        />
        <span className="text-paper-dim">-</span>
        <input
          type="number"
          min={0}
          placeholder="Max ৳"
          value={maxInput}
          onChange={(e) => setMaxInput(e.target.value)}
          onBlur={(e) => commitPriceRange(minInput, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitPriceRange(minInput, e.currentTarget.value);
            }
          }}
          className="h-10 w-24 border border-ink-border bg-ink-raised px-3 text-sm text-paper placeholder:text-paper-dim focus:border-gold focus:outline-none"
          aria-label="Maximum price"
        />
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => {
            setMinInput("");
            setMaxInput("");
            updateParams({
              category: null,
              type: null,
              size: null,
              availability: null,
              minPrice: null,
              maxPrice: null,
            });
          }}
          className="inline-flex h-10 items-center gap-1.5 border border-ink-border px-3 text-xs font-semibold uppercase tracking-wider text-paper-muted transition-colors hover:border-gold hover:text-gold"
        >
          <X size={14} /> Clear
        </button>
      )}
    </div>
  );

  const sortSelect = (
    <Select value={activeSort} onValueChange={(value) => updateParam("sort", value)}>
      <SelectTrigger aria-label="Sort products" className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-ink-border pb-6">
      {/* Mobile top bar: Filters toggle on left, Sort on right */}
      <div className="flex items-center justify-between sm:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex h-10 items-center gap-2 border border-ink-border bg-ink-raised px-3.5 text-xs font-semibold uppercase tracking-wider text-paper"
        >
          <SlidersHorizontal size={15} /> Filters
          {hasActiveFilters && (
            <span className="ml-0.5 inline-block h-2 w-2 rounded-full bg-gold" />
          )}
        </button>
        {sortSelect}
      </div>

      {/* Mobile collapsible filters */}
      {mobileOpen && <div className="sm:hidden">{controls}</div>}

      {/* Desktop single-row bar: Filters on left, Sort on right */}
      <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        {controls}
        <div className="ml-auto shrink-0">{sortSelect}</div>
      </div>
    </div>
  );
}
