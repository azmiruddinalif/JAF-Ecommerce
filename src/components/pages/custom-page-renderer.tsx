import { Suspense } from "react";
import Image from "next/image";
import { BrandStatement, BrandStatementSkeleton } from "@/components/home/brand-statement";
import { PageSlider } from "@/components/pages/page-slider";
import type { CustomPageContent, PageSection } from "@/lib/data/pages";

function splitParagraphs(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function SectionBlock({ section }: { section: PageSection }) {
  const paragraphs = splitParagraphs(section.body);
  const hasImage = Boolean(section.imageUrl);

  const textBlock = (
    <div className="space-y-3">
      {section.heading && <h2 className="mb-2 font-semibold text-paper">{section.heading}</h2>}
      {paragraphs.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );

  if (!hasImage || !section.imageUrl) {
    return <section>{textBlock}</section>;
  }

  const imageBlock = (
    <div className="relative aspect-16/10 w-full overflow-hidden border border-ink-border bg-ink-raised">
      <Image
        src={section.imageUrl}
        alt={section.heading || "Section image"}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover"
      />
    </div>
  );

  if (section.imagePosition === "left") {
    return (
      <section className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2">
        {imageBlock}
        {textBlock}
      </section>
    );
  }

  if (section.imagePosition === "right") {
    return (
      <section className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2">
        {textBlock}
        {imageBlock}
      </section>
    );
  }

  if (section.imagePosition === "bottom") {
    return (
      <section className="space-y-4">
        {textBlock}
        {imageBlock}
      </section>
    );
  }

  // Default: "top"
  return (
    <section className="space-y-4">
      {imageBlock}
      {textBlock}
    </section>
  );
}

export function CustomPageRenderer({
  page,
  maxWidthClass = "max-w-3xl",
  headingClass = "mb-8 font-display text-4xl",
  textClass = "text-sm leading-relaxed text-paper/80",
}: {
  page: CustomPageContent;
  maxWidthClass?: string;
  headingClass?: string;
  textClass?: string;
}) {
  const introParagraphs = splitParagraphs(page.intro);

  return (
    <div className={`mx-auto ${maxWidthClass} px-4 py-16 sm:px-6 lg:px-8`}>
      {page.eyebrow && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold">
          {page.eyebrow}
        </p>
      )}
      <h1 className={headingClass}>{page.title}</h1>

      {page.slides.length > 0 && <PageSlider slides={page.slides} />}

      {page.bannerImageUrl && (
        <div className="relative mb-8 aspect-16/9 w-full overflow-hidden border border-ink-border bg-ink-raised">
          <Image
            src={page.bannerImageUrl}
            alt={page.title}
            fill
            sizes="(max-width: 1024px) 100vw, 896px"
            className="object-cover"
            priority
          />
        </div>
      )}

      {introParagraphs.length > 0 && (
        <div className={`space-y-5 ${textClass}`}>
          {introParagraphs.map((paragraph, i) => (
            <p key={i} className="whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </div>
      )}

      {page.sections.length > 0 && (
        <div
          className={`${introParagraphs.length > 0 ? "mt-8 " : ""}space-y-6 ${textClass}`}
        >
          {page.sections.map((section) => (
            <SectionBlock key={section.id} section={section} />
          ))}
        </div>
      )}

      {page.showBrandStatement && (
        <Suspense fallback={<BrandStatementSkeleton />}>
          <BrandStatement />
        </Suspense>
      )}
    </div>
  );
}

