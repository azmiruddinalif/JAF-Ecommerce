import { Suspense } from "react";
import type { Metadata } from "next";
import { BrandStatement, BrandStatementSkeleton } from "@/components/home/brand-statement";

export const metadata: Metadata = {
  title: "About JAF",
  description: "The story behind JAF — premium football and sports fashion jerseys.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold">About JAF</p>
      <h1 className="mb-8 font-display text-4xl sm:text-5xl">THE BRAND</h1>
      <div className="space-y-5 text-sm leading-relaxed text-paper/80 sm:text-base">
        <p>
          JAF started with a simple frustration: most football jerseys sold as fashion feel like
          an afterthought. We set out to build a brand that treats the jersey with the same
          respect fashion houses give a tailored jacket — considered fit, honest materials, and
          design that holds up on the street as well as it does on matchday.
        </p>
        <p>
          Every collection we release moves between two worlds: the discipline of club football
          and the self-expression of streetwear. That tension is the whole idea.
        </p>
      </div>
      <Suspense fallback={<BrandStatementSkeleton />}>
        <BrandStatement />
      </Suspense>
    </div>
  );
}
