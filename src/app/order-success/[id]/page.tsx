import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getOrderById } from "@/lib/data/orders";
import { formatCents } from "@/lib/money";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false },
};

// Every order id is unique and transactional — never static.
export const instant = false;

async function OrderDetails({ orderId }: { orderId: string }) {
  const order = await getOrderById(orderId);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <CheckCircle2 className="mx-auto mb-6 text-gold" size={56} strokeWidth={1.5} />
      <h1 className="font-display text-3xl sm:text-4xl">ORDER CONFIRMED</h1>
      <p className="mt-3 text-sm text-paper-dim">
        Thank you, {order.customerName}. Your order <span className="text-gold">{order.orderNumber}</span> has
        been received and will be processed shortly.
      </p>

      <div className="mt-10 border border-ink-border p-6 text-left">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-paper-dim">Order Summary</h2>
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between border-b border-ink-border py-3 text-sm last:border-0">
            <span>
              {item.productName} · Size {item.size} × {item.quantity}
            </span>
            <span className="text-gold">{formatCents(item.subtotalCents)}</span>
          </div>
        ))}
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between text-paper-dim">
            <span>Subtotal</span>
            <span>{formatCents(order.subtotalCents)}</span>
          </div>
          <div className="flex justify-between text-paper-dim">
            <span>Delivery</span>
            <span>{order.deliveryFeeCents === 0 ? "Free" : formatCents(order.deliveryFeeCents)}</span>
          </div>
          <div className="flex justify-between border-t border-ink-border pt-3 text-base font-semibold">
            <span>Total</span>
            <span className="text-gold">{formatCents(order.totalCents)}</span>
          </div>
        </div>
        <p className="mt-6 text-xs text-paper-dim">
          Delivery address: {order.address}, {order.area}, {order.city}
        </p>
        <p className="text-xs text-paper-dim">Payment: Cash on Delivery</p>
      </div>

      {order.invoicePdfUrl && (
        <p className="mt-6 text-sm text-paper-dim">
          <a href={order.invoicePdfUrl} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
            Download your invoice
          </a>
          {order.customerEmail && order.invoiceEmailSentAt && (
            <> — we&apos;ve also emailed a copy to {order.customerEmail}.</>
          )}
        </p>
      )}

      <Link href="/shop" className="mt-10 inline-block">
        <Button variant="primary" size="lg">
          CONTINUE SHOPPING
        </Button>
      </Link>
    </div>
  );
}

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<div className="h-96 animate-pulse bg-ink-raised" />}>
      <OrderDetails orderId={id} />
    </Suspense>
  );
}
