import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { CART_COOKIE_NAME } from "./constants";

export interface CartLineView {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  variantId: string;
  size: string;
  color: string | null;
  imageUrl: string | null;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  availableStock: number;
  exceedsStock: boolean;
}

export interface CartView {
  lines: CartLineView[];
  itemCount: number;
  subtotalCents: number;
}

const EMPTY_CART: CartView = { lines: [], itemCount: 0, subtotalCents: 0 };

export async function getCartToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CART_COOKIE_NAME)?.value ?? null;
}

export async function getCartView(): Promise<CartView> {
  const token = await getCartToken();
  if (!token) return EMPTY_CART;

  const cart = await prisma.cart.findUnique({
    where: { sessionToken: token },
    include: {
      items: {
        include: {
          product: { include: { images: { orderBy: { displayOrder: "asc" }, take: 1 } } },
          variant: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!cart) return EMPTY_CART;

  const lines: CartLineView[] = cart.items.map((item) => {
    const unitPriceCents =
      item.variant.priceCents ?? item.product.discountPriceCents ?? item.product.basePriceCents;
    return {
      id: item.id,
      productId: item.productId,
      productSlug: item.product.slug,
      productName: item.product.name,
      variantId: item.variantId,
      size: item.variant.size,
      color: item.variant.color,
      imageUrl: item.product.images[0]?.secureUrl ?? null,
      unitPriceCents,
      quantity: item.quantity,
      lineTotalCents: unitPriceCents * item.quantity,
      availableStock: item.variant.stock,
      exceedsStock: item.quantity > item.variant.stock,
    };
  });

  return {
    lines,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotalCents: lines.reduce((sum, line) => sum + line.lineTotalCents, 0),
  };
}
