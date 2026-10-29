import { Suspense } from "react";
import type { Metadata } from "next";
import { getCustomPage } from "@/lib/data/pages";
import { CustomPageRenderer } from "@/components/pages/custom-page-renderer";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCustomPage("about");
  return {
    title: page.seoTitle,
    description: page.seoDescription,
    alternates: { canonical: "/about" },
    openGraph: {
      title: `${page.seoTitle} | JAF`,
      description: page.seoDescription,
      images: page.bannerImageUrl ? [{ url: page.bannerImageUrl, alt: page.title }] : undefined,
    },
  };
}

async function AboutContent() {
  const page = await getCustomPage("about");

  return (
    <CustomPageRenderer
      page={page}
      maxWidthClass="max-w-4xl"
      headingClass="mb-8 font-display text-4xl sm:text-5xl"
      textClass="text-sm leading-relaxed text-paper/80 sm:text-base"
    />
  );
}

export default function AboutPage() {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-4xl animate-pulse px-4 py-16" />}>
      <AboutContent />
    </Suspense>
  );
}
