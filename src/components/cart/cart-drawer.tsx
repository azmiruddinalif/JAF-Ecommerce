"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { CartView } from "@/lib/cart/read";
import { CartLineRow } from "./cart-line-row";
import { CartSummary } from "./cart-summary";
import { EmptyCart } from "./empty-cart";

export function CartDrawer({
  open,
  onClose,
  cart,
  deliveryFeeCents,
  freeDeliveryThresholdCents,
}: {
  open: boolean;
  onClose: () => void;
  cart: CartView;
  deliveryFeeCents: number;
  freeDeliveryThresholdCents: number;
}) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" aria-describedby={undefined} className="p-0">
        <SheetHeader>
          <SheetTitle>YOUR CART ({cart.itemCount})</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          {cart.lines.length === 0 ? (
            <EmptyCart compact />
          ) : (
            cart.lines.map((line) => <CartLineRow key={line.id} line={line} compact />)
          )}
        </div>

        {cart.lines.length > 0 && (
          <div className="border-t border-ink-border px-6 py-5">
            <CartSummary
              subtotalCents={cart.subtotalCents}
              deliveryFeeCents={cart.subtotalCents >= freeDeliveryThresholdCents ? 0 : deliveryFeeCents}
              freeDeliveryThresholdCents={freeDeliveryThresholdCents}
            />
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Link href="/cart" onClick={onClose}>
                <Button variant="outline" className="w-full">
                  VIEW CART
                </Button>
              </Link>
              <Link href="/checkout" onClick={onClose}>
                <Button variant="primary" className="w-full">
                  CHECKOUT
                </Button>
              </Link>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
