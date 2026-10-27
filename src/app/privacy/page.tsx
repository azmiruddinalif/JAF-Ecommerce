import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-8 font-display text-4xl">PRIVACY POLICY</h1>
      <div className="space-y-5 text-sm leading-relaxed text-paper/80">
        <p>
          We collect only the information needed to process your order: name, phone number,
          email (optional) and delivery address. This information is used solely to fulfill your
          order and is never sold to third parties.
        </p>
        <p>
          Payment is collected in cash on delivery, so no card details are ever transmitted to or
          stored by JAF.
        </p>
        <p>We use cookies only to keep your shopping cart working across visits.</p>
      </div>
    </div>
  );
}
