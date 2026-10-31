import { RefreshCw, ShieldCheck, Truck } from "lucide-react";

const TRUST_CARDS = [
  {
    icon: ShieldCheck,
    title: "100% Authentic Kits",
    description:
      "Player & fan version performance mesh with crisp embroidery & official club crests.",
  },
  {
    icon: Truck,
    title: "Cash On Delivery",
    description:
      "Doorstep delivery across all 64 districts in Bangladesh with open-box verification.",
  },
  {
    icon: RefreshCw,
    title: "Size Exchange Guarantee",
    description:
      "Wrong fit? Seamless exchange support directly through our WhatsApp hotline.",
  },
];

export function TrustStrip() {
  return (
    <section className="border-y border-ink-border bg-ink-raised/30 py-6 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3 sm:gap-5">
          {TRUST_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="flex items-start gap-3.5 border border-ink-border bg-ink p-4 sm:p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-gold-bright/25 bg-gold-bright/10 text-gold-bright">
                  <Icon size={20} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-paper">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-paper-dim">
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
    <div className="h-24 border-y border-ink-border bg-ink-raised/20 animate-pulse" />
  );
}
