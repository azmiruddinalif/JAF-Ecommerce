import "server-only";
import { prisma } from "@/lib/prisma";
import { imageStorage } from "@/lib/storage";
import { generateInvoicePdf } from "./generate-pdf";
import { sendInvoiceEmail } from "@/lib/email/resend";

function buildInvoiceNumber(orderNumber: string): string {
  return `INV-${orderNumber.replace(/^JAF-/, "")}`;
}

/**
 * Generates the invoice PDF for an order, stores it, and emails it to the
 * customer if they gave an email address. Never throws — failures (storage
 * not configured, email not configured, etc.) are recorded on the order so
 * checkout always succeeds and admin can see what happened and retry.
 */
export async function generateAndDeliverInvoice(orderId: string): Promise<{ success: boolean; message: string }> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) {
    return { success: false, message: "Order not found." };
  }

  const invoiceNumber = order.invoiceNumber ?? buildInvoiceNumber(order.orderNumber);

  let pdfBuffer: Uint8Array;
  try {
    pdfBuffer = await generateInvoicePdf({
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
      items: order.items,
    });
  } catch (error) {
    return {
      success: false,
      message: `Could not generate the invoice PDF: ${error instanceof Error ? error.message : "unknown error"}`,
    };
  }

  let invoicePdfUrl = order.invoicePdfUrl;
  let invoicePdfPublicId = order.invoicePdfPublicId;
  try {
    const uploaded = await imageStorage.upload(Buffer.from(pdfBuffer), {
      folder: `invoices/${order.id}`,
      filename: "invoice",
      contentType: "application/pdf",
    });
    invoicePdfUrl = uploaded.secureUrl;
    invoicePdfPublicId = uploaded.publicId;
  } catch (error) {
    await prisma.order.update({
      where: { id: order.id },
      data: { invoiceNumber },
    });
    return {
      success: false,
      message: `Could not store the invoice PDF: ${error instanceof Error ? error.message : "unknown error"}`,
    };
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
    }
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { invoiceNumber, invoicePdfUrl, invoicePdfPublicId, invoiceEmailSentAt, invoiceEmailError },
  });

  if (order.customerEmail && invoiceEmailError) {
    return { success: false, message: `Invoice created, but the email failed to send: ${invoiceEmailError}` };
  }

  return {
    success: true,
    message: order.customerEmail ? "Invoice created and emailed." : "Invoice created.",
  };
}
