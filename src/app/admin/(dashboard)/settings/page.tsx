import { Suspense } from "react";
import Link from "next/link";
import { getStoreSettings } from "@/lib/data/settings";
import { getPublishedProductOptions } from "@/lib/data/products";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata = { title: "Homepage Content", robots: { index: false } };
export const instant = false;

async function SettingsContent() {
  const [settings, products] = await Promise.all([
    getStoreSettings(),
    getPublishedProductOptions(),
  ]);

  return <SettingsForm settings={settings} products={products} />;
}

export default function AdminSettingsPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">HOMEPAGE CONTENT</h1>
        <Link
          href="/admin/pages"
          className="border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold hover:border-gold-bright hover:bg-gold-bright hover:text-ink"
        >
          Edit About, Shipping, Privacy &amp; Terms Pages →
        </Link>
      </div>
      <p className="mb-8 text-sm text-paper-dim">
        Edit the text and images for every section of the storefront homepage, plus delivery and payment defaults.
      </p>
      <Suspense fallback={<div className="h-96 animate-pulse bg-ink-raised" />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}
