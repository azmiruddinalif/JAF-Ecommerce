import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/data/orders";
import { formatCents } from "@/lib/money";
import { buildInvoiceWhatsAppLink } from "@/lib/whatsapp";
import { OrderStatusControl } from "@/components/admin/order-status-control";
import { InvoicePanel } from "@/components/admin/invoice-panel";

export const metadata = { title: "Order Details", robots: { index: false } };
export const instant = false;

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  return (
    <div className="max-w-4xl">
      <h1 className="mb-1 font-display text-3xl">{order.orderNumber}</h1>
      <p className="mb-8 text-sm text-paper-dim">
        Placed on {new Date(order.createdAt).toLocaleString()}
      </p>

      <div className="mb-8">
        <OrderStatusControl orderId={order.id} status={order.status} paymentStatus={order.paymentStatus} />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div className="border border-ink-border p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-paper-dim">Customer</h2>
          <p className="text-sm">{order.customerName}</p>
          <p className="text-sm text-paper-dim">{order.customerPhone}</p>
          {order.customerEmail && <p className="text-sm text-paper-dim">{order.customerEmail}</p>}
        </div>
        <div className="border border-ink-border p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-paper-dim">Shipping Address</h2>
          <p className="text-sm">{order.address}</p>
          <p className="text-sm text-paper-dim">
            {order.area}, {order.city}
          </p>
          {order.deliveryInstructions && (
            <p className="mt-2 text-xs text-paper-dim">Note: {order.deliveryInstructions}</p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <InvoicePanel
          orderId={order.id}
          invoiceNumber={order.invoiceNumber}
          invoicePdfUrl={order.invoicePdfUrl}
          invoiceEmailSentAt={order.invoiceEmailSentAt}
          invoiceEmailError={order.invoiceEmailError}
          hasCustomerEmail={Boolean(order.customerEmail)}
          whatsappLink={buildInvoiceWhatsAppLink({
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            totalCents: order.totalCents,
            invoicePdfUrl: order.invoicePdfUrl,
          })}
        />
      </div>

      <div className="mt-8 border border-ink-border">
        <h2 className="border-b border-ink-border px-5 py-3 text-xs font-semibold uppercase tracking-widest text-paper-dim">
          Items
        </h2>
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between border-b border-ink-border px-5 py-3 text-sm last:border-0">
            <div>
              <p>{item.productName}</p>
              <p className="text-xs text-paper-dim">
                Size {item.size} · SKU {item.sku} · Qty {item.quantity}
              </p>
            </div>
            <span className="text-gold">{formatCents(item.subtotalCents)}</span>
          </div>
        ))}
        <div className="space-y-2 px-5 py-4 text-sm">
          <div className="flex justify-between text-paper-dim">
            <span>Subtotal</span>
            <span>{formatCents(order.subtotalCents)}</span>
          </div>
          <div className="flex justify-between text-paper-dim">
            <span>Delivery</span>
            <span>{formatCents(order.deliveryFeeCents)}</span>
          </div>
          <div className="flex justify-between border-t border-ink-border pt-2 text-base font-semibold">
            <span>Total</span>
            <span className="text-gold">{formatCents(order.totalCents)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
