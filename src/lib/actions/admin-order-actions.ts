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
  status: OrderStatus
): Promise<OrderActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { success: false, message: "You must be signed in as an admin." };
  }

  await prisma.order.update({ where: { id: orderId }, data: { status } });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);

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

  return { success: true, message: "Payment status updated." };
}
