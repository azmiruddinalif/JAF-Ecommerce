import { getProductStockOverview } from "@/lib/data/products";
import { ProductStocksManager } from "@/components/admin/product-stocks-manager";

export const instant = false;

export const metadata = {
  title: "Product Stocks — JAF Admin",
  robots: { index: false },
};

export default async function AdminProductStocksPage() {
  const overview = await getProductStockOverview();

  return (
    <ProductStocksManager
      products={overview.products}
      categories={overview.categories}
      totals={overview.totals}
    />
  );
}
