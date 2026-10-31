import { Suspense } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Clock,
  Package,
  AlertTriangle,
  Boxes,
  ChevronRight,
} from "lucide-react";
import { getDashboardStats, getSalesOverview } from "@/lib/data/orders";
import { getProductStockOverview } from "@/lib/data/products";
import { AVAILABLE_SIZES } from "@/lib/constants";
import { StatCard } from "@/components/admin/stat-card";
import { SalesChart } from "@/components/admin/sales-chart";
import { StatusBreakdown } from "@/components/admin/status-breakdown";
import { formatCents } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { PwaInstallButton } from "@/components/admin/pwa-install-button";
import { DashboardStockTable } from "@/components/admin/dashboard-stock-table";

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

async function DashboardContent() {
  const [stats, sales, stockOverview] = await Promise.all([
    getDashboardStats(),
    getSalesOverview(14),
    getProductStockOverview(),
  ]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl">DASHBOARD</h1>
          <p className="mt-0.5 text-xs text-paper-dim sm:text-sm">
            {todayLabel.format(new Date())}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <PwaInstallButton label="Download Admin App" variant="outline" />
          <Link
            href="/admin/stocks"
            className="inline-flex items-center justify-center gap-2 border border-gold/40 bg-gold/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gold transition-colors hover:bg-gold hover:text-ink"
          >
            <Boxes size={15} />
            Manage Product Stocks ({stockOverview.totals.totalUnitsInStock} units)
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        <StatCard
          label="Total Orders"
          value={String(stats.totalOrders)}
          icon={ShoppingCart}
        />
        <StatCard
          label="Pending Orders"
          value={String(stats.pendingOrders)}
          icon={Clock}
        />
        <StatCard
          label="Revenue"
          value={formatCents(stats.revenueCents)}
          icon={TakaIcon}
        />
        <StatCard
          label="Products"
          value={String(stats.totalProducts)}
          icon={Package}
        />
        <div className="col-span-2 sm:col-span-1">
          <StatCard
            label="Low Stock"
            value={String(stats.lowStockCount)}
            icon={AlertTriangle}
            tone={stats.lowStockCount > 0 ? "warning" : "default"}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:mt-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesChart series={sales.series} totalCents={sales.totalCents} />
        </div>
        <StatusBreakdown data={stats.statusBreakdown} />
      </div>

      {/* Category & Product Stocks Overview */}
      <div className="mt-5 border border-ink-border sm:mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-border px-4 py-3.5 sm:px-5 sm:py-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider sm:text-sm">
              Category &amp; Product Stocks (S – 5XL)
            </h2>
            <p className="mt-0.5 text-[11px] text-paper-dim sm:text-xs">
              Live inventory per category and size — automatically updated on
              orders &amp; restocks
            </p>
          </div>
          <Link
            href="/admin/stocks"
            className="text-xs font-semibold text-gold hover:underline"
          >
            Manage All Stocks →
          </Link>
        </div>

        {/* Category Stock Summary Cards */}
        {stockOverview.categories.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5 border-b border-ink-border bg-ink-raised/40 p-3 sm:grid-cols-3 sm:gap-3 sm:p-4 lg:grid-cols-6">
            {stockOverview.categories.map((cat) => (
              <Link
                key={cat.id}
                href="/admin/stocks"
                className="border border-ink-border bg-ink p-3 transition-colors hover:border-gold"
              >
                <p className="truncate text-xs font-semibold text-paper">
                  {cat.name}
                </p>
                <div className="mt-1.5 flex items-baseline justify-between">
                  <span className="font-display text-lg text-gold sm:text-xl">
                    {cat.totalStock}
                  </span>
                  <span className="text-[11px] text-paper-dim">
                    {cat.productCount} items
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-paper-dim">
                  <span className="text-emerald-400">
                    {cat.inStockCount} in stock
                  </span>
                  <span>{cat.outOfStockCount} out</span>
                </div>
              </Link>
            ))}
          </div>
        )}

                <DashboardStockTable
          initialProducts={stockOverview.products}
          initialPagination={stockOverview.pagination}
        />
      </div>

      {/* Recent Orders */}
      <div className="mt-5 border border-ink-border sm:mt-6">
        <div className="flex items-center justify-between border-b border-ink-border px-4 py-3.5 sm:px-5 sm:py-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider sm:text-sm">
            Recent Orders
          </h2>
          <Link
            href="/admin/orders"
            className="text-xs text-gold hover:underline"
          >
            View all
          </Link>
        </div>
        {stats.recentOrders.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-paper-dim">
            No orders yet.
          </p>
        ) : (
          <>
            {/* Mobile Recent Orders Cards */}
            <div className="divide-y divide-ink-border min-[1200px]:hidden">
              {stats.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-ink-raised"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gold-bright">
                      {order.orderNumber}
                    </p>
                    <p className="truncate text-xs text-paper-dim">
                      {order.customerName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gold">
                        {formatCents(order.totalCents)}
                      </p>
                      <Badge variant="neutral">{order.status}</Badge>
                    </div>
                    <ChevronRight size={15} className="text-paper-dim" />
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop Recent Orders Table */}
            <table className="hidden w-full text-sm min-[1200px]:table">
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-ink-border last:border-0 hover:bg-ink-raised"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-gold hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-paper-dim">
                      {order.customerName}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="neutral">{order.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right text-gold">
                      {formatCents(order.totalCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse bg-ink-raised" />}>
      <DashboardContent />
    </Suspense>
  );
}
