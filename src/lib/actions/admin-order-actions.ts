"use server";

import { revalidatePath } from "next/cache";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth/session";

export interface OrderActionResult {
  success: boolean;
  message: string;
}

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
  options?: { restoreStock?: boolean }
): Promise<OrderActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { success: false, message: "You must be signed in as an admin." };
  }

  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!existingOrder) {
    return { success: false, message: "Order not found." };
  }

  if (existingOrder.status === status) {
    return { success: true, message: "Order status is already up to date." };
  }

  const wasCancelled = existingOrder.status === "CANCELLED";
  const willBeCancelled = status === "CANCELLED";

  // Pre-delivery cancellations automatically restore resellable stock;
  // already-DELIVERED orders do not automatically return items to stock unless explicitly confirmed.
  const shouldRestoreOnCancel =
    options?.restoreStock ?? existingOrder.status !== "DELIVERED";

  try {
    await prisma.$transaction(async (tx) => {
      // Atomic compare-and-swap on status prevents duplicate stock restorations or deductions
      const updated = await tx.order.updateMany({
        where: { id: orderId, status: existingOrder.status },
        data: { status },
      });

      if (updated.count === 0) {
        return;
      }

      if (!wasCancelled && willBeCancelled && shouldRestoreOnCancel) {
        for (const item of existingOrder.items) {
          if (item.variantId) {
            await tx.productVariant.updateMany({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
          } else if (item.productId) {
            await tx.productVariant.updateMany({
              where: { productId: item.productId, size: item.size },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      } else if (wasCancelled && !willBeCancelled) {
        for (const item of existingOrder.items) {
          const whereClause = item.variantId
            ? { id: item.variantId, stock: { gte: item.quantity } }
            : item.productId
              ? { productId: item.productId, size: item.size, stock: { gte: item.quantity } }
              : null;

          if (whereClause) {
            const deducted = await tx.productVariant.updateMany({
              where: whereClause,
              data: { stock: { decrement: item.quantity } },
            });
            if (deducted.count === 0) {
              throw new Error(
                `Insufficient stock to reopen order for "${item.productName}" (${item.size}).`
              );
            }
          }
        }
      }
    });
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Could not update order status due to stock constraints.",
    };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/stocks");
  revalidatePath("/admin/products");
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");

  return { success: true, message: "Order status updated." };
}

export async function updatePaymentStatusAction(
  orderId: string,
  paymentStatus: PaymentStatus
): Promise<OrderActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { success: false, message: "You must be signed in as an admin." };
  }

  await prisma.order.update({ where: { id: orderId }, data: { paymentStatus } });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin", "layout");

  return { success: true, message: "Payment status updated." };
}
