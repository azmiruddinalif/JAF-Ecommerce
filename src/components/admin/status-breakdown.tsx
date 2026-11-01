import type { OrderStatus } from "@prisma/client";

const LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const BAR_TONE: Record<OrderStatus, string> = {
  PENDING: "bg-amber-400",
  CONFIRMED: "bg-blue-500",
  PROCESSING: "bg-indigo-500",
  SHIPPED: "bg-emerald-500",
  DELIVERED: "bg-emerald-600",
  CANCELLED: "bg-rose-400",
};

export function StatusBreakdown({ data }: { data: { status: OrderStatus; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
      <div className="border-b border-slate-200/80 px-5 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">Orders by Status</h2>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-4 px-5 py-5">
        {data.map((d) => (
          <div key={d.status}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">{LABELS[d.status]}</span>
              <span className="font-bold text-slate-900">{d.count}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${BAR_TONE[d.status]}`}
                style={{ width: `${(d.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
