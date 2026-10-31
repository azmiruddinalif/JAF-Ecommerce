import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { formatCents } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import type { ProductListItem } from "@/lib/data/products";
import {
  AVAILABLE_SIZES,
  getClubTypeLabel,
  getSubTypeFromTags,
  isClubCategory,
  isNoSizeVariant,
} from "@/lib/constants";

export function ProductCard({ product }: { product: ProductListItem }) {
  const primaryImage = product.images[0];
  const secondaryImage = product.images[1];
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const hasDiscount =
    product.discountPriceCents !== null &&
    product.discountPriceCents < product.basePriceCents;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.basePriceCents - (product.discountPriceCents as number)) /
          product.basePriceCents) *
          100,
      )
    : 0;

  // Check if product has sized variants (not 'ONE SIZE' / 'NO SIZE')
  const hasSizedVariants = product.variants.some((v) => !isNoSizeVariant(v.size));

  const stockByUpperSize = new Map<string, number>();
  for (const v of product.variants) {
    if (!isNoSizeVariant(v.size)) {
      const key = v.size.trim().toUpperCase();
      stockByUpperSize.set(key, (stockByUpperSize.get(key) ?? 0) + v.stock);
    }
  }

  // Display all standard sizes (S, M, L, XL, XXL, 3XL, 4XL, 5XL) plus extra custom sizes as per PDP
  const sizes = hasSizedVariants
    ? [
        ...AVAILABLE_SIZES,
        ...[...stockByUpperSize.keys()].filter(
          (k) => !(AVAILABLE_SIZES as readonly string[]).map((s) => s.toUpperCase()).includes(k),
        ),
      ]
    : [];

  return (
    <Link href={`/product/${product.slug}`} className="group flex flex-col">
      <div className="relative aspect-3/4 w-full overflow-hidden bg-ink-raised">
        {primaryImage ? (
          <Image
            src={primaryImage.secureUrl}
            alt={primaryImage.altText ?? product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className={`object-cover transition-opacity duration-500 ${
              secondaryImage ? "group-hover:opacity-0" : "group-hover:scale-105"
            }`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-paper-dim">
            No image
          </div>
        )}
        {secondaryImage && (
          <Image
            src={secondaryImage.secureUrl}
            alt={secondaryImage.altText ?? product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="absolute inset-0 object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}

        <div className="absolute left-2 top-2 flex flex-col gap-1.5">
          {hasDiscount && <Badge variant="gold">-{discountPercent}%</Badge>}
          {!hasDiscount && product.featured && <Badge variant="neutral">Bestseller</Badge>}
          {product.newArrival && <Badge variant="emerald">New</Badge>}
          {totalStock === 0 && <Badge variant="danger">Sold out</Badge>}
        </div>

        {totalStock > 0 && (
          <span className="absolute bottom-2 right-2 flex size-8 translate-y-1 items-center justify-center rounded-full bg-ink/90 text-paper opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:bg-gold-bright group-hover:text-ink group-hover:opacity-100">
            <ArrowUpRight size={15} />
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        <span className="text-[11px] uppercase tracking-widest text-paper-dim">
          {isClubCategory(product.category)
            ? `${product.category.name} · ${getClubTypeLabel(product.type, product.tags)}`
            : getSubTypeFromTags(product.tags)
              ? `${product.category.name} · ${getSubTypeFromTags(product.tags)}`
              : product.category.name}
        </span>
        <h3 className="text-sm font-medium text-paper group-hover:text-gold">
          {product.name}
        </h3>

        {sizes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {sizes.map((size) => {
              const stock = stockByUpperSize.get(size.toUpperCase()) ?? 0;
              const isAvailable = stock > 0;
              return (
                <span
                  key={size}
                  title={
                    isAvailable
                      ? `Size ${size} (${stock} in stock)`
                      : `Size ${size} — Unavailable`
                  }
                  className={`flex h-5 min-w-5 items-center justify-center border px-1 text-[10px] font-medium transition-colors ${
                    isAvailable
                      ? "border-ink-border bg-ink-raised/60 text-paper-dim"
                      : "border-ink-border/30 bg-ink/30 text-paper-dim/35 line-through opacity-45 cursor-not-allowed"
                  }`}
                >
                  {size}
                </span>
              );
            })}
          </div>
        )}

        <div className="mt-0.5 flex items-center gap-2 text-sm">
          {hasDiscount ? (
            <>
              <span className="font-semibold text-gold">
                {formatCents(product.discountPriceCents as number)}
              </span>
              <span className="text-paper-dim line-through">
                {formatCents(product.basePriceCents)}
              </span>
            </>
          ) : (
            <span className="font-semibold text-paper">
              {formatCents(product.basePriceCents)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
