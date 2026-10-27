import { Suspense } from "react";
import { Hero, HeroSkeleton } from "@/components/home/hero";
import { TrustStrip, TrustStripSkeleton } from "@/components/home/trust-strip";
import { CategoryGrid, CategoryGridSkeleton } from "@/components/home/category-grid";
import { FeaturedProducts, NewArrivals, ProductRailSkeleton } from "@/components/home/product-rail";
import { Editorial, EditorialSkeleton } from "@/components/home/editorial";
import { BrandStatement, BrandStatementSkeleton } from "@/components/home/brand-statement";
import { FinalCta, FinalCtaSkeleton } from "@/components/home/final-cta";

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
