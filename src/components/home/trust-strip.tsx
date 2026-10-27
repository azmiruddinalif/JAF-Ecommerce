import { BadgeCheck, Repeat, ShieldCheck, Truck, Gem } from "lucide-react";
import { getStoreSettings } from "@/lib/data/settings";

const icons = [Gem, Truck, ShieldCheck, Repeat, BadgeCheck];

export async function TrustStrip() {
  const settings = await getStoreSettings();

  return (
    <section className="border-y border-ink-border bg-ink-raised/50">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-5 sm:px-6 lg:px-8">
        {settings.trustStripItems.map((item, i) => {
          const Icon = icons[i % icons.length];
          return (
            <div key={item.label} className="flex flex-col items-center gap-2 text-center">
              <Icon className="text-gold" size={22} strokeWidth={1.5} />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-paper-dim">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function TrustStripSkeleton() {
  return <div className="h-28 border-y border-ink-border bg-ink-raised/50" />;
}
