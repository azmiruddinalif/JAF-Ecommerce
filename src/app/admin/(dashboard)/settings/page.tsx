import { getStoreSettings } from "@/lib/data/settings";
import { getPublishedProductOptions } from "@/lib/data/products";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata = { title: "Homepage Content", robots: { index: false } };

export default async function AdminSettingsPage() {
  const [settings, products] = await Promise.all([getStoreSettings(), getPublishedProductOptions()]);

  return (
    <div className="max-w-3xl">
      <h1 className="mb-2 font-display text-3xl">HOMEPAGE CONTENT</h1>
      <p className="mb-8 text-sm text-paper-dim">
        Edit the text and images for every section of the storefront homepage, plus delivery and payment defaults.
      </p>
      <SettingsForm settings={settings} products={products} />
    </div>
  );
}
