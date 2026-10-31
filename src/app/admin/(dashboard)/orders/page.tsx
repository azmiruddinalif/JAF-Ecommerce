import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, Phone, ShoppingBag } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { getAdminOrders } from "@/lib/data/orders";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/money";
import { Pagination } from "@/components/products/pagination";
import { Select } from "@/components/ui/input";

export const metadata = { title: "Orders", robots: { index: false } };
export const instant = false;

const STATUS_OPTIONS: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

type OrdersSearchParams = { query?: string; status?: string; page?: string };

async function OrdersContent({
  searchParams,
}: {
  searchParams: Promise<OrdersSearchParams>;
}) {
  const params = await searchParams;
  const status = STATUS_OPTIONS.includes(params.status as OrderStatus)
    ? (params.status as OrderStatus)
    : undefined;

  const result = await getAdminOrders({
    query: params.query,
    status,
    page: params.page ? Number(params.page) : 1,
  });

  return (
    <>
      <form method="GET" className="mb-5 grid grid-cols-1 gap-2.5 sm:flex sm:flex-wrap sm:gap-3">
        <input
          type="search"
          name="query"
          defaultValue={params.query}
          placeholder="Search order #, name, phone..."
          className="w-full border border-ink-border bg-ink-raised px-4 py-2.5 text-sm placeholder:text-paper-dim focus:border-gold focus:outline-none sm:w-64"
        />
        <div className="grid grid-cols-3 gap-2.5 sm:flex sm:gap-3">
          <div className="col-span-2 sm:w-44">
            <Select
              name="status"
              defaultValue={params.status ?? ""}
              className="w-full"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <button
            type="submit"
            className="border border-gold/40 bg-gold/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gold hover:border-gold hover:bg-gold hover:text-ink"
          >
            Filter
          </button>
        </div>
      </form>

      {/* Mobile App Order Cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 min-[1200px]:hidden">
        {result.items.length === 0 && (
          <div className="border border-ink-border bg-ink-raised p-8 text-center text-sm text-paper-dim">
            No orders found.
          </div>
        )}
        {result.items.map((order) => (
          <div
            key={order.id}
            className="border border-ink-border bg-ink-raised/50 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="font-display text-lg tracking-wide text-gold-bright hover:underline"
                >
                  {order.orderNumber}
                </Link>
                <p className="text-[11px] text-paper-dim">
                  {new Date(order.createdAt).toLocaleDateString()} ·{" "}
                  {new Date(order.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <Badge variant="neutral">{order.status}</Badge>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-ink-border pt-3 text-sm">
              <div>
                <p className="font-medium text-paper">{order.customerName}</p>
                <a
                  href={`tel:${order.customerPhone}`}
                  className="mt-0.5 inline-flex items-center gap-1 text-xs text-paper-dim hover:text-gold"
                >
                  <Phone size={11} />
                  {order.customerPhone}
                </a>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gold-bright">
                  {formatCents(order.totalCents)}
                </p>
                <p className="inline-flex items-center gap-1 text-xs text-paper-dim">
                  <ShoppingBag size={11} />
                  {order.items.length} {order.items.length === 1 ? "item" : "items"}
                </p>
              </div>
            </div>

            <Link
              href={`/admin/orders/${order.id}`}
              className="mt-3 flex w-full items-center justify-between border border-ink-border bg-ink px-3 py-2 text-xs font-semibold uppercase tracking-wider text-paper hover:border-gold hover:text-gold"
            >
              <span>View &amp; Manage Order</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        ))}
      </div>

      {/* Desktop Orders Table */}
      <div className="hidden overflow-x-auto border border-ink-border min-[1200px]:block">
        <table className="w-full min-w-175 text-sm">
          <thead className="border-b border-ink-border bg-ink-raised text-left text-xs uppercase tracking-wider text-paper-dim">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {result.items.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-paper-dim"
                >
                  No orders found.
                </td>
              </tr>
            )}
            {result.items.map((order) => (
              <tr
                key={order.id}
                className="border-b border-ink-border last:border-0"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-medium text-gold hover:underline"
                  >
                    {order.orderNumber}
                  </Link>
                  <p className="text-xs text-paper-dim">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p>{order.customerName}</p>
                  <p className="text-xs text-paper-dim">
                    {order.customerPhone}
                  </p>
                </td>
                <td className="px-4 py-3 text-paper-dim">
                  {order.items.length}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="neutral">{order.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right text-gold">
                  {formatCents(order.totalCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        buildHref={(page) =>
          `/admin/orders?${params.query ? `query=${params.query}&` : ""}${
            params.status ? `status=${params.status}&` : ""
          }page=${page}`
        }
      />
    </>
  );
}

export default function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<OrdersSearchParams>;
}) {
  return (
    <div>
      <h1 className="mb-5 font-display text-2xl sm:mb-6 sm:text-3xl">ORDERS</h1>
      <Suspense fallback={<div className="h-96 animate-pulse bg-ink-raised" />}>
        <OrdersContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
