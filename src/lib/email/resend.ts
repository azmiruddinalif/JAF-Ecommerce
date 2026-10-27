import "server-only";
import { Resend } from "resend";
import { formatCents } from "@/lib/money";

let cachedClient: Resend | null = null;

function getClient(): Resend {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Email is not configured. Set RESEND_API_KEY.");
  }

  cachedClient = new Resend(apiKey);
  return cachedClient;
}

export interface InvoiceEmailOrder {
  orderNumber: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  totalCents: number;
}

export async function sendInvoiceEmail(order: InvoiceEmailOrder, pdfBuffer: Uint8Array): Promise<void> {
  const client = getClient();
  const from = process.env.RESEND_FROM_EMAIL || "JAF <onboarding@resend.dev>";

  const { error } = await client.emails.send({
    from,
    to: order.customerEmail,
    subject: `Your JAF invoice — ${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111; max-width: 480px; margin: 0 auto;">
        <h1 style="font-size: 20px; margin-bottom: 4px;">Thanks for your order, ${escapeHtml(order.customerName)}!</h1>
        <p style="color: #555; font-size: 14px;">
          Your order <strong>${escapeHtml(order.orderNumber)}</strong> has been received. The invoice
          (${escapeHtml(order.invoiceNumber)}) is attached as a PDF — total ${formatCents(order.totalCents)}.
        </p>
        <p style="color: #555; font-size: 14px;">Payment method: Cash on Delivery.</p>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">— JAF, We Are The Ion To Fashion</p>
      </div>
    `,
    attachments: [
      {
        filename: `${order.invoiceNumber}.pdf`,
        content: Buffer.from(pdfBuffer),
      },
    ],
  });

  if (error) {
    throw new Error(error.message || "Failed to send invoice email.");
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
