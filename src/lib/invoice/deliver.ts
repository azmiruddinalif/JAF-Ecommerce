import "server-only";
import { prisma } from "@/lib/prisma";
import { imageStorage } from "@/lib/storage";
import { buildInvoiceNumber, renderInvoicePdf } from "./render";
import { sendInvoiceEmail } from "@/lib/email/invoice-email";

/**
 * Generates the invoice PDF for an order, stores it, and emails it to the
 * customer if they gave an email address. Never throws — failures (storage
 * not configured, email not configured, etc.) are recorded on the order so
 * checkout always succeeds and admin can see what happened and retry.
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

  if (order.customerEmail) {
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
  }

  try {
    await prisma.order.update({
      where: { id: order.id },
      data: { invoiceNumber, invoicePdfUrl, invoicePdfPublicId, invoiceEmailSentAt, invoiceEmailError },
    });
  } catch {
    return { success: false, message: "Invoice generated, but could not save it to the order record." };
  }

  if (order.customerEmail && invoiceEmailError) {
    return { success: false, message: `Invoice created, but the email failed to send: ${invoiceEmailError}` };
  }

  if (storageError && !invoicePdfUrl) {
    return {
      success: true,
      message: order.customerEmail
        ? "Invoice generated and emailed to customer (cloud copy pending)."
        : "Invoice generated (cloud copy pending).",
    };
  }

  return {
    success: true,
    message: order.customerEmail ? "Invoice created and emailed." : "Invoice created.",
  };
}
