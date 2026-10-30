"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
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
    router.push(`${pathname}?${params.toString()}`);
  }

  function updateParam(key: string, value: string | null) {
    updateParams({ [key]: value });
  }

  const activeCategory = lockCategory ? (lockedCategorySlug ?? "") : (searchParams.get("category") ?? "");
  const activeType = searchParams.get("type") ?? "";
  const activeSize = searchParams.get("size") ?? "";
  const activeSort = searchParams.get("sort") ?? "newest";
  const activeAvailability = searchParams.get("availability") ?? "";
  const activeMin = searchParams.get("minPrice") ?? "";
  const activeMax = searchParams.get("maxPrice") ?? "";

  const currentCategoryObj = categories.find((c) => c.slug === activeCategory) ?? {
    slug: activeCategory,
    name: activeCategory,
  };
  const showClubTypeSelect = isClubCategory(currentCategoryObj);

  const hasActiveFilters = Boolean(
    (!lockCategory && activeCategory) ||
      activeType ||
      activeSize ||
      activeAvailability ||
      activeMin ||
      activeMax
  );

  const controls = (
    <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
      {!lockCategory && (
        <Select
          value={activeCategory || ALL}
          onValueChange={(value) => {
            const nextCat = value === ALL ? null : value;
            const nextCatObj = categories.find((c) => c.slug === nextCat) ?? null;
            updateParams({
              category: nextCat,
              ...(isClubCategory(nextCatObj) ? {} : { type: null }),
            });
          }}
        >
          <SelectTrigger aria-label="Filter by category" className="sm:w-52">
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

      <Select
        value={activeSize || ALL}
        onValueChange={(value) => updateParam("size", value === ALL ? null : value)}
      >
        <SelectTrigger aria-label="Filter by size" className="sm:w-32">
          <SelectValue />
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
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All Availability</SelectItem>
          <SelectItem value="in-stock">In Stock Only</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="Min ৳"
          defaultValue={activeMin}
          onBlur={(e) =>
            updateParam("minPrice", e.target.value ? String(Number(e.target.value) * 100) : null)
          }
          className="w-24 border border-ink-border bg-ink-raised px-3 py-2.5 text-sm placeholder:text-paper-dim focus:border-gold focus:outline-none"
          aria-label="Minimum price"
        />
        <span className="text-paper-dim">-</span>
        <input
          type="number"
          placeholder="Max ৳"
          defaultValue={activeMax}
          onBlur={(e) =>
            updateParam("maxPrice", e.target.value ? String(Number(e.target.value) * 100) : null)
          }
          className="w-24 border border-ink-border bg-ink-raised px-3 py-2.5 text-sm placeholder:text-paper-dim focus:border-gold focus:outline-none"
          aria-label="Maximum price"
        />
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="flex items-center gap-1 text-xs uppercase tracking-wider text-paper-dim hover:text-gold"
        >
          <X size={14} /> Clear
        </button>
      )}
    </div>
  );

  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-ink-border pb-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider sm:hidden"
        >
          <SlidersHorizontal size={16} /> Filters
        </button>

        <Select value={activeSort} onValueChange={(value) => updateParam("sort", value)}>
          <SelectTrigger aria-label="Sort products" className="ml-auto w-44">
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
      </div>

      <div className={`${mobileOpen ? "block" : "hidden"} sm:block`}>{controls}</div>
    </div>
  );
}
