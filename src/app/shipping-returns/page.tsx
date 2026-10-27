import type { Metadata } from "next";

export const metadata: Metadata = { title: "Shipping & Returns" };

export default function ShippingReturnsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-8 font-display text-4xl">SHIPPING &amp; RETURNS</h1>
      <div className="space-y-6 text-sm leading-relaxed text-paper/80">
        <section>
          <h2 className="mb-2 font-semibold text-paper">Delivery</h2>
          <p>
            Orders are processed within 1–2 business days and delivered via our courier partners.
            Delivery fees and free-delivery thresholds are shown at checkout.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-semibold text-paper">Exchanges</h2>
          <p>
            Wrong size? Contact us within 7 days of delivery with your order number for a free
            size exchange, subject to stock availability.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-semibold text-paper">Cash on Delivery</h2>
          <p>Pay in cash when your order arrives. No advance payment required.</p>
        </section>
      </div>
    </div>
  );
}
