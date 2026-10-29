import { Suspense } from "react";
import type { Metadata } from "next";
import { Hero, HeroSkeleton } from "@/components/home/hero";
import { TrustStrip, TrustStripSkeleton } from "@/components/home/trust-strip";
import { CategoryGrid, CategoryGridSkeleton } from "@/components/home/category-grid";
import { FeaturedProducts, NewArrivals, ProductRailSkeleton } from "@/components/home/product-rail";
import { Editorial, EditorialSkeleton } from "@/components/home/editorial";
import { BrandStatement, BrandStatementSkeleton } from "@/components/home/brand-statement";
import { FinalCta, FinalCtaSkeleton } from "@/components/home/final-cta";

export const metadata: Metadata = {
  title: "JAF — Buy Authentic Football Jerseys, Club Kits & Retro Shirts Online",
  description:
    "Discover premium club football jerseys, national team kits, and classic retro soccer shirts at JAF. Breathable fabrics, authentic matchday fits, and fast Cash on Delivery across Bangladesh.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<HeroSkeleton />}>
        <Hero />
      </Suspense>
      <Suspense fallback={<TrustStripSkeleton />}>
        <TrustStrip />
      </Suspense>
      <Suspense fallback={<CategoryGridSkeleton />}>
        <CategoryGrid />
      </Suspense>
      <Suspense fallback={<ProductRailSkeleton />}>
        <FeaturedProducts />
      </Suspense>
      <Suspense fallback={<ProductRailSkeleton />}>
        <NewArrivals />
      </Suspense>
      <Suspense fallback={<EditorialSkeleton />}>
        <Editorial />
      </Suspense>
      <Suspense fallback={<BrandStatementSkeleton />}>
        <BrandStatement />
      </Suspense>
      <Suspense fallback={<FinalCtaSkeleton />}>
        <FinalCta />
      </Suspense>
    </>
  );
}
