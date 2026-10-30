"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from "lucide-react";
import { Input, Textarea, Select, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageInputWithPreview } from "@/components/admin/image-input-preview";
import {
  updateCustomPageAction,
  type CustomPageActionResult,
} from "@/lib/actions/admin-page-actions";
import type {
  CustomPageContent,
  EditablePageKey,
  PageSection,
  PageSlide,
  SectionImagePosition,
} from "@/lib/data/pages";

const EDITABLE_PAGE_KEYS: EditablePageKey[] = [
  "about",
  "shipping-returns",
  "privacy",
  "terms",
];

const initialState: CustomPageActionResult = { success: false, message: "" };

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-ink-border bg-ink-raised/40 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gold">{title}</h2>
          {description && <p className="mt-1 text-xs text-paper-dim">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-5 flex flex-col gap-4">{children}</div>
    </section>
  );
}

function SinglePageEditor({ page: initialPage }: { page: CustomPageContent }) {
  const boundAction = updateCustomPageAction.bind(null, initialPage.key);
  const [state, formAction, isActionPending] = useActionState(boundAction, initialState);
  const [isSubmitTransition, startSubmitTransition] = useTransition();
  const isPending = isActionPending || isSubmitTransition;

  const activePage = state.updatedPage ?? initialPage;

  const [slides, setSlides] = useState<PageSlide[]>(activePage.slides);
  const [sections, setSections] = useState<PageSection[]>(activePage.sections);
  const [prevUpdatedPage, setPrevUpdatedPage] = useState<CustomPageContent | undefined>(
    state.updatedPage
  );

  if (state.updatedPage && state.updatedPage !== prevUpdatedPage) {
    setPrevUpdatedPage(state.updatedPage);
    setSlides(state.updatedPage.slides);
    setSections(state.updatedPage.sections);
  }

  // Slide helpers
  function addSlide() {
    setSlides((prev) => [
      ...prev,
      {
        id: makeId("slide"),
        imageUrl: "",
        imagePublicId: null,
        heading: "",
        subheading: "",
        ctaLabel: "",
        ctaHref: "",
      },
    ]);
  }

  function updateSlide(index: number, patch: Partial<PageSlide>) {
    setSlides((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function removeSlide(index: number) {
    setSlides((prev) => prev.filter((_, i) => i !== index));
  }

  function moveSlide(index: number, dir: -1 | 1) {
    setSlides((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  // Section helpers
  function addSection() {
    setSections((prev) => [
      ...prev,
      {
        id: makeId("sec"),
        heading: "",
        body: "",
        imageUrl: null,
        imagePublicId: null,
        imagePosition: "top",
      },
    ]);
  }

  function updateSection(index: number, patch: Partial<PageSection>) {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function removeSection(index: number) {
    setSections((prev) => prev.filter((_, i) => i !== index));
  }

  function moveSection(index: number, dir: -1 | 1) {
    setSections((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startSubmitTransition(() => {
          formAction(formData);
        });
      }}
      className="flex flex-col gap-6"
    >
      <input type="hidden" name="slidesJson" value={JSON.stringify(slides)} />
      <input type="hidden" name="sectionsJson" value={JSON.stringify(sections)} />

      {state.message && (
        <p
          className={`px-4 py-3 text-sm ${
            state.success
              ? "border border-gold/40 bg-gold/10 text-gold"
              : "border border-danger/40 bg-danger/10 text-danger"
          }`}
        >
          {state.message}
        </p>
      )}

      <SectionCard
        title={`${activePage.label} — Header & Main Content`}
        description="Customize the page heading, optional main picture, and introductory content."
        action={
          <Link
            href={activePage.path}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold hover:underline"
          >
            View {activePage.path} <ExternalLink size={13} />
          </Link>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor={`eyebrow-${activePage.key}`}>Eyebrow (optional)</Label>
            <Input
              id={`eyebrow-${activePage.key}`}
              name="eyebrow"
              defaultValue={activePage.eyebrow}
              placeholder="e.g. About JAF"
            />
          </div>
          <div>
            <Label htmlFor={`title-${activePage.key}`}>Page Heading</Label>
            <Input
              id={`title-${activePage.key}`}
              name="title"
              defaultValue={activePage.title}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor={`bannerImage-${activePage.key}`}>Main Page Picture (optional)</Label>
          <ImageInputWithPreview
            id={`bannerImage-${activePage.key}`}
            name="bannerImage"
            alt={activePage.title}
            currentUrl={activePage.bannerImageUrl}
            removeName="bannerImageRemove"
            wrapperClassName="flex items-center gap-4"
            boxClassName="h-24 w-36"
          />
        </div>

        <div>
          <Label htmlFor={`intro-${activePage.key}`}>
            Main Content / Intro Paragraphs (leave a blank line between paragraphs)
          </Label>
          <Textarea
            id={`intro-${activePage.key}`}
            name="intro"
            rows={7}
            defaultValue={activePage.intro}
            placeholder="Write the main page paragraphs here. You can also add structured sections with pictures below."
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="showBrandStatement" defaultChecked={activePage.showBrandStatement} />
          Show &quot;Brand Statement&quot; block at the bottom of this page
        </label>
      </SectionCard>

      <SectionCard
        title="Page Slider (Optional)"
        description="Add image slides to display an interactive banner slider at the top of this page. Reorder or remove slides anytime."
        action={
          <Button type="button" variant="outline" size="sm" onClick={addSlide}>
            <Plus size={14} /> ADD SLIDE
          </Button>
        }
      >
        {slides.length === 0 ? (
          <p className="text-xs text-paper-dim">
            No slider slides added for this page. Click &quot;+ ADD SLIDE&quot; to create a slider.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {slides.map((slide, i) => (
              <div key={slide.id} className="border border-ink-border bg-ink/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                    Slide {i + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveSlide(i, -1)}
                      disabled={i === 0}
                      aria-label="Move slide up"
                      className="p-1 text-paper-dim hover:text-gold disabled:opacity-30"
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSlide(i, 1)}
                      disabled={i === slides.length - 1}
                      aria-label="Move slide down"
                      className="p-1 text-paper-dim hover:text-gold disabled:opacity-30"
                    >
                      <ArrowDown size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSlide(i)}
                      aria-label="Delete slide"
                      className="p-1 text-paper-dim hover:text-danger"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <Label htmlFor={`slideImage_${slide.id}`}>Slide Picture</Label>
                    <ImageInputWithPreview
                      id={`slideImage_${slide.id}`}
                      name={`slideImage_${slide.id}`}
                      alt={slide.heading || `Slide ${i + 1}`}
                      currentUrl={slide.imageUrl || null}
                      wrapperClassName="flex items-center gap-4"
                      boxClassName="h-20 w-32"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Slide Heading (optional)</Label>
                      <Input
                        value={slide.heading}
                        onChange={(e) => updateSlide(i, { heading: e.target.value })}
                        placeholder="e.g. MATCHDAY HERITAGE"
                      />
                    </div>
                    <div>
                      <Label>Slide Subheading (optional)</Label>
                      <Input
                        value={slide.subheading}
                        onChange={(e) => updateSlide(i, { subheading: e.target.value })}
                        placeholder="Short caption shown over the slide"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Button Label (optional)</Label>
                      <Input
                        value={slide.ctaLabel}
                        onChange={(e) => updateSlide(i, { ctaLabel: e.target.value })}
                        placeholder="e.g. SHOP COLLECTION"
                      />
                    </div>
                    <div>
                      <Label>Button Link URL (optional)</Label>
                      <Input
                        value={slide.ctaHref}
                        onChange={(e) => updateSlide(i, { ctaHref: e.target.value })}
                        placeholder="e.g. /shop"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Custom Content Sections"
        description="Add, reorder, or remove sections on this page. Each section can have its own heading, text content, and optional picture with custom placement."
        action={
          <Button type="button" variant="outline" size="sm" onClick={addSection}>
            <Plus size={14} /> ADD SECTION
          </Button>
        }
      >
        {sections.length === 0 ? (
          <p className="text-xs text-paper-dim">
            No custom sections yet. Click &quot;+ ADD SECTION&quot; to add sections with headings,
            content, and pictures.
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {sections.map((section, i) => (
              <div key={section.id} className="border border-ink-border bg-ink/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                    Section {i + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveSection(i, -1)}
                      disabled={i === 0}
                      aria-label="Move section up"
                      className="p-1 text-paper-dim hover:text-gold disabled:opacity-30"
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(i, 1)}
                      disabled={i === sections.length - 1}
                      aria-label="Move section down"
                      className="p-1 text-paper-dim hover:text-gold disabled:opacity-30"
                    >
                      <ArrowDown size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSection(i)}
                      aria-label="Delete section"
                      className="p-1 text-paper-dim hover:text-danger"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <Label>Section Heading</Label>
                    <Input
                      value={section.heading}
                      onChange={(e) => updateSection(i, { heading: e.target.value })}
                      placeholder="e.g. Delivery, Exchanges, Our Craftsmanship..."
                    />
                  </div>

                  <div>
                    <Label>Section Content (leave a blank line between paragraphs)</Label>
                    <Textarea
                      rows={4}
                      value={section.body}
                      onChange={(e) => updateSection(i, { body: e.target.value })}
                      placeholder="Write the content for this section..."
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <Label htmlFor={`sectionImage_${section.id}`}>
                        Section Picture (optional)
                      </Label>
                      <ImageInputWithPreview
                        id={`sectionImage_${section.id}`}
                        name={`sectionImage_${section.id}`}
                        alt={section.heading || `Section ${i + 1}`}
                        currentUrl={section.imageUrl}
                        removeName={`sectionImageRemove_${section.id}`}
                        wrapperClassName="flex items-center gap-4"
                        boxClassName="h-20 w-28"
                      />
                    </div>
                    <div>
                      <Label>Picture Position</Label>
                      <Select
                        value={section.imagePosition}
                        onChange={(e) =>
                          updateSection(i, {
                            imagePosition: e.target.value as SectionImagePosition,
                          })
                        }
                      >
                        <option value="top">Above Text</option>
                        <option value="bottom">Below Text</option>
                        <option value="left">Left of Text</option>
                        <option value="right">Right of Text</option>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="SEO Metadata"
        description="Search engine title and description for this page."
      >
        <div>
          <Label htmlFor={`seoTitle-${activePage.key}`}>SEO Title</Label>
          <Input
            id={`seoTitle-${activePage.key}`}
            name="seoTitle"
            defaultValue={activePage.seoTitle}
          />
        </div>
        <div>
          <Label htmlFor={`seoDescription-${activePage.key}`}>SEO Description</Label>
          <Textarea
            id={`seoDescription-${activePage.key}`}
            name="seoDescription"
            rows={2}
            defaultValue={activePage.seoDescription}
          />
        </div>
      </SectionCard>

      <Button type="submit" variant="primary" size="lg" disabled={isPending} className="self-start">
        {isPending ? "SAVING..." : `SAVE ${activePage.label.toUpperCase()}`}
      </Button>
    </form>
  );
}

export function PagesManager({
  pages,
}: {
  pages: Record<EditablePageKey, CustomPageContent>;
}) {
  const [selectedKey, setSelectedKey] = useState<EditablePageKey>("about");

  return (
    <div className="max-w-4xl">
      <h1 className="mb-2 font-display text-3xl">SITE PAGES</h1>
      <p className="mb-6 text-sm text-paper-dim">
        Edit the About, Shipping &amp; Returns, Privacy Policy, and Terms of Service pages. Add
        pictures, slider banners, and custom sections for any page.
      </p>

      <div className="mb-8 flex flex-wrap gap-2 border-b border-ink-border pb-4">
        {EDITABLE_PAGE_KEYS.map((key) => {
          const item = pages[key];
          const isActive = key === selectedKey;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedKey(key)}
              className={`border px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors ${
                isActive
                  ? "border-gold-bright bg-gold-bright text-ink"
                  : "border-ink-border bg-ink-raised text-paper hover:border-gold hover:text-gold"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <SinglePageEditor key={selectedKey} page={pages[selectedKey]} />
    </div>
  );
}

