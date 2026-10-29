import { Suspense } from "react";
import type { Metadata } from "next";
import { getCustomPage } from "@/lib/data/pages";
import { CustomPageRenderer } from "@/components/pages/custom-page-renderer";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCustomPage("terms");
  return {
    title: page.seoTitle,
    description: page.seoDescription,
    alternates: { canonical: "/terms" },
    openGraph: {
      title: `${page.seoTitle} | JAF`,
      description: page.seoDescription,
      images: page.bannerImageUrl ? [{ url: page.bannerImageUrl, alt: page.title }] : undefined,
    },
  };
}

async function TermsContent() {
  const page = await getCustomPage("terms");
  return <CustomPageRenderer page={page} />;
}

export default function TermsPage() {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-3xl animate-pulse px-4 py-16" />}>
      <TermsContent />
    </Suspense>
  );
}
