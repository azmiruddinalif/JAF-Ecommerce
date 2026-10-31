import { Suspense } from "react";
import Link from "next/link";
import { ShoppingCart, Clock, Package, AlertTriangle } from "lucide-react";
import { getDashboardStats, getSalesOverview } from "@/lib/data/orders";
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

async function DashboardContent() {
  const [stats, sales] = await Promise.all([getDashboardStats(), getSalesOverview(14)]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl">DASHBOARD</h1>
        <p className="mt-1 text-sm text-paper-dim">{todayLabel.format(new Date())}</p>
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

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse bg-ink-raised" />}>
      <DashboardContent />
    </Suspense>
  );
}
