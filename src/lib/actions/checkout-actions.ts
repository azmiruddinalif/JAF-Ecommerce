"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validation/schemas";
import { CART_COOKIE_NAME } from "@/lib/cart/constants";
import { isNoSizeVariant } from "@/lib/constants";
import { getStoreSettings } from "@/lib/data/settings";
import { generateAndDeliverInvoice } from "@/lib/invoice/deliver";

class InsufficientStockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientStockError";
  }
}

export interface CheckoutActionResult {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
}

function generateOrderNumber(): string {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `JAF-${datePart}-${randomPart}`;
}

export async function placeOrderAction(
  _prev: CheckoutActionResult | null,
  formData: FormData
): Promise<CheckoutActionResult> {
  const raw = {
    customerName: formData.get("customerName")?.toString() ?? "",
    customerPhone: formData.get("customerPhone")?.toString() ?? "",
    customerEmail: formData.get("customerEmail")?.toString() ?? "",
    address: formData.get("address")?.toString() ?? "",
    city: formData.get("city")?.toString() ?? "",
    area: formData.get("area")?.toString() ?? "",
    deliveryInstructions: formData.get("deliveryInstructions")?.toString() ?? "",
    paymentMethod: "COD" as const,
  };

  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { success: false, message: "Please fix the errors below.", fieldErrors };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(CART_COOKIE_NAME)?.value;
  if (!token) {
    return { success: false, message: "Your cart is empty." };
  }

  let order: { id: string };
  try {
    const cart = await prisma.cart.findUnique({
      where: { sessionToken: token },
      include: { items: { include: { product: true, variant: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return { success: false, message: "Your cart is empty." };
    }

    for (const item of cart.items) {
      if (item.quantity > item.variant.stock) {
        const sizeSuffix = isNoSizeVariant(item.variant.size) ? "" : ` (${item.variant.size})`;
        return {
          success: false,
          message: `"${item.product.name}"${sizeSuffix} only has ${item.variant.stock} left in stock. Please update your cart.`,
        };
      }
    }

    const settings = await getStoreSettings();
    const subtotalCents = cart.items.reduce((sum, item) => {
      const unitPrice = item.variant.priceCents ?? item.product.discountPriceCents ?? item.product.basePriceCents;
      return sum + unitPrice * item.quantity;
    }, 0);

    const deliveryFeeCents =
      subtotalCents >= settings.freeDeliveryThresholdCents ? 0 : settings.deliveryFeeCents;
    const discountCents = 0;
    const totalCents = subtotalCents + deliveryFeeCents - discountCents;

    order = await prisma.$transaction(async (tx) => {
      // Atomically validate and deduct stock first so concurrent orders can never oversell or make stock negative
      for (const item of cart.items) {
        const deducted = await tx.productVariant.updateMany({
          where: {
            id: item.variantId,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        if (deducted.count === 0) {
          const latest = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            select: { stock: true, size: true },
          });
          const sizeSuffix = isNoSizeVariant(item.variant.size) ? "" : ` (${item.variant.size})`;
          throw new InsufficientStockError(
            `"${item.product.name}"${sizeSuffix} only has ${latest?.stock ?? 0} left in stock. Please update your cart.`
          );
        }
      }

      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          customerName: parsed.data.customerName,
          customerPhone: parsed.data.customerPhone,
          customerEmail: parsed.data.customerEmail || null,
          address: parsed.data.address,
          city: parsed.data.city,
          area: parsed.data.area,
          deliveryInstructions: parsed.data.deliveryInstructions || null,
          subtotalCents,
          deliveryFeeCents,
          discountCents,
          totalCents,
          paymentMethod: "COD",
          items: {
            create: cart.items.map((item) => {
              const unitPrice =
                item.variant.priceCents ?? item.product.discountPriceCents ?? item.product.basePriceCents;
              return {
                productId: item.productId,
                variantId: item.variantId,
                productName: item.product.name,
                size: item.variant.size,
                sku: item.variant.sku,
                unitPriceCents: unitPrice,
                quantity: item.quantity,
                subtotalCents: unitPrice * item.quantity,
              };
            }),
          },
        },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return created;
    });
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return { success: false, message: error.message };
    }
    return {
      success: false,
      message: "Could not complete your order. Please try again shortly.",
    };
  }

  cookieStore.delete(CART_COOKIE_NAME);

  revalidatePath("/admin/stocks");
  revalidatePath("/admin/products");
  revalidatePath("/admin/orders");
  revalidatePath("/admin", "layout");
  revalidatePath("/shop");
  revalidatePath("/", "layout");

  // Best-effort — a slow or failing invoice/email provider must never block
  // an otherwise-successful order. Failures are recorded on the order for
  // admin to see and retry from the dashboard.
  try {
    await generateAndDeliverInvoice(order.id);
  } catch {
    // generateAndDeliverInvoice itself never throws, but guard anyway.
  }

  redirect(`/order-success/${order.id}`);
}
