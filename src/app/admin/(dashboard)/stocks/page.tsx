import { Suspense } from "react";
import { getProductStockOverview } from "@/lib/data/products";
import { ProductStocksManager } from "@/components/admin/product-stocks-manager";

export const instant = false;

export const metadata = {
  title: "Product Stocks — JAF Admin",
  robots: { index: false },
};

async function ProductStocksContent() {
  const overview = await getProductStockOverview();

  return (
    <ProductStocksManager
      initialProducts={overview.products}
      initialPagination={overview.pagination}
      sizeTotals={overview.sizeTotals}
      attentionProducts={overview.attentionProducts}
      categories={overview.categories}
      totals={overview.totals}
    />
  );
}

export default function AdminProductStocksPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse bg-ink-raised" />}>
      <ProductStocksContent />
    </Suspense>
  );
}
