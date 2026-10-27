"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/session";
import { generateAndDeliverInvoice } from "@/lib/invoice/deliver";

export interface InvoiceActionResult {
  success: boolean;
  message: string;
}

export async function regenerateInvoiceAction(orderId: string): Promise<InvoiceActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { success: false, message: "You must be signed in as an admin." };
  }

  const result = await generateAndDeliverInvoice(orderId);
  revalidatePath(`/admin/orders/${orderId}`);
  return result;
}
