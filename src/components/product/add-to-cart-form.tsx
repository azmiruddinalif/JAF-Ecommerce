"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/money";
import { AVAILABLE_SIZES, isNoSizeVariant } from "@/lib/constants";
import { addToCartAction } from "@/lib/actions/cart-actions";
import { WishlistButton } from "./wishlist-button";

export interface VariantOption {
  id: string;
  size: string;
  stock: number;
  priceCents: number | null;
}

const ALL_DISPLAY_SIZES = [...AVAILABLE_SIZES];

export function AddToCartForm({
  productId,
  variants,
  basePriceCents,
  discountPriceCents,
}: {
  productId: string;
  variants: VariantOption[];
  basePriceCents: number;
  discountPriceCents: number | null;
}) {
  const router = useRouter();

  const isNoSizeProduct =
    variants.length === 1 && isNoSizeVariant(variants[0]?.size);

  const sizes = useMemo(() => {
    if (isNoSizeProduct) {
      return variants;
    }

    const byUpperSize = new Map<string, VariantOption>();
    for (const variant of variants) {
      const key = variant.size.trim().toUpperCase();
      if (!byUpperSize.has(key)) {
        byUpperSize.set(key, variant);
      }
    }

    // Always display all sizes (S, M, L, XL, XXL, 3XL, 4XL, 5XL)
    const orderedKeys = new Set<string>(
      ALL_DISPLAY_SIZES.map((s) => s.toUpperCase()),
    );
    for (const key of byUpperSize.keys()) {
      orderedKeys.add(key);
    }

    return [...orderedKeys].map((sizeKey) => {
      const existing = byUpperSize.get(sizeKey);
      if (existing) return existing;
      return {
        id: `unavailable-${sizeKey}`,
        size: sizeKey,
        stock: 0,
        priceCents: null,
      };
    });
  }, [variants, isNoSizeProduct]);

  const [selectedSize, setSelectedSize] = useState<string | null>(
    sizes.find((s) => s.stock > 0)?.size ?? sizes[0]?.size ?? null,
  );
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const selectedVariant = sizes.find((s) => s.size === selectedSize) ?? null;
  const effectivePrice =
    selectedVariant?.priceCents ?? discountPriceCents ?? basePriceCents;
  const selectedStock = selectedVariant?.stock ?? 0;
  const inStock = selectedStock > 0;
  const isLowStock = selectedStock > 0 && selectedStock <= 5;

  function handleSelectSize(variant: VariantOption) {
    if (variant.stock <= 0) return;
    setSelectedSize(variant.size);
    setQuantity((prev) => Math.max(1, Math.min(prev, variant.stock)));
    setMessage(null);
  }

  function handleAddToCart(options?: { redirectToCheckout: boolean }) {
    if (!selectedVariant || selectedVariant.stock <= 0) {
      setMessage("Please select an available size.");
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await addToCartAction(selectedVariant.id, quantity);
      setMessage(result.message);
      if (result.success && options?.redirectToCheckout) {
        router.push("/checkout");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-2 flex items-baseline gap-3">
          <span className="text-2xl font-semibold text-gold">
            {formatCents(effectivePrice)}
          </span>
          {discountPriceCents !== null && !selectedVariant?.priceCents && (
            <span className="text-paper-dim line-through">
              {formatCents(basePriceCents)}
            </span>
          )}
        </div>
      </div>

      {isNoSizeProduct ? (
        <div className="flex items-center gap-3">
          <Badge variant={inStock ? "emerald" : "danger"}>
            {inStock ? "In Stock" : "Out of Stock"}
          </Badge>
          {inStock && (
            <span className="font-mono text-xs text-paper-dim">
              {selectedStock} {selectedStock === 1 ? "unit" : "units"} available
            </span>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <span className="text-paper-dim">Select Size</span>
              {selectedVariant && (
                <span
                  aria-live="polite"
                  className={
                    !inStock
                      ? "font-mono font-bold text-danger"
                      : isLowStock
                        ? "font-mono font-bold text-yellow-400"
                        : "font-mono font-bold text-gold-bright"
                  }
                >
                  : {inStock ? `${selectedStock} in stock` : "Out of stock"}
                </span>
              )}
            </div>
            <span className="text-xs text-paper-dim">
              Size guide: S · M · L · XL · XXL · 3XL · 4XL · 5XL
            </span>
          </div>

          {/* Size Boxes */}
          <div className="flex flex-wrap items-center gap-2">
            {sizes.map((variant) => {
              const isAvailable = variant.stock > 0;
              const isSelected = selectedSize === variant.size && isAvailable;

              return (
                <button
                  key={variant.size}
                  type="button"
                  disabled={!isAvailable}
                  aria-disabled={!isAvailable}
                  aria-pressed={isSelected}
                  title={
                    isAvailable
                      ? `Size ${variant.size} (${variant.stock} in stock)`
                      : `Size ${variant.size} — Out of Stock`
                  }
                  onClick={() => handleSelectSize(variant)}
                  className={`relative flex h-12 min-w-12 items-center justify-center overflow-hidden border px-3.5 text-sm font-bold uppercase transition-all ${
                    isSelected
                      ? "border-gold-bright bg-gold-bright text-ink shadow-[0_0_15px_rgba(74,222,128,0.25)]"
                      : isAvailable
                        ? "border-ink-border bg-ink-raised text-paper hover:border-gold-bright hover:text-gold-bright"
                        : "cursor-not-allowed border-gold-bright/30 bg-ink-raised/35 text-paper-dim/60 opacity-50"
                  }`}
                >
                  <span className="relative z-10">{variant.size}</span>

                  {/* Unavailable Size Overlay: Corner-to-Corner Angle Line with Green Opacity */}
                  {!isAvailable && (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 48 48"
                      preserveAspectRatio="none"
                      className="pointer-events-none absolute inset-0 h-full w-full"
                    >
                      <polygon
                        points="34,0 48,0 48,14"
                        fill="rgba(74, 222, 128, 0.18)"
                      />
                      <line
                        x1="0"
                        y1="48"
                        x2="48"
                        y2="0"
                        stroke="rgba(74, 222, 128, 0.55)"
                        strokeWidth="1.5"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-paper-dim">
          Quantity
        </span>
        <div className="flex items-center border border-ink-border">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            className="p-3 hover:text-gold"
          >
            <Minus size={14} />
          </button>
          <span className="min-w-10 text-center font-mono text-sm">{quantity}</span>
          <button
            type="button"
            onClick={() =>
              setQuantity((q) => Math.min(Math.max(1, selectedStock), q + 1))
            }
            aria-label="Increase quantity"
            className="p-3 hover:text-gold"
          >
            <Plus size={14} />
          </button>
        </div>
        {inStock && (
          <span className="text-xs text-paper-dim">
            Max {selectedStock} {selectedStock === 1 ? "unit" : "units"}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1"
          disabled={isPending || !inStock}
          onClick={() => handleAddToCart()}
        >
          ADD TO CART
        </Button>
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="flex-1"
          disabled={isPending || !inStock}
          onClick={() => handleAddToCart({ redirectToCheckout: true })}
        >
          BUY NOW
        </Button>
        <WishlistButton productId={productId} />
      </div>

      {message && <p className="text-sm text-paper-dim">{message}</p>}
    </div>
  );
}
