import { Suspense } from "react";
import type { Metadata } from "next";
import { getCustomPage } from "@/lib/data/pages";
import { CustomPageRenderer } from "@/components/pages/custom-page-renderer";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCustomPage("shipping-returns");
  return {
    title: page.seoTitle,
    description: page.seoDescription,
    alternates: { canonical: "/shipping-returns" },
    openGraph: {
      title: `${page.seoTitle} | JAF`,
      description: page.seoDescription,
      images: page.bannerImageUrl ? [{ url: page.bannerImageUrl, alt: page.title }] : undefined,
    },
  };
}

async function ShippingReturnsContent() {
  const page = await getCustomPage("shipping-returns");
  return <CustomPageRenderer page={page} />;
}

export default function ShippingReturnsPage() {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-3xl animate-pulse px-4 py-16" />}>
      <ShippingReturnsContent />
    </Suspense>
  );
}
