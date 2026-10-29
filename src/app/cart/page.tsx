import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getCartView } from "@/lib/cart/read";
import { getStoreSettings } from "@/lib/data/settings";
import { CartLineRow } from "@/components/cart/cart-line-row";
import { CartSummary } from "@/components/cart/cart-summary";
import { EmptyCart } from "@/components/cart/empty-cart";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Your Jersey Shopping Cart",
  description:
    "Review your selected football jerseys, club kits, and sizes in your JAF shopping cart before proceeding to Cash on Delivery checkout.",
  robots: { index: false, follow: false },
};

async function CartContent() {
  const [cart, settings] = await Promise.all([getCartView(), getStoreSettings()]);

  if (cart.lines.length === 0) {
    return <EmptyCart />;
  }

  const deliveryFeeCents =
    cart.subtotalCents >= settings.freeDeliveryThresholdCents ? 0 : settings.deliveryFeeCents;

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {cart.lines.map((line) => (
          <CartLineRow key={line.id} line={line} />
        ))}
      </div>
      <div className="border border-ink-border p-6">
        <h2 className="mb-4 font-display text-lg">ORDER SUMMARY</h2>
        <CartSummary
          subtotalCents={cart.subtotalCents}
          deliveryFeeCents={deliveryFeeCents}
          freeDeliveryThresholdCents={settings.freeDeliveryThresholdCents}
        />
        <Link href="/checkout" className="mt-6 block">
          <Button variant="primary" size="lg" className="w-full">
            PROCEED TO CHECKOUT
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-10 font-display text-4xl">YOUR CART</h1>
      <Suspense fallback={<div className="h-64 animate-pulse bg-ink-raised" />}>
        <CartContent />
      </Suspense>
    </div>
  );
}
