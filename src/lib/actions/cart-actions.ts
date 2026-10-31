"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { CART_COOKIE_NAME, CART_COOKIE_MAX_AGE } from "@/lib/cart/constants";

export interface CartActionResult {
  success: boolean;
  message: string;
}

async function ensureCartToken(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CART_COOKIE_NAME)?.value;
  if (existing) return existing;

  const token = randomUUID();
  cookieStore.set(CART_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
  });
  return token;
}

async function ensureCart(token: string) {
  return prisma.cart.upsert({
    where: { sessionToken: token },
    create: { sessionToken: token },
    update: {},
  });
}

function refreshCartViews() {
  revalidatePath("/", "layout");
  revalidatePath("/cart");
}

export async function addToCartAction(
  variantId: string,
  quantity: number
): Promise<CartActionResult> {
  if (quantity < 1) {
    return { success: false, message: "Quantity must be at least 1." };
  }

  try {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant || !variant.product.published) {
      return { success: false, message: "This item is no longer available." };
    }

    if (variant.stock < 1) {
      return { success: false, message: "This size is currently out of stock." };
    }

    const token = await ensureCartToken();
    const cart = await ensureCart(token);

    const existing = await prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
    });

    const desiredQuantity = (existing?.quantity ?? 0) + quantity;
    const cappedQuantity = Math.min(desiredQuantity, variant.stock);

    await prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
      create: {
        cartId: cart.id,
        productId: variant.productId,
        variantId,
        quantity: cappedQuantity,
      },
      update: { quantity: cappedQuantity },
    });

    refreshCartViews();

    if (cappedQuantity < desiredQuantity) {
      return {
        success: true,
        message: `Only ${variant.stock} in stock — added the maximum available.`,
      };
    }

    return { success: true, message: "Added to cart." };
  } catch {
    return { success: false, message: "Couldn't add this to your cart. Please try again." };
  }
}

export async function updateCartItemQuantityAction(
  lineId: string,
  quantity: number
): Promise<CartActionResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CART_COOKIE_NAME)?.value;
  if (!token) return { success: false, message: "Your cart has expired." };

  try {
    const line = await prisma.cartItem.findUnique({
      where: { id: lineId },
      include: { cart: true, variant: true },
    });

    if (!line || line.cart.sessionToken !== token) {
      return { success: false, message: "Item not found in your cart." };
    }

    if (quantity < 1) {
      await prisma.cartItem.delete({ where: { id: lineId } });
      refreshCartViews();
      return { success: true, message: "Item removed." };
    }

    const cappedQuantity = Math.min(quantity, line.variant.stock);
    await prisma.cartItem.update({
      where: { id: lineId },
      data: { quantity: cappedQuantity },
    });

    refreshCartViews();
    return { success: true, message: "Cart updated." };
  } catch {
    return { success: false, message: "Couldn't update your cart. Please try again." };
  }
}

export async function removeCartItemAction(lineId: string): Promise<CartActionResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CART_COOKIE_NAME)?.value;
  if (!token) return { success: false, message: "Your cart has expired." };

  try {
    const line = await prisma.cartItem.findUnique({
      where: { id: lineId },
      include: { cart: true },
    });

    if (!line || line.cart.sessionToken !== token) {
      return { success: false, message: "Item not found in your cart." };
    }

    await prisma.cartItem.delete({ where: { id: lineId } });
    refreshCartViews();
    return { success: true, message: "Item removed." };
  } catch {
    return { success: false, message: "Couldn't remove this item. Please try again." };
  }
}
