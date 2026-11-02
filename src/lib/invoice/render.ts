import "server-only";
import type { Order, OrderItem } from "@prisma/client";
import { generateInvoicePdf, type InvoiceOrder } from "./generate-pdf";

export function buildInvoiceNumber(orderNumber: string): string {
  return orderNumber.replace(/^JAF-/, "INV-");
}

type OrderWithItems = Order & { items: OrderItem[] };

export async function renderInvoicePdf(
  order: OrderWithItems,
  invoiceNumber: string
): Promise<Uint8Array> {
  const invoiceOrder: InvoiceOrder = {
    orderNumber: order.orderNumber,
    invoiceNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    address: order.address,
    city: order.city,
    area: order.area,
    subtotalCents: order.subtotalCents,
    deliveryFeeCents: order.deliveryFeeCents,
    discountCents: order.discountCents,
    totalCents: order.totalCents,
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      productName: item.productName,
      size: item.size,
      sku: item.sku,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      subtotalCents: item.subtotalCents,
    })),
  };

  return generateInvoicePdf(invoiceOrder);
}
