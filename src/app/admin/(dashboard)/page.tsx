import Link from "next/link";
import { ShoppingCart, Clock, Package, AlertTriangle, Boxes } from "lucide-react";
import { getDashboardStats, getSalesOverview } from "@/lib/data/orders";
import { getProductStockOverview } from "@/lib/data/products";
import { AVAILABLE_SIZES } from "@/lib/constants";
import { StatCard } from "@/components/admin/stat-card";
import { SalesChart } from "@/components/admin/sales-chart";
import { StatusBreakdown } from "@/components/admin/status-breakdown";
import { formatCents } from "@/lib/money";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Admin Dashboard", robots: { index: false } };

// Reads the current date (today's label, the sales chart's rolling window) —
// inherently dynamic, same as the rest of the session-gated admin area.
export const instant = false;

const todayLabel = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

function TakaIcon({ size = 15 }: { size?: number }) {
  return (
    <span className="font-semibold leading-none" style={{ fontSize: size }}>
      ৳
    </span>
  );
}

export default async function AdminDashboardPage() {
  const [stats, sales, stockOverview] = await Promise.all([
    getDashboardStats(),
    getSalesOverview(14),
    getProductStockOverview(),
  ]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">DASHBOARD</h1>
          <p className="mt-1 text-sm text-paper-dim">{todayLabel.format(new Date())}</p>
        </div>
        <Link
          href="/admin/stocks"
          className="inline-flex items-center gap-2 border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gold hover:bg-gold hover:text-ink transition-colors"
        >
          <Boxes size={15} />
          Manage Product Stocks ({stockOverview.totals.totalUnitsInStock} units)
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Orders" value={String(stats.totalOrders)} icon={ShoppingCart} />
        <StatCard label="Pending Orders" value={String(stats.pendingOrders)} icon={Clock} />
        <StatCard label="Revenue" value={formatCents(stats.revenueCents)} icon={TakaIcon} />
        <StatCard label="Products" value={String(stats.totalProducts)} icon={Package} />
        <StatCard
          label="Low Stock"
          value={String(stats.lowStockCount)}
          icon={AlertTriangle}
          tone={stats.lowStockCount > 0 ? "warning" : "default"}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesChart series={sales.series} totalCents={sales.totalCents} />
        </div>
        <StatusBreakdown data={stats.statusBreakdown} />
      </div>

      {/* Category & Product Stocks Overview */}
      <div className="mt-6 border border-ink-border">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              Category & Product Stocks (S – 5XL)
            </h2>
            <p className="mt-0.5 text-xs text-paper-dim">
              Live inventory per category and size — automatically updated on orders & restocks
            </p>
          </div>
          <Link href="/admin/stocks" className="text-xs font-semibold text-gold hover:underline">
            Manage All Stocks →
          </Link>
        </div>

        {/* Category Stock Summary Cards */}
        {stockOverview.categories.length > 0 && (
          <div className="grid grid-cols-2 gap-3 border-b border-ink-border bg-ink-raised/40 p-4 sm:grid-cols-3 lg:grid-cols-6">
            {stockOverview.categories.map((cat) => (
              <Link
                key={cat.id}
                href="/admin/stocks"
                className="border border-ink-border bg-ink p-3 transition-colors hover:border-gold"
              >
                <p className="truncate text-xs font-semibold text-paper">{cat.name}</p>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="font-display text-xl text-gold">{cat.totalStock}</span>
                  <span className="text-[11px] text-paper-dim">{cat.productCount} items</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-paper-dim">
                  <span className="text-emerald-400">{cat.inStockCount} in stock</span>
                  <span>{cat.outOfStockCount} out</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Product Size Stock Matrix */}
        {stockOverview.products.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-paper-dim">No products in inventory yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ink-border bg-ink-raised text-[11px] uppercase tracking-wider text-paper-dim">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3 text-center">Total Stock</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  {AVAILABLE_SIZES.map((size) => (
                    <th key={size} className="px-2.5 py-3 text-center">
                      {size}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stockOverview.products.slice(0, 12).map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-ink-border last:border-0 hover:bg-ink-raised"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="font-medium text-paper hover:text-gold"
                      >
                        {product.name}
                      </Link>
                      <p className="font-mono text-[10px] text-paper-dim">{product.sku}</p>
                    </td>
                    <td className="px-3 py-3 text-paper-dim">{product.categoryName}</td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={
                          product.totalStock === 0
                            ? "font-bold text-danger"
                            : "font-bold text-gold"
                        }
                      >
                        {product.totalStock}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Badge variant={product.totalStock > 0 ? "emerald" : "danger"}>
                        {product.totalStock > 0 ? "In Stock" : "Out of Stock"}
                      </Badge>
                    </td>
                    {!product.hasSizes ? (
                      <td
                        colSpan={AVAILABLE_SIZES.length}
                        className="px-3 py-3 text-center text-paper-dim"
                      >
                        Regular Stock (No Sizes):{" "}
                        <span className="font-mono font-semibold text-paper">
                          {product.totalStock} units
                        </span>
                      </td>
                    ) : (
                      AVAILABLE_SIZES.map((size) => {
                        const qty = product.sizeStocks[size] ?? 0;
                        return (
                          <td key={size} className="px-2.5 py-3 text-center font-mono">
                            <span
                              className={
                                qty === 0
                                  ? "text-paper-dim/40"
                                  : "font-semibold text-paper"
                              }
                            >
                              {qty}
                            </span>
                          </td>
                        );
                      })
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 border border-ink-border">
        <div className="flex items-center justify-between border-b border-ink-border px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs text-gold hover:underline">
            View all
          </Link>
        </div>
        {stats.recentOrders.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-paper-dim">No orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {stats.recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-ink-border last:border-0 hover:bg-ink-raised">
                  <td className="px-5 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="text-gold hover:underline">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-paper-dim">{order.customerName}</td>
                  <td className="px-5 py-3">
                    <Badge variant="neutral">{order.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right text-gold">{formatCents(order.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
