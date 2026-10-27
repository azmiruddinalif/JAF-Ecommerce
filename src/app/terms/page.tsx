import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-8 font-display text-4xl">TERMS OF SERVICE</h1>
      <div className="space-y-5 text-sm leading-relaxed text-paper/80">
        <p>
          By placing an order with JAF, you agree to provide accurate delivery information and to
          be available to receive your order at the address provided.
        </p>
        <p>
          Product prices, availability and discounts are subject to change without notice. Orders
          are confirmed once payment on delivery is accepted.
        </p>
        <p>All product imagery is representative; minor variations in color may occur.</p>
      </div>
    </div>
  );
}
