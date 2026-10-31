"use client";

import { useActionState, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ImageInputWithPreview } from "@/components/admin/image-input-preview";
import { centsToUnits } from "@/lib/money";
import {
  updateStoreSettingsAction,
  type SettingsActionResult,
} from "@/lib/actions/admin-settings-actions";
import {
  DEFAULT_FOOTER_CONFIG,
  DEFAULT_LOCATION_BADGES,
  DEFAULT_SHOWROOM_SCHEDULE,
  formatTime12Hour,
  getStoreStatus,
  type FooterSocialsConfig,
  type FooterSocialItem,
  type HeroBannerMode,
  type HeroButtonConfig,
  type HeroButtonIcon,
  type HeroPromoSlide,
  type LocationBadgeItem,
  type ShowroomScheduleConfig,
  type ShowroomStatusMode,
  type StoreSettingsView,
} from "@/lib/data/settings-shared";

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

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

type SocialPlatformKey = "instagram" | "facebook" | "twitter" | "whatsapp" | "tiktok" | "telegram";

const SOCIAL_PLATFORMS: {
  key: SocialPlatformKey;
  name: string;
  placeholder: string;
  example: string;
}[] = [
  {
    key: "instagram",
    name: "Instagram",
    placeholder: "https://instagram.com/yourhandle",
    example: "https://instagram.com/jafjersey",
  },
  {
    key: "facebook",
    name: "Facebook",
    placeholder: "https://facebook.com/yourpage",
    example: "https://facebook.com/jafjersey",
  },
  {
    key: "twitter",
    name: "Twitter / X",
    placeholder: "https://x.com/yourhandle",
    example: "https://x.com/jafjersey",
  },
  {
    key: "whatsapp",
    name: "WhatsApp",
    placeholder: "https://wa.me/8801XXXXXXXXX",
    example: "https://wa.me/8801328366311",
  },
  {
    key: "tiktok",
    name: "TikTok",
    placeholder: "https://tiktok.com/@yourhandle",
    example: "https://tiktok.com/@jafjersey",
  },
  {
    key: "telegram",
    name: "Telegram",
    placeholder: "https://t.me/yourchannel",
    example: "https://t.me/jafjersey",
  },
];

export function SettingsForm({
  settings,
  products,
}: {
  settings: StoreSettingsView;
  products: { id: string; name: string; sku: string }[];
}) {
  const [state, formAction, isActionPending] = useActionState(updateStoreSettingsAction, initialState);
  const [isSubmitTransition, startSubmitTransition] = useTransition();
  const isPending = isActionPending || isSubmitTransition;
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
  const fc = settings.footerConfig ?? DEFAULT_FOOTER_CONFIG;
  const [footerSocials, setFooterSocials] = useState<FooterSocialsConfig>(fc.socials);
  const [shopAddress, setShopAddress] = useState<string>(fc.shopInfo.address);
  const [shopPhone, setShopPhone] = useState<string>(fc.shopInfo.phone);
  const [shopSecondaryPhone, setShopSecondaryPhone] = useState<string>(fc.shopInfo.secondaryPhone ?? "");
  const [shopEmail, setShopEmail] = useState<string>(fc.shopInfo.email);
  const [shopHours, setShopHours] = useState<string>(fc.shopInfo.hours);
  const [footerAboutText, setFooterAboutText] = useState<string>(fc.shopInfo.aboutText);
  const [locationBadges, setLocationBadges] = useState<LocationBadgeItem[]>(
    fc.shopInfo.locationBadges && fc.shopInfo.locationBadges.length > 0
      ? fc.shopInfo.locationBadges
      : DEFAULT_LOCATION_BADGES
  );
  const [showroomSchedule, setShowroomSchedule] = useState<ShowroomScheduleConfig>(
    fc.shopInfo.schedule ?? DEFAULT_SHOWROOM_SCHEDULE
  );

  function addLocationBadge() {
    setLocationBadges((prev) => [
      ...prev,
      {
        id: makeId("loc-badge"),
        label: "",
        highlight: false,
      },
    ]);
  }

  function updateLocationBadge(index: number, patch: Partial<LocationBadgeItem>) {
    setLocationBadges((prev) =>
      prev.map((b, i) => (i === index ? { ...b, ...patch } : b))
    );
  }

  function removeLocationBadge(index: number) {
    setLocationBadges((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSchedule(patch: Partial<ShowroomScheduleConfig>) {
    setShowroomSchedule((prev) => {
      const next = { ...prev, ...patch };
      if (patch.openTime || patch.closeTime || patch.daysNotice) {
        const oF = formatTime12Hour(next.openTime);
        const cF = formatTime12Hour(next.closeTime);
        setShopHours(`${next.daysNotice || "Open 7 Days"} · ${oF} – ${cF}`);
      }
      return next;
    });
  }


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

      <SectionCard
        title="Footer & Store Information"
        description="Configure social media links (with toggle checkboxes) and edit the physical outlet address & contact numbers displayed in the premium storefront footer."
      >
        {/* Hidden JSON input for comprehensive backend sync */}
        <input
          type="hidden"
          name="footerConfigJson"
          value={JSON.stringify({
            socials: footerSocials,
            shopInfo: {
              address: shopAddress,
              phone: shopPhone,
              secondaryPhone: shopSecondaryPhone,
              email: shopEmail,
              hours: shopHours,
              aboutText: footerAboutText,
              locationBadges,
              schedule: showroomSchedule,
            },
          })}
        />

        {/* 1. Social Media Links */}
        <div>
          <div className="flex items-center justify-between border-b border-ink-border pb-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-paper">
                Social Media Links
              </h3>
              <p className="text-[11px] text-paper-dim">
                Tick mark (check) each platform you want to display on the storefront footer, then paste the URL.
              </p>
            </div>
            <span className="text-[11px] font-mono text-gold">
              {Object.values(footerSocials).filter((s: FooterSocialItem) => s.enabled).length} Active
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SOCIAL_PLATFORMS.map((platform) => {
              const item = footerSocials[platform.key] ?? { enabled: false, url: "" };
              return (
                <div
                  key={platform.key}
                  className={`border p-4 transition-all ${
                    item.enabled
                      ? "border-gold/60 bg-ink-raised shadow-xs"
                      : "border-ink-border bg-ink/40 opacity-75"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="flex cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFooterSocials((prev: FooterSocialsConfig) => ({
                            ...prev,
                            [platform.key]: {
                              ...prev[platform.key],
                              enabled: checked,
                            },
                          }));
                        }}
                        className="h-4 w-4 rounded-none border border-ink-border accent-gold focus:ring-1 focus:ring-gold"
                      />
                      <span className="text-sm font-semibold text-paper">
                        {platform.name}
                      </span>
                    </label>

                    <Badge
                      variant={item.enabled ? "gold" : "neutral"}
                      className="text-[10px]"
                    >
                      {item.enabled ? "Enabled on site" : "Hidden"}
                    </Badge>
                  </div>

                  {item.enabled ? (
                    <div className="mt-3 space-y-1">
                      <Label htmlFor={`social_${platform.key}_url`} className="text-xs">
                        {platform.name} URL / Link
                      </Label>
                      <Input
                        id={`social_${platform.key}_url`}
                        type="url"
                        value={item.url}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFooterSocials((prev: FooterSocialsConfig) => ({
                            ...prev,
                            [platform.key]: {
                              ...prev[platform.key],
                              url: val,
                            },
                          }));
                        }}
                        placeholder={platform.placeholder}
                        className="h-9 bg-ink text-xs"
                      />
                      <p className="text-[10px] text-paper-dim">
                        Example: <span className="font-mono text-gold/80">{platform.example}</span>
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] italic text-paper-dim">
                      Check the box above to enable {platform.name} and paste your link.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Shop & Outlet Contact Info */}
        <div className="mt-4 border-t border-ink-border pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-paper">
            Shop Outlet &amp; Contact Details
          </h3>
          <p className="mt-0.5 text-[11px] text-paper-dim">
            The physical showroom address is rendered as focusable standout text in the footer, with contact numbers separated into distinct direct calling badges.
          </p>

          <div className="mt-3 flex flex-col gap-4">
            <div>
              <Label htmlFor="footerShopAddress">
                Shop / Outlet Address (Focusable Text on Footer)
              </Label>
              <Textarea
                id="footerShopAddress"
                rows={3}
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                placeholder="Shop No, Plaza, Road, Area, City..."
                className="mt-1 bg-ink text-xs leading-relaxed"
              />
              <p className="mt-1 text-[11px] text-paper-dim">
                Displayed in the prominent showroom location card with interactive focus states.
              </p>
            </div>

            {/* 3. Showroom Highlights & Location Badges */}
            <div className="border border-ink-border bg-ink-raised/50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-paper">
                    Showroom Badges &amp; Location Highlights
                  </h4>
                  <p className="text-[11px] text-paper-dim">
                    Tags rendered directly below the physical address (e.g. Floor info, area landmark, trial service).
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLocationBadge}
                  className="h-8 shrink-0 text-xs"
                >
                  <Plus size={13} className="mr-1" /> Add Badge
                </Button>
              </div>

              {/* Badges List */}
              <div className="mt-3 space-y-2.5">
                {locationBadges.map((badge, idx) => (
                  <div
                    key={badge.id || idx}
                    className="flex flex-col gap-2 rounded border border-ink-border bg-ink p-2.5 sm:flex-row sm:items-center"
                  >
                    <div className="flex-1">
                      <Input
                        type="text"
                        value={badge.label}
                        onChange={(e) =>
                          updateLocationBadge(idx, { label: e.target.value })
                        }
                        placeholder="e.g. Floor 1 · Shahabuddin Plaza"
                        className="h-8 bg-ink-raised text-xs"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-start">
                      <label className="flex cursor-pointer items-center gap-1.5 text-xs text-paper-dim select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(badge.highlight)}
                          onChange={(e) =>
                            updateLocationBadge(idx, { highlight: e.target.checked })
                          }
                          className="h-3.5 w-3.5 rounded border border-ink-border accent-emerald-500"
                        />
                        <span className={badge.highlight ? "font-semibold text-emerald-400" : ""}>
                          Emerald Highlight
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => removeLocationBadge(idx)}
                        className="rounded p-1 text-paper-dim transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                        title="Delete badge"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {locationBadges.length === 0 && (
                  <p className="py-2 text-center text-xs italic text-paper-dim">
                    No badges configured. Click &quot;Add Badge&quot; to create one.
                  </p>
                )}
              </div>

              {/* Live Preview Strip */}
              {locationBadges.length > 0 && (
                <div className="mt-3 rounded border border-ink-border/60 bg-ink/70 p-3">
                  <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-paper-dim">
                    Live Footer Preview:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {locationBadges.map((badge) => (
                      <span
                        key={badge.id}
                        className={
                          badge.highlight
                            ? "inline-flex items-center gap-1.5 rounded-sm border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 font-mono text-[10px] uppercase text-emerald-400"
                            : "inline-flex items-center gap-1.5 rounded-sm border border-ink-border bg-ink px-2.5 py-1 font-mono text-[10px] uppercase text-paper-dim"
                        }
                      >
                        {badge.label || "(Empty)"}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Showroom Schedule & Live Status Badge */}
            <div className="border border-ink-border bg-ink-raised/50 p-4">
              <div className="flex flex-col gap-2 border-b border-ink-border pb-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-paper">
                    Showroom Operational Schedule &amp; Dynamic Status
                  </h4>
                  <p className="text-[11px] text-paper-dim">
                    Controls whether the showroom displays as Active/Open (with pulsing green light) or Inactive/Closed based on time or admin mode.
                  </p>
                </div>

                {/* Live Preview of the Status Badge */}
                <div className="flex items-center gap-2 pt-1 sm:pt-0">
                  <span className="font-mono text-[10px] text-paper-dim">Storefront Preview:</span>
                  {(() => {
                    const status = getStoreStatus(showroomSchedule);
                    if (status.badgeVariant === "open") {
                      return (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.2)]">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                          {status.statusText}
                        </span>
                      );
                    }
                    if (status.badgeVariant === "maintenance") {
                      return (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-rose-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                          {status.statusText}
                        </span>
                      );
                    }
                    return (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-border bg-ink px-2.5 py-0.5 font-mono text-[10px] font-medium text-paper-dim">
                        <span className="h-1.5 w-1.5 rounded-full bg-paper-dim/60" />
                        {status.statusText}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Status Mode Radio Buttons */}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => updateSchedule({ mode: "auto" })}
                  className={`flex flex-col gap-1 rounded border p-3 text-left transition-all ${
                    showroomSchedule.mode === "auto"
                      ? "border-emerald-500/60 bg-emerald-500/10 text-paper shadow-[0_0_15px_-3px_rgba(74,222,128,0.2)]"
                      : "border-ink-border bg-ink text-paper-dim hover:border-paper-dim/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      🔄 Auto (Real-Time)
                    </span>
                    {showroomSchedule.mode === "auto" && (
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                    )}
                  </div>
                  <span className="text-[11px] text-paper-dim">
                    Dynamically active/inactive based on current Dhaka clock (UTC+6) &amp; opening hours.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => updateSchedule({ mode: "force_open" })}
                  className={`flex flex-col gap-1 rounded border p-3 text-left transition-all ${
                    showroomSchedule.mode === "force_open"
                      ? "border-emerald-500/60 bg-emerald-500/10 text-paper shadow-[0_0_15px_-3px_rgba(74,222,128,0.2)]"
                      : "border-ink-border bg-ink text-paper-dim hover:border-paper-dim/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      🟢 Always Open
                    </span>
                    {showroomSchedule.mode === "force_open" && (
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                    )}
                  </div>
                  <span className="text-[11px] text-paper-dim">
                    Manual override: always displays glowing green Open badge regardless of hour.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => updateSchedule({ mode: "force_closed" })}
                  className={`flex flex-col gap-1 rounded border p-3 text-left transition-all ${
                    showroomSchedule.mode === "force_closed"
                      ? "border-rose-500/60 bg-rose-500/10 text-paper shadow-[0_0_15px_-3px_rgba(244,63,94,0.2)]"
                      : "border-ink-border bg-ink text-paper-dim hover:border-paper-dim/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                      🔴 Force Closed
                    </span>
                    {showroomSchedule.mode === "force_closed" && (
                      <span className="h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                    )}
                  </div>
                  <span className="text-[11px] text-paper-dim">
                    Manual override: mark as closed for holidays, Eid, renovation or emergency maintenance.
                  </span>
                </button>
              </div>

              {/* Time Configuration Grid */}
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="showroomOpenTime" className="text-xs">
                    Opening Time (24h format HH:mm)
                  </Label>
                  <Input
                    id="showroomOpenTime"
                    type="time"
                    value={showroomSchedule.openTime}
                    onChange={(e) => updateSchedule({ openTime: e.target.value })}
                    className="mt-1 h-9 bg-ink font-mono text-xs"
                  />
                  <p className="mt-1 text-[10px] text-paper-dim">
                    Displays as: <span className="font-mono text-gold-bright">{formatTime12Hour(showroomSchedule.openTime)}</span>
                  </p>
                </div>

                <div>
                  <Label htmlFor="showroomCloseTime" className="text-xs">
                    Closing Time (24h format HH:mm)
                  </Label>
                  <Input
                    id="showroomCloseTime"
                    type="time"
                    value={showroomSchedule.closeTime}
                    onChange={(e) => updateSchedule({ closeTime: e.target.value })}
                    className="mt-1 h-9 bg-ink font-mono text-xs"
                  />
                  <p className="mt-1 text-[10px] text-paper-dim">
                    Displays as: <span className="font-mono text-gold-bright">{formatTime12Hour(showroomSchedule.closeTime)}</span>
                  </p>
                </div>
              </div>

              {/* Days Notice & Closed Notice */}
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="showroomDaysNotice" className="text-xs">
                    Days / Schedule Label
                  </Label>
                  <Input
                    id="showroomDaysNotice"
                    type="text"
                    value={showroomSchedule.daysNotice}
                    onChange={(e) => updateSchedule({ daysNotice: e.target.value })}
                    placeholder="e.g. Open 7 Days or Open Today"
                    className="mt-1 h-9 bg-ink text-xs"
                  />
                </div>

                <div>
                  <Label htmlFor="showroomClosedNotice" className="text-xs">
                    Closed Notice Override
                  </Label>
                  <Input
                    id="showroomClosedNotice"
                    type="text"
                    value={showroomSchedule.closedNotice || ""}
                    onChange={(e) => updateSchedule({ closedNotice: e.target.value })}
                    placeholder="e.g. Closed Now · Opens at 10:00 AM"
                    className="mt-1 h-9 bg-ink text-xs"
                  />
                </div>
              </div>

              {/* Days of Week Selection */}
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-paper">
                    Operational Days of Week:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const all = [0, 1, 2, 3, 4, 5, 6];
                      const isAll = showroomSchedule.openDays.length === 7;
                      updateSchedule({ openDays: isAll ? [] : all });
                    }}
                    className="text-[10px] font-mono text-gold-bright hover:underline"
                  >
                    {showroomSchedule.openDays.length === 7 ? "Deselect All" : "Select All 7 Days"}
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const isChecked = showroomSchedule.openDays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => {
                          const nextDays = isChecked
                            ? showroomSchedule.openDays.filter((d) => d !== day.value)
                            : [...showroomSchedule.openDays, day.value];
                          updateSchedule({ openDays: nextDays });
                        }}
                        className={`rounded border px-3 py-1 font-mono text-xs transition-colors ${
                          isChecked
                            ? "border-emerald-500/40 bg-emerald-500/10 font-bold text-emerald-400"
                            : "border-ink-border bg-ink text-paper-dim hover:text-paper"
                        }`}
                      >
                        {day.label.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="footerShopPhone">
                  Primary Phone Number (Separated Contact)
                </Label>
                <Input
                  id="footerShopPhone"
                  type="text"
                  value={shopPhone}
                  onChange={(e) => setShopPhone(e.target.value)}
                  placeholder="+880 1XXXXXXXXX"
                  className="mt-1 bg-ink text-xs"
                />
                <p className="mt-1 text-[11px] text-paper-dim">
                  Separated from the address into a clickable direct call badge.
                </p>
              </div>

              <div>
                <Label htmlFor="footerShopSecondaryPhone">
                  Secondary Phone Number (Optional)
                </Label>
                <Input
                  id="footerShopSecondaryPhone"
                  type="text"
                  value={shopSecondaryPhone}
                  onChange={(e) => setShopSecondaryPhone(e.target.value)}
                  placeholder="+880 1XXXXXXXXX"
                  className="mt-1 bg-ink text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="footerShopEmail">
                  Customer Support Email
                </Label>
                <Input
                  id="footerShopEmail"
                  type="email"
                  value={shopEmail}
                  onChange={(e) => setShopEmail(e.target.value)}
                  placeholder="support@jafjersey.com"
                  className="mt-1 bg-ink text-xs"
                />
              </div>

              <div>
                <Label htmlFor="footerShopHours">
                  Opening / Support Hours
                </Label>
                <Input
                  id="footerShopHours"
                  type="text"
                  value={shopHours}
                  onChange={(e) => setShopHours(e.target.value)}
                  placeholder="Open 7 Days · 10:00 AM – 10:00 PM"
                  className="mt-1 bg-ink text-xs"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="footerAboutText">
                Footer Brand Statement / About Intro
              </Label>
              <Textarea
                id="footerAboutText"
                rows={2}
                value={footerAboutText}
                onChange={(e) => setFooterAboutText(e.target.value)}
                placeholder="Short editorial summary of JAF culture and kits..."
                className="mt-1 bg-ink text-xs"
              />
            </div>
          </div>
        </div>
      </SectionCard>

      <Button type="submit" variant="primary" size="lg" disabled={isPending} className="self-start">
        {isPending ? "SAVING..." : "SAVE SETTINGS"}
      </Button>
    </form>
  );
}
