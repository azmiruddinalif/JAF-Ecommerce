"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Minus, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AVAILABLE_SIZES, NO_SIZE_VALUE, isNoSizeVariant } from "@/lib/constants";
import { unitsToCents, centsToUnits } from "@/lib/money";

export interface VariantRow {
  id?: string;
  size: string;
  sku: string;
  priceUnits: string;
  stock: string;
  color: string;
  edition: string;
  playerName: string;
  playerNumber: string;
}

export function createEmptyVariantRow(size = "M", defaultStock = "10"): VariantRow {
  return {
    size,
    sku: "",
    priceUnits: "",
    stock: defaultStock,
    color: "",
    edition: "",
    playerName: "",
    playerNumber: "",
  };
}

export function VariantBuilder({
  initialRows,
  productSku = "",
}: {
  initialRows: VariantRow[];
  productSku?: string;
}) {
  const initialIsNoSize =
    initialRows.length === 1 && isNoSizeVariant(initialRows[0]?.size);

  const [inventoryMode, setInventoryMode] = useState<"sizes" | "no-sizes">(
    initialIsNoSize ? "no-sizes" : "sizes"
  );

  const [rows, setRows] = useState<VariantRow[]>(
    initialRows.length > 0 ? initialRows : [createEmptyVariantRow()]
  );

  const [bulkStockValue, setBulkStockValue] = useState("10");
  const [expandedAdvancedRows, setExpandedAdvancedRows] = useState<Set<number>>(new Set());

  function toggleAdvancedRow(index: number) {
    setExpandedAdvancedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function switchInventoryMode(nextMode: "sizes" | "no-sizes") {
    setInventoryMode(nextMode);
    if (nextMode === "no-sizes") {
      setRows((prev) => {
        const first = prev[0] ?? createEmptyVariantRow(NO_SIZE_VALUE);
        const totalExistingStock = prev.reduce(
          (sum, r) => sum + (Number(r.stock) >= 0 ? Number(r.stock) : 0),
          0
        );
        return [
          {
            ...first,
            size: NO_SIZE_VALUE,
            stock: String(totalExistingStock),
          },
        ];
      });
    } else {
      setRows((prev) => {
        if (prev.length === 1 && isNoSizeVariant(prev[0]?.size)) {
          return [{ ...prev[0], size: "M" }];
        }
        return prev.length > 0 ? prev : [createEmptyVariantRow("M")];
      });
    }
  }

  function updateRow(index: number, patch: Partial<VariantRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function adjustRowStock(index: number, delta: number) {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const current = Number(row.stock) >= 0 ? Number(row.stock) : 0;
        return { ...row, stock: String(Math.max(0, current + delta)) };
      })
    );
  }

  function toggleQuickSizeChip(size: string) {
    setRows((prev) => {
      const existsIdx = prev.findIndex((r) => r.size.toUpperCase() === size.toUpperCase());
      if (existsIdx >= 0) {
        if (prev.length <= 1) return prev;
        return prev.filter((_, idx) => idx !== existsIdx);
      }
      return [...prev, createEmptyVariantRow(size, bulkStockValue || "10")];
    });
  }

  function addRow() {
    const usedSizes = new Set(rows.map((r) => r.size));
    const nextSize = AVAILABLE_SIZES.find((s) => !usedSizes.has(s)) ?? "M";
    setRows((prev) => [...prev, createEmptyVariantRow(nextSize, bulkStockValue || "10")]);
  }

  function addAllStandardSizes() {
    setRows((prev) => {
      const existingBySize = new Map(prev.map((r) => [r.size.toUpperCase(), r]));
      return AVAILABLE_SIZES.map(
        (size) =>
          existingBySize.get(size.toUpperCase()) ??
          createEmptyVariantRow(size, bulkStockValue || "10")
      );
    });
  }

  function applyBulkStockToAllSizes() {
    const num = Math.max(0, Math.floor(Number(bulkStockValue) || 0));
    setRows((prev) => prev.map((r) => ({ ...r, stock: String(num) })));
  }

  function removeRow(index: number) {
    setRows((prev) => {
      if (prev.length <= 1) return [createEmptyVariantRow()];
      return prev.filter((_, i) => i !== index);
    });
  }

  const fallbackPrefix = productSku.trim() || "JAF";

  const activeRows =
    inventoryMode === "no-sizes"
      ? [
          {
            ...(rows[0] ?? createEmptyVariantRow(NO_SIZE_VALUE)),
            size: NO_SIZE_VALUE,
          },
        ]
      : rows.filter((row) => row.size.trim());

  const totalStockUnits = activeRows.reduce(
    (sum, r) => sum + (Number(r.stock) >= 0 ? Number(r.stock) : 0),
    0
  );

  const serialized = JSON.stringify(
    activeRows.map((row, idx) => {
      const size = inventoryMode === "no-sizes" ? NO_SIZE_VALUE : row.size.trim();
      const suffix = inventoryMode === "no-sizes" ? "STD" : size;
      const sku =
        row.sku.trim() || `${fallbackPrefix}-${suffix}${idx > 0 ? `-${idx + 1}` : ""}`;
      return {
        id: row.id,
        size,
        sku,
        priceCents: row.priceUnits.trim() ? unitsToCents(Number(row.priceUnits)) : null,
        stock: Number(row.stock) >= 0 ? Number(row.stock) : 0,
        color: row.color.trim(),
        edition: row.edition.trim(),
        playerName: row.playerName.trim(),
        playerNumber: row.playerNumber.trim(),
      };
    })
  );

  const regularRow = rows[0] ?? createEmptyVariantRow(NO_SIZE_VALUE);
  const activeSizeSet = new Set(rows.map((r) => r.size.toUpperCase()));

  return (
    <div className="flex flex-col gap-4 border border-ink-border bg-ink-raised/30 p-5">
      <input type="hidden" name="variantsJson" value={serialized} readOnly />

      {/* Header & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-border pb-4">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-gold">
            Inventory & Size Configuration
          </h4>
          <p className="mt-0.5 text-xs text-paper-dim">
            {inventoryMode === "sizes"
              ? "Click sizes below to toggle them and set each size's available stock quantity."
              : "Single regular stock quantity for products that do not use sizes."}
          </p>
        </div>

        <div className="flex border border-ink-border bg-ink">
          <button
            type="button"
            onClick={() => switchInventoryMode("sizes")}
            className={`px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              inventoryMode === "sizes"
                ? "bg-gold-bright text-ink"
                : "text-paper-dim hover:text-paper"
            }`}
          >
            Size Variants (S–5XL)
          </button>
          <button
            type="button"
            onClick={() => switchInventoryMode("no-sizes")}
            className={`px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              inventoryMode === "no-sizes"
                ? "bg-gold-bright text-ink"
                : "text-paper-dim hover:text-paper"
            }`}
          >
            No Sizes (Regular Stock)
          </button>
        </div>
      </div>

      {inventoryMode === "no-sizes" ? (
        /* Regular Stock (No Sizes) Card */
        <div className="flex flex-col gap-4 border border-ink-border bg-ink p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-paper">Regular Available Stock Quantity</p>
              <p className="text-xs text-paper-dim">
                Automatically decreases when a customer places an order and shows Out of Stock at 0.
              </p>
            </div>
            <Badge variant={totalStockUnits > 0 ? "emerald" : "danger"}>
              {totalStockUnits > 0 ? `In Stock (${totalStockUnits} units)` : "Out of Stock"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-paper-dim">
                Available Quantity *
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => adjustRowStock(0, -1)}
                  className="flex h-10 w-10 items-center justify-center border border-r-0 border-ink-border bg-ink-raised text-paper hover:border-gold hover:text-gold"
                >
                  <Minus size={14} />
                </button>
                <Input
                  type="number"
                  min={0}
                  value={regularRow.stock}
                  onChange={(e) => updateRow(0, { stock: e.target.value, size: NO_SIZE_VALUE })}
                  className="text-center font-mono font-bold"
                />
                <button
                  type="button"
                  onClick={() => adjustRowStock(0, 1)}
                  className="flex h-10 w-10 items-center justify-center border border-l-0 border-ink-border bg-ink-raised text-paper hover:border-gold hover:text-gold"
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-paper-dim">Quick set:</span>
                {[0, 10, 25, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => updateRow(0, { stock: String(preset), size: NO_SIZE_VALUE })}
                    className="border border-ink-border bg-ink-raised px-2 py-0.5 font-mono text-[11px] text-paper-dim hover:border-gold hover:text-gold"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-paper-dim">
                Inventory SKU (Auto if blank)
              </label>
              <Input
                value={regularRow.sku}
                onChange={(e) => updateRow(0, { sku: e.target.value, size: NO_SIZE_VALUE })}
                placeholder={`${fallbackPrefix}-STD`}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-paper-dim">
                Color / Edition (Optional)
              </label>
              <Input
                value={regularRow.color}
                onChange={(e) => updateRow(0, { color: e.target.value, size: NO_SIZE_VALUE })}
                placeholder="Optional"
              />
            </div>
          </div>
        </div>
      ) : (
        /* Size-Based Inventory Builder */
        <>
          {/* Quick Size Chip Toggles & Bulk Stock Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border border-ink-border bg-ink p-3.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1.5 text-[11px] font-semibold uppercase tracking-wider text-paper-dim">
                Quick Toggle Sizes:
              </span>
              {AVAILABLE_SIZES.map((size) => {
                const isSelected = activeSizeSet.has(size.toUpperCase());
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleQuickSizeChip(size)}
                    className={`h-8 min-w-10 border px-2.5 text-xs font-bold uppercase transition-colors ${
                      isSelected
                        ? "border-gold bg-gold-bright text-ink"
                        : "border-ink-border bg-ink-raised text-paper-dim hover:border-gold/50 hover:text-paper"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={addAllStandardSizes}
                className="ml-1 border border-gold/40 bg-gold/10 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gold hover:bg-gold hover:text-ink transition-colors"
              >
                All S–5XL
              </button>
            </div>

            {/* Bulk Apply Stock to All Active Sizes */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-paper-dim">
                Set all sizes to:
              </span>
              <input
                type="number"
                min={0}
                value={bulkStockValue}
                onChange={(e) => setBulkStockValue(e.target.value)}
                className="h-8 w-16 border border-ink-border bg-ink-raised px-2 text-center font-mono text-xs text-paper focus:border-gold focus:outline-none"
              />
              <button
                type="button"
                onClick={applyBulkStockToAllSizes}
                className="border border-ink-border bg-ink-raised px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-paper hover:border-gold hover:text-gold"
              >
                Apply to All
              </button>
            </div>
          </div>

          {/* Compact Size & Stock Table Rows */}
          <div className="divide-y divide-ink-border border border-ink-border bg-ink">
            <div className="hidden grid-cols-12 items-center gap-3 bg-ink-raised px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-paper-dim sm:grid">
              <div className="col-span-3">Size</div>
              <div className="col-span-4">Available Quantity</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-3 text-right">Options</div>
            </div>

            {rows.map((row, index) => {
              const sizeOptions = Array.from(
                new Set([
                  ...AVAILABLE_SIZES,
                  "Free Size",
                  ...(row.size && !isNoSizeVariant(row.size) ? [row.size] : []),
                ])
              );
              const autoSkuPlaceholder = `${fallbackPrefix}-${row.size || "M"}`;
              const qty = Number(row.stock) >= 0 ? Number(row.stock) : 0;
              const isExpanded = expandedAdvancedRows.has(index);

              return (
                <div key={row.id ?? index} className="p-3.5 transition-colors hover:bg-ink-raised/30">
                  <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-12">
                    {/* Size Selector */}
                    <div className="sm:col-span-3">
                      <Select
                        value={isNoSizeVariant(row.size) ? "M" : row.size}
                        onValueChange={(value) => updateRow(index, { size: value })}
                      >
                        <SelectTrigger aria-label="Select size" className="bg-ink-raised font-semibold">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {sizeOptions.map((s) => (
                            <SelectItem key={s} value={s}>
                              Size {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Stock Quantity Stepper */}
                    <div className="sm:col-span-4">
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => adjustRowStock(index, -1)}
                          aria-label="Decrease stock"
                          className="flex h-10 w-9 shrink-0 items-center justify-center border border-r-0 border-ink-border bg-ink-raised text-paper-dim hover:text-gold"
                        >
                          <Minus size={13} />
                        </button>
                        <Input
                          type="number"
                          min={0}
                          value={row.stock}
                          onChange={(e) => updateRow(index, { stock: e.target.value })}
                          className="text-center font-mono font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => adjustRowStock(index, 1)}
                          aria-label="Increase stock"
                          className="flex h-10 w-9 shrink-0 items-center justify-center border border-l-0 border-ink-border bg-ink-raised text-paper-dim hover:text-gold"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Live Stock Status Badge */}
                    <div className="flex items-center sm:col-span-2 sm:justify-center">
                      <Badge variant={qty > 0 ? "emerald" : "danger"}>
                        {qty > 0 ? "In Stock" : "Out of Stock"}
                      </Badge>
                    </div>

                    {/* Actions: More Options & Remove */}
                    <div className="flex items-center justify-end gap-2 sm:col-span-3">
                      <button
                        type="button"
                        onClick={() => toggleAdvancedRow(index)}
                        className="inline-flex items-center gap-1 border border-ink-border bg-ink-raised px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-paper-dim hover:border-gold hover:text-gold"
                      >
                        <SlidersHorizontal size={12} />
                        {isExpanded ? "Hide" : "SKU / Price"}
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        aria-label="Remove size"
                        className="border border-ink-border bg-ink-raised p-2 text-paper-dim hover:border-danger hover:text-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Collapsible Optional Fields (SKU, Price Override, Color, Edition) */}
                  {isExpanded && (
                    <div className="mt-3 grid grid-cols-1 gap-3 border-t border-ink-border/70 bg-ink-raised/40 p-3 sm:grid-cols-4">
                      <div>
                        <label className="mb-1 block text-[10px] uppercase tracking-wider text-paper-dim">
                          Variant SKU (Auto if blank)
                        </label>
                        <Input
                          value={row.sku}
                          onChange={(e) => updateRow(index, { sku: e.target.value })}
                          placeholder={autoSkuPlaceholder}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] uppercase tracking-wider text-paper-dim">
                          Price Override (৳)
                        </label>
                        <Input
                          type="number"
                          value={row.priceUnits}
                          onChange={(e) => updateRow(index, { priceUnits: e.target.value })}
                          placeholder="Uses base price"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] uppercase tracking-wider text-paper-dim">
                          Color (Optional)
                        </label>
                        <Input
                          value={row.color}
                          onChange={(e) => updateRow(index, { color: e.target.value })}
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] uppercase tracking-wider text-paper-dim">
                          Edition (Optional)
                        </label>
                        <Input
                          value={row.edition}
                          onChange={(e) => updateRow(index, { edition: e.target.value })}
                          placeholder="Player / Fan"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Custom Size Row Button */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1.5 border border-gold/40 bg-gold/10 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-gold hover:border-gold"
            >
              <Plus size={14} /> Add Another Size Row
            </button>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-paper-dim">
                Total Stock Across <strong className="text-paper">{activeRows.length}</strong>{" "}
                {activeRows.length === 1 ? "Size" : "Sizes"}:
              </span>
              <span className="font-mono text-sm font-bold text-gold">
                {totalStockUnits} {totalStockUnits === 1 ? "unit" : "units"}
              </span>
              <Badge variant={totalStockUnits > 0 ? "emerald" : "danger"}>
                {totalStockUnits > 0 ? "In Stock" : "Out of Stock"}
              </Badge>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function variantRowFromExisting(variant: {
  id: string;
  size: string;
  sku: string;
  priceCents: number | null;
  stock: number;
  color: string | null;
  edition: string | null;
  playerName: string | null;
  playerNumber: string | null;
}): VariantRow {
  return {
    id: variant.id,
    size: variant.size,
    sku: variant.sku,
    priceUnits: variant.priceCents !== null ? String(centsToUnits(variant.priceCents)) : "",
    stock: String(variant.stock),
    color: variant.color ?? "",
    edition: variant.edition ?? "",
    playerName: variant.playerName ?? "",
    playerNumber: variant.playerNumber ?? "",
  };
}
