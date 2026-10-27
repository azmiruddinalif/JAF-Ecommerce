"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { formatCents } from "@/lib/money";
import type { CartLineView } from "@/lib/cart/read";
import { removeCartItemAction, updateCartItemQuantityAction } from "@/lib/actions/cart-actions";

export function CartLineRow({ line, compact = false }: { line: CartLineView; compact?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function changeQuantity(next: number) {
    setError(null);
    startTransition(async () => {
      const result = await updateCartItemQuantityAction(line.id, next);
      if (!result.success) setError(result.message);
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await removeCartItemAction(line.id);
      if (!result.success) setError(result.message);
    });
  }

  return (
    <div className={`flex gap-4 border-b border-ink-border py-4 ${isPending ? "opacity-60" : ""}`}>
      <Link
        href={`/product/${line.productSlug}`}
        className={`relative shrink-0 overflow-hidden bg-ink-raised ${compact ? "h-20 w-16" : "h-28 w-20"}`}
      >
        {line.imageUrl ? (
          <Image src={line.imageUrl} alt={line.productName} fill sizes="100px" className="object-cover" />
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link href={`/product/${line.productSlug}`} className="text-sm font-semibold hover:text-gold">
              {line.productName}
            </Link>
            <p className="mt-1 text-xs text-paper-dim">Size {line.size}</p>
            {line.exceedsStock && (
              <p className="mt-1 text-xs text-danger">Only {line.availableStock} left — reduce quantity.</p>
            )}
          </div>
          <button
            type="button"
            onClick={remove}
            aria-label="Remove item"
            className="text-paper-dim hover:text-danger"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center border border-ink-border">
            <button
              type="button"
              onClick={() => changeQuantity(line.quantity - 1)}
              disabled={isPending}
              aria-label="Decrease quantity"
              className="p-2 hover:text-gold disabled:opacity-40"
            >
              <Minus size={14} />
            </button>
            <span className="min-w-[2rem] text-center text-sm">{line.quantity}</span>
            <button
              type="button"
              onClick={() => changeQuantity(line.quantity + 1)}
              disabled={isPending || line.quantity >= line.availableStock}
              aria-label="Increase quantity"
              className="p-2 hover:text-gold disabled:opacity-40"
            >
              <Plus size={14} />
            </button>
          </div>
          <span className="font-semibold text-gold">{formatCents(line.lineTotalCents)}</span>
        </div>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    </div>
  );
}
