import "server-only";
import { formatCents } from "@/lib/money";
import { toWhatsAppDigits } from "@/lib/whatsapp";

/**
 * Sends the invoice PDF to the customer's WhatsApp through Meta's WhatsApp
 * Cloud API. Business-initiated messages must use a pre-approved template, so
 * this sends WHATSAPP_TEMPLATE_NAME with a Document header (the PDF) and three
 * body variables: {{1}} customer name, {{2}} order number, {{3}} total.
 */

const API_VERSION = process.env.WHATSAPP_API_VERSION || "v23.0";

interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  templateName: string;
  templateLanguage: string;
}

export function isWhatsAppConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

function getConfig(): WhatsAppConfig {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!accessToken || !phoneNumberId) {
    throw new Error("WhatsApp is not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.");
  }
  return {
    accessToken,
    phoneNumberId,
    templateName: process.env.WHATSAPP_TEMPLATE_NAME || "order_invoice",
    templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en",
  };
}

// Graph API errors look like { error: { message, code, error_data: { details } } }.
async function readGraphError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      error?: { message?: string; code?: number; error_data?: { details?: string } };
    };
    const details = body.error?.error_data?.details;
    const message = body.error?.message || `HTTP ${response.status}`;
    return details ? `${message} — ${details}` : message;
  } catch {
    return `HTTP ${response.status}`;
  }
}

// Template variables may not contain newlines, tabs or 4+ consecutive spaces.
function templateText(value: string): string {
  return value.replace(/[\t\r\n]+/g, " ").replace(/ {4,}/g, "   ").trim() || "-";
}

async function uploadPdf(config: WhatsAppConfig, pdfBuffer: Uint8Array, filename: string): Promise<string> {
  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("type", "application/pdf");
  form.append("file", new Blob([Buffer.from(pdfBuffer)], { type: "application/pdf" }), filename);

  const response = await fetch(`https://graph.facebook.com/${API_VERSION}/${config.phoneNumberId}/media`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.accessToken}` },
    body: form,
  });
  if (!response.ok) {
    throw new Error(`Could not upload invoice to WhatsApp: ${await readGraphError(response)}`);
  }
  const { id } = (await response.json()) as { id?: string };
  if (!id) throw new Error("Could not upload invoice to WhatsApp: no media id returned.");
  return id;
}

export interface WhatsAppInvoiceMessage {
  orderNumber: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  totalCents: number;
}

export async function sendInvoiceWhatsApp(order: WhatsAppInvoiceMessage, pdfBuffer: Uint8Array): Promise<void> {
  const config = getConfig();
  const to = toWhatsAppDigits(order.customerPhone);
  if (to.length < 8) {
    throw new Error(`"${order.customerPhone}" is not a valid WhatsApp number.`);
  }

  const filename = `${order.invoiceNumber}.pdf`;
  const mediaId = await uploadPdf(config, pdfBuffer, filename);

  const response = await fetch(`https://graph.facebook.com/${API_VERSION}/${config.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: config.templateName,
        language: { code: config.templateLanguage },
        components: [
          {
            type: "header",
            parameters: [{ type: "document", document: { id: mediaId, filename } }],
          },
          {
            type: "body",
            parameters: [
              { type: "text", text: templateText(order.customerName) },
              { type: "text", text: templateText(order.orderNumber) },
              { type: "text", text: templateText(formatCents(order.totalCents)) },
            ],
          },
        ],
      },
    }),
  });

  if (!response.ok) {
    throw new Error(await readGraphError(response));
  }
}
