import { formatCents } from "@/lib/money";

const DEFAULT_COUNTRY_CODE = process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || "880"; // Bangladesh

/**
 * Normalizes a locally-entered phone number into the digits-only
 * international format wa.me links require. Numbers already starting with
 * a country code are left as-is; a leading trunk "0" (the common local
 * format, e.g. "01712345678") is replaced with the store's default country
 * code.
 */
export function toWhatsAppDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith(DEFAULT_COUNTRY_CODE)) return digits;
  if (digits.startsWith("0")) return `${DEFAULT_COUNTRY_CODE}${digits.slice(1)}`;
  return digits;
}

export interface WhatsAppInvoiceOrder {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalCents: number;
  invoicePdfUrl: string | null;
}

/**
 * Builds a click-to-chat wa.me link pre-filled with the invoice message, for
 * staff to open and tap send from the admin dashboard. There is no WhatsApp
 * Business API configured, so this is a manual, one-tap send rather than a
 * fully automatic one.
 */
export function buildInvoiceWhatsAppLink(order: WhatsAppInvoiceOrder): string {
  const digits = toWhatsAppDigits(order.customerPhone);
  const lines = [
    `Hi ${order.customerName}, thanks for your JAF order ${order.orderNumber}!`,
    `Total: ${formatCents(order.totalCents)} (Cash on Delivery)`,
  ];
  if (order.invoicePdfUrl) {
    lines.push(`Your invoice: ${order.invoicePdfUrl}`);
  }
  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${digits}?text=${text}`;
}
