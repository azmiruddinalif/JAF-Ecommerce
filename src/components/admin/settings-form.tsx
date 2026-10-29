"use client";

import { useActionState, useState } from "react";
import { ArrowDown, ArrowUp, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageInputWithPreview } from "@/components/admin/image-input-preview";
import { centsToUnits } from "@/lib/money";
import {
  updateStoreSettingsAction,
  type SettingsActionResult,
} from "@/lib/actions/admin-settings-actions";
import type {
  HeroBannerMode,
  HeroButtonConfig,
  HeroButtonIcon,
  HeroPromoSlide,
  StoreSettingsView,
} from "@/lib/data/settings";

const initialState: SettingsActionResult = { success: false, message: "" };

const BUTTON_ICON_OPTIONS: { value: HeroButtonIcon; label: string }[] = [
  { value: "arrow-right", label: "Arrow Right (→)" },
  { value: "none", label: "No Icon" },
  { value: "shopping-bag", label: "Shopping Bag" },
  { value: "tag", label: "Offer Tag" },
  { value: "sparkles", label: "Sparkles" },
  { value: "flame", label: "Flame / Hot" },
  { value: "zap", label: "Lightning / Flash" },
];

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-ink-border bg-ink-raised/40 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-gold">{title}</h2>
      {description && <p className="mt-1 text-xs text-paper-dim">{description}</p>}
      <div className="mt-5 flex flex-col gap-4">{children}</div>
    </section>
  );
}

function ImageField({
  name,
  label,
  currentUrl,
  compact = false,
}: {
  name: string;
  label: string;
  currentUrl: string | null;
  compact?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <ImageInputWithPreview
        id={name}
        name={name}
        alt={label}
        currentUrl={currentUrl}
        removeName={`${name}Remove`}
        wrapperClassName={compact ? "flex flex-col gap-2" : "flex items-center gap-4"}
        boxClassName={compact ? "aspect-3/4 w-full" : "h-20 w-28"}
      />
    </div>
  );
}

function ColorPickerField({
  name,
  label,
  value,
  defaultHex,
  onChange,
}: {
  name?: string;
  label: string;
  value: string;
  defaultHex: string;
  onChange: (next: string) => void;
}) {
  const pickerVal = /^#[0-9a-fA-F]{6}$/.test(value) ? value : defaultHex;
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={pickerVal}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} color picker`}
          className="h-9 w-10 shrink-0 cursor-pointer border border-ink-border bg-ink p-0.5"
        />
        <Input
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Default (${defaultHex})`}
        />
      </div>
    </div>
  );
}

export function SettingsForm({
  settings,
  products,
}: {
  settings: StoreSettingsView;
  products: { id: string; name: string; sku: string }[];
}) {
  const [state, formAction, isPending] = useActionState(updateStoreSettingsAction, initialState);
  const [slot1, slot2, slot3] = settings.heroShowcaseProductIds;

  const hc = settings.heroConfig;
  const [heroMode, setHeroMode] = useState<HeroBannerMode>(hc.mode);
  const [bgColor, setBgColor] = useState(hc.bgColor);
  const [eyebrowColor, setEyebrowColor] = useState(hc.eyebrowColor);
  const [textColor, setTextColor] = useState(hc.textColor);
  const [accentColor, setAccentColor] = useState(hc.accentColor);
  const [subtextColor, setSubtextColor] = useState(hc.subtextColor);
  const [imageGlowColor, setImageGlowColor] = useState(hc.imageGlowColor);
  const [heroButtons, setHeroButtons] = useState<HeroButtonConfig[]>(hc.buttons);
  const [promoSlides, setPromoSlides] = useState<HeroPromoSlide[]>(hc.promoSlides);

  function resetColors() {
    setBgColor("");
    setEyebrowColor("");
    setTextColor("");
    setAccentColor("");
    setSubtextColor("");
    setImageGlowColor("");
  }

  // Hero button helpers
  function addHeroButton() {
    setHeroButtons((prev) => [
      ...prev,
      {
        id: makeId("btn"),
        label: "EXPLORE OFFERS",
        href: "/shop?sort=discount",
        variant: "outline",
        icon: "none",
        bgColor: "",
        textColor: "",
      },
    ]);
  }

  function updateHeroButton(index: number, patch: Partial<HeroButtonConfig>) {
    setHeroButtons((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  }

  function removeHeroButton(index: number) {
    setHeroButtons((prev) => prev.filter((_, i) => i !== index));
  }

  // Promo slide helpers
  function addPromoSlide() {
    setPromoSlides((prev) => [
      ...prev,
      {
        id: makeId("promo"),
        imageUrl: "",
        imagePublicId: null,
        eyebrow: "LIMITED TIME OFFER",
        headline: settings.heroHeadline,
        subheadline: settings.heroSubheadline,
        linkHref: "/shop",
        textAlign: "left",
        overlayOpacity: 45,
        eyebrowColor: "",
        textColor: "",
        subtextColor: "",
        accentColor: "",
        buttons: [
          {
            id: makeId("slide-btn"),
            label: "SHOP OFFER",
            href: "/shop",
            variant: "primary",
            icon: "arrow-right",
            bgColor: "",
            textColor: "",
          },
        ],
      },
    ]);
  }

  function updatePromoSlide(index: number, patch: Partial<HeroPromoSlide>) {
    setPromoSlides((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function removePromoSlide(index: number) {
    setPromoSlides((prev) => prev.filter((_, i) => i !== index));
  }

  function movePromoSlide(index: number, dir: -1 | 1) {
    setPromoSlides((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  function addSlideButton(slideIndex: number) {
    setPromoSlides((prev) =>
      prev.map((s, i) =>
        i === slideIndex
          ? {
              ...s,
              buttons: [
                ...s.buttons,
                {
                  id: makeId("sbtn"),
                  label: "SHOP NOW",
                  href: "/shop",
                  variant: "primary",
                  icon: "none",
                  bgColor: "",
                  textColor: "",
                },
              ],
            }
          : s
      )
    );
  }

  function updateSlideButton(
    slideIndex: number,
    btnIndex: number,
    patch: Partial<HeroButtonConfig>
  ) {
    setPromoSlides((prev) =>
      prev.map((s, i) =>
        i === slideIndex
          ? {
              ...s,
              buttons: s.buttons.map((b, bi) => (bi === btnIndex ? { ...b, ...patch } : b)),
            }
          : s
      )
    );
  }

  function removeSlideButton(slideIndex: number, btnIndex: number) {
    setPromoSlides((prev) =>
      prev.map((s, i) =>
        i === slideIndex
          ? { ...s, buttons: s.buttons.filter((_, bi) => bi !== btnIndex) }
          : s
      )
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="heroButtonsJson" value={JSON.stringify(heroButtons)} />
      <input type="hidden" name="heroPromoSlidesJson" value={JSON.stringify(promoSlides)} />

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

      <SectionCard title="Announcement Bar" description="The thin banner above the navbar.">
        <div>
          <Label htmlFor="announcementText">Text</Label>
          <Input id="announcementText" name="announcementText" defaultValue={settings.announcementText} />
          <FieldError message={state.fieldErrors?.announcementText} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="announcementEnabled" defaultChecked={settings.announcementEnabled} />
          Show announcement bar
        </label>
      </SectionCard>

      <SectionCard
        title="Hero / Banner Section"
        description="Keep the signature split JAF hero layout (with customizable colors, title, buttons, icons, and product showcase) or switch to a Full-Width Promotional / Offer Banner Slider."
      >
        <div>
          <Label htmlFor="heroMode">Banner Layout Mode</Label>
          <Select
            id="heroMode"
            name="heroMode"
            value={heroMode}
            onChange={(e) => setHeroMode(e.target.value as HeroBannerMode)}
          >
            <option value="default">
              Default Split Layout (Left Text &amp; Buttons + Right Product/Image Showcase)
            </option>
            <option value="full-slider">
              Full-Width Promotional / Offer Banner Slider (Direct Image Slides)
            </option>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="heroEyebrow">Eyebrow Text</Label>
            <Input
              id="heroEyebrow"
              name="heroEyebrow"
              defaultValue={hc.eyebrow}
              placeholder="Authentic Football Jerseys"
            />
          </div>
          <div>
            <Label htmlFor="heroAccentWord">Highlighted Word(s) in Title (comma separated)</Label>
            <Input
              id="heroAccentWord"
              name="heroAccentWord"
              defaultValue={hc.accentWord}
              placeholder="fashion"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="heroHeadline">Banner Title / Headline</Label>
          <Input id="heroHeadline" name="heroHeadline" defaultValue={settings.heroHeadline} />
          <FieldError message={state.fieldErrors?.heroHeadline} />
        </div>

        <div>
          <Label htmlFor="heroSubheadline">Subheadline</Label>
          <Textarea
            id="heroSubheadline"
            name="heroSubheadline"
            rows={2}
            defaultValue={settings.heroSubheadline}
          />
          <FieldError message={state.fieldErrors?.heroSubheadline} />
        </div>

        {/* Banner & Text Colors */}
        <div className="border border-ink-border bg-ink/40 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                Banner Text &amp; Background Colors
              </p>
              <p className="text-[11px] text-paper-dim">
                Customize the color of every text element and background, or click Reset to keep the
                default JAF dark ink &amp; gold palette.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={resetColors}>
              <RotateCcw size={13} /> Reset Default Colors
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ColorPickerField
              name="heroTextColor"
              label="Title / Headline Text Color"
              value={textColor}
              defaultHex="#f5f2eb"
              onChange={setTextColor}
            />
            <ColorPickerField
              name="heroAccentColor"
              label="Highlighted Word / Accent Color"
              value={accentColor}
              defaultHex="#f0c419"
              onChange={setAccentColor}
            />
            <ColorPickerField
              name="heroSubtextColor"
              label="Subheadline Text Color"
              value={subtextColor}
              defaultHex="#9a968e"
              onChange={setSubtextColor}
            />
            <ColorPickerField
              name="heroEyebrowColor"
              label="Eyebrow Text Color"
              value={eyebrowColor}
              defaultHex="#9a968e"
              onChange={setEyebrowColor}
            />
            <ColorPickerField
              name="heroBgColor"
              label="Banner Background Color"
              value={bgColor}
              defaultHex="#0b0b0b"
              onChange={setBgColor}
            />
            <ColorPickerField
              name="heroImageGlowColor"
              label="Image Backdrop Glow"
              value={imageGlowColor}
              defaultHex="#2a2a2a"
              onChange={setImageGlowColor}
            />
          </div>
        </div>

        {/* Banner Buttons */}
        <div className="border border-ink-border bg-ink/40 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                Banner Buttons (Text, Icon &amp; Colors)
              </p>
              <p className="text-[11px] text-paper-dim">
                Edit the main CTA button or add extra buttons. Choose whether to show an icon or
                No Icon, and customize button background and text colors.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addHeroButton}>
              <Plus size={14} /> ADD BUTTON
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            {heroButtons.map((btn, i) => (
              <div
                key={btn.id}
                className="flex flex-col gap-3 border border-ink-border bg-ink p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gold">
                    Button {i + 1}
                  </span>
                  {heroButtons.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeHeroButton(i)}
                      aria-label="Remove button"
                      className="p-1 text-paper-dim hover:text-danger"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <div>
                    <Label>Button Label</Label>
                    <Input
                      value={btn.label}
                      onChange={(e) => updateHeroButton(i, { label: e.target.value })}
                      placeholder="SHOP NOW"
                    />
                  </div>
                  <div>
                    <Label>Link URL</Label>
                    <Input
                      value={btn.href}
                      onChange={(e) => updateHeroButton(i, { href: e.target.value })}
                      placeholder="/shop"
                    />
                  </div>
                  <div>
                    <Label>Button Icon</Label>
                    <Select
                      value={btn.icon ?? (i === 0 ? "arrow-right" : "none")}
                      onChange={(e) =>
                        updateHeroButton(i, { icon: e.target.value as HeroButtonIcon })
                      }
                    >
                      {BUTTON_ICON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Button Style</Label>
                    <Select
                      value={btn.variant}
                      onChange={(e) =>
                        updateHeroButton(i, {
                          variant: e.target.value as HeroButtonConfig["variant"],
                        })
                      }
                    >
                      <option value="primary">Primary Gold</option>
                      <option value="outline">Outline</option>
                      <option value="secondary">Secondary</option>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ColorPickerField
                    label="Button Background Color (optional)"
                    value={btn.bgColor ?? ""}
                    defaultHex="#f0c419"
                    onChange={(val) => updateHeroButton(i, { bgColor: val })}
                  />
                  <ColorPickerField
                    label="Button Text Color (optional)"
                    value={btn.textColor ?? ""}
                    defaultHex="#0b0b0b"
                    onChange={(val) => updateHeroButton(i, { textColor: val })}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Default Split Showcase Controls */}
        <div className="border border-ink-border bg-ink/40 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gold">
            Default Split Layout — Showcase Images &amp; Products (3 Slots)
          </p>
          <p className="mb-4 text-xs text-paper-dim">
            Used when Banner Layout Mode is set to &quot;Default Split Layout&quot;. Each slide can
            point at a product (or &quot;Auto&quot;) and/or use a custom uploaded image.
          </p>
          <div className="mb-4">
            <ImageField
              name="heroImage"
              label="Fallback Background Image"
              currentUrl={settings.heroImageUrl}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                productField: "heroProduct1",
                imageField: "heroShowcase1Image",
                productId: slot1,
                imageUrl: settings.heroShowcaseImageUrls[0],
              },
              {
                productField: "heroProduct2",
                imageField: "heroShowcase2Image",
                productId: slot2,
                imageUrl: settings.heroShowcaseImageUrls[1],
              },
              {
                productField: "heroProduct3",
                imageField: "heroShowcase3Image",
                productId: slot3,
                imageUrl: settings.heroShowcaseImageUrls[2],
              },
            ].map((slot, i) => (
              <div key={slot.productField} className="border border-ink-border bg-ink p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-paper-dim">
                  Slide {i + 1}
                </p>
                <Select name={slot.productField} defaultValue={slot.productId ?? ""} className="mb-3">
                  <option value="">Auto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </Select>
                <ImageField
                  name={slot.imageField}
                  label="Custom image (optional)"
                  currentUrl={slot.imageUrl}
                  compact
                />
              </div>
            ))}
          </div>
        </div>

        {/* Full-Width Promotional / Offer Banner Slides */}
        <div className="border border-ink-border bg-ink/40 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                Full-Width Offer / Promotional Banner Slides
              </p>
              <p className="text-[11px] text-paper-dim">
                Used when Banner Layout Mode is set to &quot;Full-Width Promotional / Offer Banner
                Slider&quot;. Upload direct promotional banner images, or add custom titles, text
                colors, and buttons with icons per slide.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addPromoSlide}>
              <Plus size={14} /> ADD OFFER SLIDE
            </Button>
          </div>

          {promoSlides.length === 0 ? (
            <p className="text-xs text-paper-dim">
              No full-width offer slides added yet. Click &quot;+ ADD OFFER SLIDE&quot; to upload
              promotional banners.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {promoSlides.map((slide, i) => (
                <div key={slide.id} className="border border-ink-border bg-ink p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                      Offer Banner Slide {i + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => movePromoSlide(i, -1)}
                        disabled={i === 0}
                        aria-label="Move slide up"
                        className="p-1 text-paper-dim hover:text-gold disabled:opacity-30"
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => movePromoSlide(i, 1)}
                        disabled={i === promoSlides.length - 1}
                        aria-label="Move slide down"
                        className="p-1 text-paper-dim hover:text-gold disabled:opacity-30"
                      >
                        <ArrowDown size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removePromoSlide(i)}
                        aria-label="Delete slide"
                        className="p-1 text-paper-dim hover:text-danger"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div>
                      <Label htmlFor={`promoSlideImage_${slide.id}`}>Banner Image</Label>
                      <ImageInputWithPreview
                        id={`promoSlideImage_${slide.id}`}
                        name={`promoSlideImage_${slide.id}`}
                        alt={slide.headline || `Offer slide ${i + 1}`}
                        currentUrl={slide.imageUrl || null}
                        wrapperClassName="flex items-center gap-4"
                        boxClassName="h-24 w-40"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <Label>Display Style</Label>
                        <Select
                          value={slide.textAlign}
                          onChange={(e) =>
                            updatePromoSlide(i, {
                              textAlign: e.target.value as HeroPromoSlide["textAlign"],
                            })
                          }
                        >
                          <option value="none">Direct Image Only (Clickable Offer Graphic)</option>
                          <option value="left">Left Text &amp; Buttons Overlay</option>
                          <option value="center">Centered Text &amp; Buttons Overlay</option>
                        </Select>
                      </div>
                      <div>
                        <Label>Banner Click Link URL</Label>
                        <Input
                          value={slide.linkHref}
                          onChange={(e) => updatePromoSlide(i, { linkHref: e.target.value })}
                          placeholder="/shop?sort=discount"
                        />
                      </div>
                      <div>
                        <Label>Overlay Darkness (0–85%)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={85}
                          value={slide.overlayOpacity}
                          onChange={(e) =>
                            updatePromoSlide(i, { overlayOpacity: Number(e.target.value) })
                          }
                        />
                      </div>
                    </div>

                    {slide.textAlign !== "none" && (
                      <>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <Label>Slide Eyebrow / Offer Tag</Label>
                            <Input
                              value={slide.eyebrow}
                              onChange={(e) => updatePromoSlide(i, { eyebrow: e.target.value })}
                              placeholder="LIMITED TIME OFFER • UP TO 30% OFF"
                            />
                          </div>
                          <div>
                            <Label>Slide Title / Headline</Label>
                            <Input
                              value={slide.headline}
                              onChange={(e) => updatePromoSlide(i, { headline: e.target.value })}
                              placeholder="MATCHDAY OFFER"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Slide Subheadline</Label>
                          <Textarea
                            rows={2}
                            value={slide.subheadline}
                            onChange={(e) => updatePromoSlide(i, { subheadline: e.target.value })}
                            placeholder="Optional subtitle shown on this slide"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <ColorPickerField
                            label="Slide Title Color"
                            value={slide.textColor}
                            defaultHex="#f5f2eb"
                            onChange={(val) => updatePromoSlide(i, { textColor: val })}
                          />
                          <ColorPickerField
                            label="Slide Highlight Color"
                            value={slide.accentColor}
                            defaultHex="#f0c419"
                            onChange={(val) => updatePromoSlide(i, { accentColor: val })}
                          />
                          <ColorPickerField
                            label="Slide Subtitle Color"
                            value={slide.subtextColor ?? ""}
                            defaultHex="#9a968e"
                            onChange={(val) => updatePromoSlide(i, { subtextColor: val })}
                          />
                          <ColorPickerField
                            label="Slide Eyebrow Color"
                            value={slide.eyebrowColor ?? ""}
                            defaultHex="#9a968e"
                            onChange={(val) => updatePromoSlide(i, { eyebrowColor: val })}
                          />
                        </div>

                        <div className="border-t border-ink-border pt-3">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-paper-dim">
                              Slide Buttons (Label, Icon &amp; Colors)
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addSlideButton(i)}
                            >
                              <Plus size={12} /> ADD SLIDE BUTTON
                            </Button>
                          </div>
                          <div className="flex flex-col gap-3">
                            {slide.buttons.map((sbtn, bi) => (
                              <div
                                key={sbtn.id}
                                className="flex flex-col gap-2 border border-ink-border bg-ink-raised/40 p-3"
                              >
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                                  <div>
                                    <Label>Button Label</Label>
                                    <Input
                                      value={sbtn.label}
                                      onChange={(e) =>
                                        updateSlideButton(i, bi, { label: e.target.value })
                                      }
                                      placeholder="SHOP OFFER"
                                    />
                                  </div>
                                  <div>
                                    <Label>Link URL</Label>
                                    <Input
                                      value={sbtn.href}
                                      onChange={(e) =>
                                        updateSlideButton(i, bi, { href: e.target.value })
                                      }
                                      placeholder="/shop"
                                    />
                                  </div>
                                  <div>
                                    <Label>Button Icon</Label>
                                    <Select
                                      value={sbtn.icon ?? "arrow-right"}
                                      onChange={(e) =>
                                        updateSlideButton(i, bi, {
                                          icon: e.target.value as HeroButtonIcon,
                                        })
                                      }
                                    >
                                      {BUTTON_ICON_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </option>
                                      ))}
                                    </Select>
                                  </div>
                                  <div className="flex items-end gap-2">
                                    <div className="flex-1">
                                      <Label>Style</Label>
                                      <Select
                                        value={sbtn.variant}
                                        onChange={(e) =>
                                          updateSlideButton(i, bi, {
                                            variant: e.target.value as HeroButtonConfig["variant"],
                                          })
                                        }
                                      >
                                        <option value="primary">Primary Gold</option>
                                        <option value="outline">Outline</option>
                                        <option value="secondary">Secondary</option>
                                      </Select>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeSlideButton(i, bi)}
                                      aria-label="Remove slide button"
                                      className="mb-2 p-1 text-paper-dim hover:text-danger"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                  <ColorPickerField
                                    label="Button Background Color (optional)"
                                    value={sbtn.bgColor ?? ""}
                                    defaultHex="#f0c419"
                                    onChange={(val) =>
                                      updateSlideButton(i, bi, { bgColor: val })
                                    }
                                  />
                                  <ColorPickerField
                                    label="Button Text Color (optional)"
                                    value={sbtn.textColor ?? ""}
                                    defaultHex="#0b0b0b"
                                    onChange={(val) =>
                                      updateSlideButton(i, bi, { textColor: val })
                                    }
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Editorial Section"
        description="The large two-column fashion editorial block on the homepage."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="editorialEyebrow">Eyebrow</Label>
            <Input id="editorialEyebrow" name="editorialEyebrow" defaultValue={settings.editorialEyebrow} />
          </div>
          <div>
            <Label htmlFor="editorialCtaLabel">Button Label</Label>
            <Input id="editorialCtaLabel" name="editorialCtaLabel" defaultValue={settings.editorialCtaLabel} />
          </div>
        </div>
        <div>
          <Label htmlFor="editorialHeading">Heading</Label>
          <Input id="editorialHeading" name="editorialHeading" defaultValue={settings.editorialHeading} />
        </div>
        <div>
          <Label htmlFor="editorialBody">Body</Label>
          <Textarea id="editorialBody" name="editorialBody" rows={3} defaultValue={settings.editorialBody} />
        </div>
        <ImageField name="editorialImage" label="Editorial Image" currentUrl={settings.editorialImageUrl} />
      </SectionCard>

      <SectionCard
        title="Brand Statement"
        description="The centered 'WE ARE THE ION TO FASHION' statement section."
      >
        <div>
          <Label htmlFor="brandStatementHeading">Heading</Label>
          <Input
            id="brandStatementHeading"
            name="brandStatementHeading"
            defaultValue={settings.brandStatementHeading}
          />
        </div>
        <div>
          <Label htmlFor="brandStatementBody">Body</Label>
          <Textarea
            id="brandStatementBody"
            name="brandStatementBody"
            rows={3}
            defaultValue={settings.brandStatementBody}
          />
        </div>
      </SectionCard>

      <SectionCard title="Final CTA" description="The closing conversion section before the footer.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="finalCtaHeadingLine1">Heading Line 1</Label>
            <Input id="finalCtaHeadingLine1" name="finalCtaHeadingLine1" defaultValue={settings.finalCtaHeadingLine1} />
          </div>
          <div>
            <Label htmlFor="finalCtaHeadingLine2">Heading Line 2</Label>
            <Input id="finalCtaHeadingLine2" name="finalCtaHeadingLine2" defaultValue={settings.finalCtaHeadingLine2} />
          </div>
        </div>
        <div>
          <Label htmlFor="finalCtaButtonLabel">Button Label</Label>
          <Input id="finalCtaButtonLabel" name="finalCtaButtonLabel" defaultValue={settings.finalCtaButtonLabel} />
        </div>
        <ImageField name="finalCtaImage" label="Background Image (optional)" currentUrl={settings.finalCtaImageUrl} />
      </SectionCard>

      <SectionCard title="Delivery & Payment">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="deliveryFeeCents">Delivery Fee (৳)</Label>
            <Input
              id="deliveryFeeCents"
              name="deliveryFeeCents"
              type="number"
              step="0.01"
              defaultValue={centsToUnits(settings.deliveryFeeCents)}
            />
            <FieldError message={state.fieldErrors?.deliveryFeeCents} />
          </div>
          <div>
            <Label htmlFor="freeDeliveryThresholdCents">Free Delivery Above (৳)</Label>
            <Input
              id="freeDeliveryThresholdCents"
              name="freeDeliveryThresholdCents"
              type="number"
              step="0.01"
              defaultValue={centsToUnits(settings.freeDeliveryThresholdCents)}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="codEnabled" defaultChecked={settings.codEnabled} />
          Enable Cash on Delivery
        </label>
      </SectionCard>

      <Button type="submit" variant="primary" size="lg" disabled={isPending} className="self-start">
        {isPending ? "SAVING..." : "SAVE SETTINGS"}
      </Button>
    </form>
  );
}
