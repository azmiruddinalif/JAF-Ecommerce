import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/session";
import { buildInvoiceNumber, renderInvoicePdf } from "@/lib/invoice/render";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("orders:read");
  } catch {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) {
    return new NextResponse("Order not found", { status: 404 });
  }

  const invoiceNumber = order.invoiceNumber ?? buildInvoiceNumber(order.orderNumber);
  const pdfBuffer = await renderInvoicePdf(order, invoiceNumber);

  const searchParams = request.nextUrl.searchParams;
  const isDownload = searchParams.get("download") === "1";

  const disposition = isDownload
    ? `attachment; filename="${invoiceNumber}.pdf"`
    : `inline; filename="${invoiceNumber}.pdf"`;

  return new NextResponse(Buffer.from(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition,
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
}

