import { PackageSearch } from "lucide-react";
import { ProductCard } from "./product-card";
import type { ProductListItem } from "@/lib/data/products";

export function ProductGrid({
  products,
  emptyTitle = "No products found",
  emptyDescription = "Try adjusting your filters or check back soon.",
}: {
  products: ProductListItem[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <PackageSearch className="text-paper-dim" size={36} strokeWidth={1.5} />
        <p className="font-display text-lg">{emptyTitle}</p>
        <p className="text-sm text-paper-dim">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
