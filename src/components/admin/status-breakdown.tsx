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
  PENDING: "bg-paper-dim",
  CONFIRMED: "bg-gold-bright",
  PROCESSING: "bg-gold-bright",
  SHIPPED: "bg-gold-bright",
  DELIVERED: "bg-success",
  CANCELLED: "bg-danger",
};

export function StatusBreakdown({ data }: { data: { status: OrderStatus; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="flex h-full flex-col border border-ink-border">
      <div className="border-b border-ink-border px-5 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider">Orders by Status</h2>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-4 px-5 py-5">
        {data.map((d) => (
          <div key={d.status}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-paper-dim">{LABELS[d.status]}</span>
              <span className="font-semibold text-paper">{d.count}</span>
            </div>
            <div className="h-1.5 w-full bg-ink-raised">
              <div
                className={`h-full ${BAR_TONE[d.status]}`}
                style={{ width: `${(d.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
