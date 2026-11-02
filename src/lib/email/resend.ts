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
  const formattedTotal = formatCents(order.totalCents);

  const { error } = await client.emails.send({
    from,
    to: order.customerEmail,
    subject: `Order Confirmed (${order.orderNumber}) — Invoice Attached | JAF`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Invoice ${escapeHtml(order.orderNumber)}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 24px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border: 1px solid #e2e8f0; overflow: hidden;">
                <!-- Header -->
                <tr>
                  <td style="background-color: #09090b; padding: 24px 28px; text-align: left; border-bottom: 3px solid #f59e0b;">
                    <span style="font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #ffffff; font-family: Impact, 'Arial Black', sans-serif;">JAF</span>
                    <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #f59e0b; margin-top: 2px; font-weight: 600;">We Are The Ion To Fashion</span>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 28px 28px 20px 28px;">
                    <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                      Thank You for Your Order, ${escapeHtml(order.customerName)}!
                    </h1>
                    <p style="margin: 0 0 18px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                      We have received your order and our matchday dispatch team is preparing your authentic jersey. Your official tax invoice <strong>${escapeHtml(order.invoiceNumber)}</strong> is attached as a PDF to this email.
                    </p>

                    <!-- Summary Box -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; margin: 18px 0; padding: 16px;">
                      <tr>
                        <td style="padding: 6px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600;">Order Reference</td>
                        <td style="padding: 6px 12px; font-size: 13px; font-weight: 700; color: #09090b; text-align: right; font-family: monospace;">${escapeHtml(order.orderNumber)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600;">Invoice Number</td>
                        <td style="padding: 6px 12px; font-size: 13px; font-weight: 700; color: #d97706; text-align: right; font-family: monospace;">${escapeHtml(order.invoiceNumber)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600;">Payment Method</td>
                        <td style="padding: 6px 12px; font-size: 13px; font-weight: 600; color: #09090b; text-align: right;">Cash on Delivery</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding: 4px 12px;"><hr style="border: none; border-top: 1px solid #e2e8f0; margin: 6px 0;"></td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #09090b; font-weight: 800;">Amount Payable</td>
                        <td style="padding: 6px 12px; font-size: 16px; font-weight: 800; color: #09090b; text-align: right;">${formattedTotal}</td>
                      </tr>
                    </table>

                    <!-- Highlights Banner -->
                    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 20px 0;">
                      <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: 600;">
                        Open-Box Verification & Size Exchange Guarantee
                      </p>
                      <p style="margin: 4px 0 0 0; font-size: 12px; color: #b45309; line-height: 1.5;">
                        Check your kit upon delivery. Need a different size? Reach out to our WhatsApp hotline immediately for prompt assistance.
                      </p>
                    </div>

                    <p style="margin: 20px 0 0 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                      Please find your formal invoice PDF attached below for your records. If you have questions regarding your delivery, reach us at <a href="mailto:support@jafjersey.com" style="color: #d97706; text-decoration: none; font-weight: 600;">support@jafjersey.com</a> or WhatsApp <a href="https://wa.me/8801328366311" style="color: #d97706; text-decoration: none; font-weight: 600;">+880 1328-366311</a>.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f1f5f9; padding: 18px 28px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 700;">
                      JAF SPORTS &amp; LIFESTYLE APPAREL
                    </p>
                    <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8;">
                      Shahabuddin Plaza, Ring Road, Mohammadpur, Dhaka · Bangladesh
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
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
