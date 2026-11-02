import "server-only";
import { prisma } from "@/lib/prisma";
import { imageStorage } from "@/lib/storage";
import { buildInvoiceNumber, renderInvoicePdf } from "./render";
import { sendInvoiceEmail } from "@/lib/email/resend";
import { sendInvoiceWhatsApp } from "@/lib/whatsapp-cloud";

/**
 * Generates the invoice PDF for an order, stores it, emails it to the
 * customer if they gave an email address, and sends it to their WhatsApp
 * number. Never throws — failures (storage, email or WhatsApp not configured,
 * etc.) are recorded on the order so checkout always succeeds and admin can
 * see what happened and retry.
 */
export async function generateAndDeliverInvoice(orderId: string): Promise<{ success: boolean; message: string }> {
  let order;
  try {
    order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  } catch {
    return { success: false, message: "Could not load the order — the database is unreachable." };
  }
  if (!order) {
    return { success: false, message: "Order not found." };
  }

  const invoiceNumber = order.invoiceNumber ?? buildInvoiceNumber(order.orderNumber);

  let pdfBuffer: Uint8Array;
  try {
    pdfBuffer = await renderInvoicePdf(order, invoiceNumber);
  } catch (error) {
    return {
      success: false,
      message: `Could not generate the invoice PDF: ${error instanceof Error ? error.message : "unknown error"}`,
    };
  }

  let invoicePdfUrl = order.invoicePdfUrl;
  let invoicePdfPublicId = order.invoicePdfPublicId;
  let storageError: string | null = null;
  try {
    const uploaded = await imageStorage.upload(Buffer.from(pdfBuffer), {
      folder: `invoices/${order.id}`,
      filename: "invoice",
      contentType: "application/pdf",
    });
    invoicePdfUrl = uploaded.secureUrl;
    invoicePdfPublicId = uploaded.publicId;
  } catch (error) {
    storageError = error instanceof Error ? error.message : "unknown storage error";
    console.warn(`[Invoice] Storage upload warning for order ${order.orderNumber}:`, storageError);
  }

  let invoiceEmailSentAt = order.invoiceEmailSentAt;
  let invoiceEmailError: string | null = null;
  let invoiceWhatsAppSentAt = order.invoiceWhatsAppSentAt;
  let invoiceWhatsAppError: string | null = null;

  const sendEmail = async () => {
    if (!order.customerEmail) return;
    try {
      await sendInvoiceEmail(
        {
          orderNumber: order.orderNumber,
          invoiceNumber,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          totalCents: order.totalCents,
        },
        pdfBuffer
      );
      invoiceEmailSentAt = new Date();
    } catch (error) {
      invoiceEmailError = error instanceof Error ? error.message : "Failed to send invoice email.";
      console.error(`[Invoice] Email delivery failed for order ${order.orderNumber}:`, invoiceEmailError);
    }
  };

  const sendWhatsApp = async () => {
    try {
      await sendInvoiceWhatsApp(
        {
          orderNumber: order.orderNumber,
          invoiceNumber,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          totalCents: order.totalCents,
        },
        pdfBuffer
      );
      invoiceWhatsAppSentAt = new Date();
    } catch (error) {
      invoiceWhatsAppError = error instanceof Error ? error.message : "Failed to send invoice on WhatsApp.";
      console.error(`[Invoice] WhatsApp delivery failed for order ${order.orderNumber}:`, invoiceWhatsAppError);
    }
  };

  await Promise.all([sendEmail(), sendWhatsApp()]);

  try {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        invoiceNumber,
        invoicePdfUrl,
        invoicePdfPublicId,
        invoiceEmailSentAt,
        invoiceEmailError,
        invoiceWhatsAppSentAt,
        invoiceWhatsAppError,
      },
    });
  } catch {
    return { success: false, message: "Invoice generated, but could not save it to the order record." };
  }

  const sent: string[] = [];
  const failed: string[] = [];
  if (order.customerEmail) {
    if (invoiceEmailError) failed.push(`email failed: ${invoiceEmailError}`);
    else sent.push("emailed");
  }
  if (invoiceWhatsAppError) failed.push(`WhatsApp failed: ${invoiceWhatsAppError}`);
  else sent.push("sent on WhatsApp");

  const cloudNote = storageError && !invoicePdfUrl ? " (cloud copy pending)" : "";
  const sentNote = sent.length > 0 ? ` and ${sent.join(" and ")}` : "";

  if (failed.length > 0) {
    return { success: false, message: `Invoice created${sentNote}${cloudNote}, but ${failed.join("; ")}` };
  }
  return { success: true, message: `Invoice created${sentNote}${cloudNote}.` };
}
