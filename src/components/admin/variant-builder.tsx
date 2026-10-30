"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AVAILABLE_SIZES } from "@/lib/constants";
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

export function createEmptyVariantRow(): VariantRow {
  return {
    size: "M",
    sku: "",
    priceUnits: "",
    stock: "0",
    color: "",
    edition: "",
    playerName: "",
    playerNumber: "",
  };
}

export function VariantBuilder({ initialRows }: { initialRows: VariantRow[] }) {
  const [rows, setRows] = useState<VariantRow[]>(
    initialRows.length > 0 ? initialRows : [createEmptyVariantRow()]
  );

  function updateRow(index: number, patch: Partial<VariantRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, createEmptyVariantRow()]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  const serialized = JSON.stringify(
    rows
      .filter((row) => row.size.trim() && row.sku.trim())
      .map((row) => ({
        id: row.id,
        size: row.size.trim(),
        sku: row.sku.trim(),
        priceCents: row.priceUnits.trim() ? unitsToCents(Number(row.priceUnits)) : null,
        stock: Number(row.stock) || 0,
        color: row.color.trim(),
        edition: row.edition.trim(),
        playerName: row.playerName.trim(),
        playerNumber: row.playerNumber.trim(),
      }))
  );

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name="variantsJson" value={serialized} readOnly />

      <div className="flex flex-col gap-4">
        {rows.map((row, index) => {
          const sizeOptions = Array.from(
            new Set([...AVAILABLE_SIZES, ...(row.size ? [row.size] : [])])
          );
          return (
            <div key={index} className="grid grid-cols-2 gap-3 border border-ink-border p-4 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper-dim">
                  Size *
                </label>
                <Select
                  value={row.size || "M"}
                  onValueChange={(value) => updateRow(index, { size: value })}
                >
                  <SelectTrigger aria-label="Select size">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper-dim">
                  SKU *
                </label>
                <Input
                  value={row.sku}
                  onChange={(e) => updateRow(index, { sku: e.target.value })}
                  placeholder="ARG-H-M"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper-dim">
                  Price Override (৳)
                </label>
                <Input
                  type="number"
                  value={row.priceUnits}
                  onChange={(e) => updateRow(index, { priceUnits: e.target.value })}
                  placeholder="Leave blank to use base price"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper-dim">
                  Stock *
                </label>
                <Input
                  type="number"
                  value={row.stock}
                  onChange={(e) => updateRow(index, { stock: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper-dim">
                  Color
                </label>
                <Input
                  value={row.color}
                  onChange={(e) => updateRow(index, { color: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper-dim">
                  Edition
                </label>
                <Input
                  value={row.edition}
                  onChange={(e) => updateRow(index, { edition: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper-dim">
                  Player Name
                </label>
                <Input
                  value={row.playerName}
                  onChange={(e) => updateRow(index, { playerName: e.target.value })}
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper-dim">
                    Player #
                  </label>
                  <Input
                    value={row.playerNumber}
                    onChange={(e) => updateRow(index, { playerNumber: e.target.value })}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  aria-label="Remove size"
                  className="shrink-0 p-2.5 text-paper-dim hover:text-danger"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-2 self-start border border-gold/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gold hover:border-gold"
      >
        <Plus size={14} /> Add Size
      </button>
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
