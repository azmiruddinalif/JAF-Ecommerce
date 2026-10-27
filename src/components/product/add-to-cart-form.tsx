"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/money";
import { addToCartAction } from "@/lib/actions/cart-actions";
import { WishlistButton } from "./wishlist-button";

export interface VariantOption {
  id: string;
  size: string;
  stock: number;
  priceCents: number | null;
}

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
  const sizes = useMemo(() => {
    const map = new Map<string, VariantOption>();
    for (const variant of variants) {
      if (!map.has(variant.size)) map.set(variant.size, variant);
    }
    return [...map.values()];
  }, [variants]);

  const [selectedSize, setSelectedSize] = useState<string | null>(
    sizes.find((s) => s.stock > 0)?.size ?? sizes[0]?.size ?? null,
  );
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const selectedVariant = sizes.find((s) => s.size === selectedSize) ?? null;
  const effectivePrice =
    selectedVariant?.priceCents ?? discountPriceCents ?? basePriceCents;
  const inStock = (selectedVariant?.stock ?? 0) > 0;

  function handleAddToCart(options?: { redirectToCheckout: boolean }) {
    if (!selectedVariant) {
      setMessage("Please select a size.");
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

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-paper-dim">
            Size
          </span>
          <span className="text-xs text-paper-dim">
            Size guide: S · M · L · XL · XXL
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {sizes.map((variant) => (
            <button
              key={variant.size}
              type="button"
              disabled={variant.stock === 0}
              onClick={() => setSelectedSize(variant.size)}
              className={`h-11 min-w-11 border px-3 text-sm font-medium transition-colors ${
                selectedSize === variant.size
                  ? "border-gold bg-gold-bright text-ink"
                  : "border-ink-border text-paper hover:border-gold"
              } ${variant.stock === 0 ? "cursor-not-allowed opacity-30 line-through" : ""}`}
            >
              {variant.size}
            </button>
          ))}
        </div>
        {!inStock && selectedSize && (
          <p className="mt-2 text-xs text-danger">This size is out of stock.</p>
        )}
      </div>

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
          <span className="min-w-10 text-center text-sm">{quantity}</span>
          <button
            type="button"
            onClick={() =>
              setQuantity((q) => Math.min(selectedVariant?.stock ?? 1, q + 1))
            }
            aria-label="Increase quantity"
            className="p-3 hover:text-gold"
          >
            <Plus size={14} />
          </button>
        </div>
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
