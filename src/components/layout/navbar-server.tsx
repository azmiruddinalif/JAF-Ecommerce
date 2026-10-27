import { getActiveCategories } from "@/lib/data/categories";
import { getCartView } from "@/lib/cart/read";
import { getStoreSettings } from "@/lib/data/settings";
import { NavbarClient } from "./navbar-client";

export async function NavbarServer() {
  const [categories, cart, settings] = await Promise.all([
    getActiveCategories(),
    getCartView(),
    getStoreSettings(),
  ]);

  return (
    <NavbarClient
      categories={categories.map((c) => ({ name: c.name, slug: c.slug }))}
      cart={cart}
      deliveryFeeCents={settings.deliveryFeeCents}
      freeDeliveryThresholdCents={settings.freeDeliveryThresholdCents}
    />
  );
}

export function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-30 border-b border-ink-border bg-ink/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <span className="font-display text-2xl text-paper">JAF</span>
        <div className="h-5 w-24 animate-pulse bg-ink-raised" />
      </div>
    </header>
  );
}
