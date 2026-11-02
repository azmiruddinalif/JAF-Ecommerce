import {
  Headphones,
  Package,
  RefreshCw,
  ShieldCheck,
  Star,
  Truck,
  Zap,
} from "lucide-react";
import { getStoreSettings } from "@/lib/data/settings";
import {
  DEFAULT_TRUST_CARDS,
  getTrustGridColsClass,
  type TrustCardIcon,
  type TrustStripCard,
} from "@/lib/data/settings-shared";

const ICON_MAP: Record<TrustCardIcon, typeof ShieldCheck> = {
  shield: ShieldCheck,
  truck: Truck,
  refresh: RefreshCw,
  headphones: Headphones,
  zap: Zap,
  star: Star,
  package: Package,
};

export async function TrustStrip() {
  const settings = await getStoreSettings();
  const cards: TrustStripCard[] =
    settings.trustCards && settings.trustCards.length > 0
      ? settings.trustCards
      : DEFAULT_TRUST_CARDS;

  const gridClass = getTrustGridColsClass(cards.length);

  return (
    <section className="bg-white py-6 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`grid gap-3.5 sm:gap-4 lg:gap-5 ${gridClass}`}>
          {cards.map((card, idx) => {
            const Icon = ICON_MAP[card.icon] || ShieldCheck;
            return (
              <div
                key={card.id || idx}
                className="flex items-start gap-3.5 border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs hover:border-amber-400/40 transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none border border-amber-400/30 bg-amber-400/10 text-amber-500">
                  <Icon size={20} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {card.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function TrustStripSkeleton() {
  return (
    <div className="h-24 bg-white animate-pulse" />
  );
}
