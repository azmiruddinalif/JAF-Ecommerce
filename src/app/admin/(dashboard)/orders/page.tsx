import Link from "next/link";
import type { OrderStatus } from "@prisma/client";
import { getAdminOrders } from "@/lib/data/orders";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/money";
import { Pagination } from "@/components/products/pagination";
import { Select } from "@/components/ui/input";

export const metadata = { title: "Orders", robots: { index: false } };

const STATUS_OPTIONS: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string; page?: string }>;
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
    <div>
      <h1 className="mb-6 font-display text-3xl">ORDERS</h1>

      <form method="GET" className="mb-6 flex flex-wrap gap-3">
        <input
          type="search"
          name="query"
          defaultValue={params.query}
          placeholder="Search order #, name, phone..."
          className="w-64 border border-ink-border bg-ink-raised px-4 py-2.5 text-sm placeholder:text-paper-dim focus:border-gold focus:outline-none"
        />
        <Select
          name="status"
          defaultValue={params.status ?? ""}
          className="w-44"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <button
          type="submit"
          className="border border-gold/40 px-4 py-2 text-xs uppercase tracking-wider text-gold hover:border-gold"
        >
          Filter
        </button>
      </form>

      <div className="overflow-x-auto border border-ink-border">
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
    </div>
  );
}
