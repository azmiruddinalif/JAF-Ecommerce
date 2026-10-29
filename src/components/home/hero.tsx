import { getStoreSettings } from "@/lib/data/settings";
import { getHeroShowcaseProducts } from "@/lib/data/products";
import { HeroInteractive } from "@/components/home/hero-interactive";

export async function Hero() {
  const settings = await getStoreSettings();
  const showcase = await getHeroShowcaseProducts(settings.heroShowcaseProductIds, 3);

  const slides = showcase
    .map((product, i) => {
      const customImageUrl = settings.heroShowcaseImageUrls[i] ?? null;
      const imageUrl = customImageUrl ?? product?.images[0]?.secureUrl ?? null;
      // A slide needs an image to show at all. A linked product is what adds
      // the name/price card — an admin-uploaded image with no (or an
      // unresolved) product still shows, just without that card, rather than
      // being silently dropped.
      if (!imageUrl) return null;
      return product
        ? {
            id: product.id,
            slug: product.slug,
            imageUrl,
            // Short banner caption if the admin set one, else the full
            // product name — price always comes straight from the product.
            name: product.heroBannerLabel || product.name,
            priceCents: product.discountPriceCents ?? product.basePriceCents,
          }
        : { id: `custom-${i}`, slug: null, imageUrl, name: null, priceCents: null };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);

  return (
    <HeroInteractive
      headline={settings.heroHeadline}
      subheadline={settings.heroSubheadline}
      fallbackImageUrl={settings.heroImageUrl}
      slides={slides}
      heroConfig={settings.heroConfig}
    />
  );
}

export function HeroSkeleton() {
  return <div className="h-105 animate-pulse bg-ink-raised sm:h-130 lg:h-160" />;
}
