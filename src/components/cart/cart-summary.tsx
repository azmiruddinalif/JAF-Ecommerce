import { formatCents } from "@/lib/money";

export function CartSummary({
  subtotalCents,
  deliveryFeeCents,
  discountCents = 0,
  freeDeliveryThresholdCents,
}: {
  subtotalCents: number;
  deliveryFeeCents: number;
  discountCents?: number;
  freeDeliveryThresholdCents?: number;
}) {
  const totalCents = subtotalCents + deliveryFeeCents - discountCents;
  const remainingForFreeDelivery =
    freeDeliveryThresholdCents && subtotalCents < freeDeliveryThresholdCents
      ? freeDeliveryThresholdCents - subtotalCents
      : 0;

  return (
    <div className="space-y-3 text-sm">
      {remainingForFreeDelivery > 0 && (
        <p className="border border-gold/40 bg-gold/10 px-3 py-2 text-xs text-gold">
          Add {formatCents(remainingForFreeDelivery)} more for free delivery.
        </p>
      )}
      <div className="flex justify-between text-paper-dim">
        <span>Subtotal</span>
        <span>{formatCents(subtotalCents)}</span>
      </div>
      <div className="flex justify-between text-paper-dim">
        <span>Delivery</span>
        <span>{deliveryFeeCents === 0 ? "Free" : formatCents(deliveryFeeCents)}</span>
      </div>
      {discountCents > 0 && (
        <div className="flex justify-between text-gold">
          <span>Discount</span>
          <span>-{formatCents(discountCents)}</span>
        </div>
      )}
      <div className="flex justify-between border-t border-ink-border pt-3 text-base font-semibold">
        <span>Total</span>
        <span className="text-gold">{formatCents(totalCents)}</span>
      </div>
    </div>
  );
}
