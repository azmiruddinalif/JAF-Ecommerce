import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCartView } from "@/lib/cart/read";
import { getStoreSettings } from "@/lib/data/settings";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { CartSummary } from "@/components/cart/cart-summary";
import { formatCents } from "@/lib/money";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Checkout",
};

async function CheckoutContent() {
  const [cart, settings] = await Promise.all([getCartView(), getStoreSettings()]);

  if (cart.lines.length === 0) {
    redirect("/cart");
  }

  const deliveryFeeCents =
    cart.subtotalCents >= settings.freeDeliveryThresholdCents ? 0 : settings.deliveryFeeCents;

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <CheckoutForm codEnabled={settings.codEnabled} />
      </div>
      <div className="border border-ink-border p-6">
        <h2 className="mb-4 font-display text-lg">YOUR ORDER</h2>
        <div className="mb-5 space-y-3">
          {cart.lines.map((line) => (
            <div key={line.id} className="flex items-center gap-3">
              <div className="relative h-14 w-12 shrink-0 overflow-hidden bg-ink-raised">
                {line.imageUrl && (
                  <Image src={line.imageUrl} alt={line.productName} fill sizes="60px" className="object-cover" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm">{line.productName}</p>
                <p className="text-xs text-paper-dim">
                  Size {line.size} × {line.quantity}
                </p>
              </div>
              <span className="text-sm text-gold">{formatCents(line.lineTotalCents)}</span>
            </div>
          ))}
        </div>
        <CartSummary
          subtotalCents={cart.subtotalCents}
          deliveryFeeCents={deliveryFeeCents}
          freeDeliveryThresholdCents={settings.freeDeliveryThresholdCents}
        />
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-10 font-display text-4xl">CHECKOUT</h1>
      <Suspense fallback={<div className="h-96 animate-pulse bg-ink-raised" />}>
        <CheckoutContent />
      </Suspense>
    </div>
  );
}
