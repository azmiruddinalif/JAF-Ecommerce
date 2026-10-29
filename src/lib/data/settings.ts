import "server-only";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

export interface TrustStripItem {
  label: string;
}

export type HeroBannerMode = "default" | "full-slider";

export type HeroButtonIcon =
  | "none"
  | "arrow-right"
  | "shopping-bag"
  | "tag"
  | "sparkles"
  | "flame"
  | "zap";

export interface HeroButtonConfig {
  id: string;
  label: string;
  href: string;
  variant: "primary" | "outline" | "secondary";
  icon?: HeroButtonIcon;
  bgColor?: string;
  textColor?: string;
}

export interface HeroPromoSlide {
  id: string;
  imageUrl: string;
  imagePublicId: string | null;
  eyebrow: string;
  headline: string;
  subheadline: string;
  linkHref: string;
  textAlign: "left" | "center" | "none";
  overlayOpacity: number;
  eyebrowColor: string;
  textColor: string;
  subtextColor: string;
  accentColor: string;
  buttons: HeroButtonConfig[];
}

export interface HeroCustomConfig {
  mode: HeroBannerMode;
  eyebrow: string;
  accentWord: string;
  bgColor: string;
  eyebrowColor: string;
  textColor: string;
  accentColor: string;
  subtextColor: string;
  imageGlowColor: string;
  buttons: HeroButtonConfig[];
  promoSlides: HeroPromoSlide[];
}

export interface StoreSettingsView {
  announcementText: string;
  announcementEnabled: boolean;

  heroHeadline: string;
  heroSubheadline: string;
  heroImageUrl: string | null;
  heroShowcaseProductIds: (string | null)[];
  heroShowcaseImageUrls: (string | null)[];
  heroConfig: HeroCustomConfig;

  trustStripItems: TrustStripItem[];

  editorialEyebrow: string;
  editorialHeading: string;
  editorialBody: string;
  editorialCtaLabel: string;
  editorialImageUrl: string | null;

  brandStatementHeading: string;
  brandStatementBody: string;

  finalCtaHeadingLine1: string;
  finalCtaHeadingLine2: string;
  finalCtaButtonLabel: string;
  finalCtaImageUrl: string | null;

  deliveryFeeCents: number;
  freeDeliveryThresholdCents: number;
  codEnabled: boolean;
}

export const DEFAULT_HERO_CONFIG: HeroCustomConfig = {
  mode: "default",
  eyebrow: "Authentic Football Jerseys",
  accentWord: "fashion",
  bgColor: "",
  eyebrowColor: "",
  textColor: "",
  accentColor: "",
  subtextColor: "",
  imageGlowColor: "",
  buttons: [
    {
      id: "hero-btn-default",
      label: "SHOP NOW",
      href: "/shop",
      variant: "primary",
      icon: "arrow-right",
      bgColor: "",
      textColor: "",
    },
  ],
  promoSlides: [],
};

const DEFAULTS: StoreSettingsView = {
  announcementText: "NEW SEASON HAS ARRIVED • FREE DELIVERY ON SELECTED ORDERS",
  announcementEnabled: true,

  heroHeadline: "WE ARE THE ION TO FASHION",
  heroSubheadline:
    "Shop authentic club kits, national team football jerseys, and iconic retro shirts crafted with breathable performance fabrics and tailored streetwear fits.",
  heroImageUrl: null,
  heroShowcaseProductIds: [null, null, null],
  heroShowcaseImageUrls: [null, null, null],
  heroConfig: DEFAULT_HERO_CONFIG,

  trustStripItems: [
    { label: "Premium Quality" },
    { label: "Fast Delivery" },
    { label: "Secure Payment" },
    { label: "Easy Exchange" },
    { label: "Authentic Products" },
  ],

  editorialEyebrow: "The Edit",
  editorialHeading: "CULTURE ON THE PITCH & THE STREET",
  editorialBody:
    "Every JAF football jersey bridges the energy of stadium matchdays with modern everyday style. From Premier League and La Liga club kits to timeless retro editions, our jerseys are engineered for comfort, durability, and effortless football fashion.",
  editorialCtaLabel: "DISCOVER THE EDIT",
  editorialImageUrl: null,

  brandStatementHeading: "WE ARE THE ION TO FASHION",
  brandStatementBody:
    "JAF (Jerseys & Fashion) was created for supporters who see a football shirt as more than sportswear — it is heritage and identity. We obsess over breathable mesh fabrics, crisp crest embroidery, and contemporary silhouettes so every home, away, third, and retro kit looks as sharp on the street as it does under the stadium floodlights.",

  finalCtaHeadingLine1: "FIND YOUR JERSEY.",
  finalCtaHeadingLine2: "WEAR YOUR GAME.",
  finalCtaButtonLabel: "SHOP NOW",
  finalCtaImageUrl: null,

  deliveryFeeCents: 6000,
  freeDeliveryThresholdCents: 300000,
  codEnabled: true,
};

const VALID_BUTTON_ICONS: HeroButtonIcon[] = [
  "none",
  "arrow-right",
  "shopping-bag",
  "tag",
  "sparkles",
  "flame",
  "zap",
];

function normalizeButton(raw: unknown, index: number): HeroButtonConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const label = typeof obj.label === "string" ? obj.label.trim() : "";
  if (!label) return null;
  const variant =
    obj.variant === "outline" || obj.variant === "secondary" ? obj.variant : "primary";
  const icon: HeroButtonIcon =
    typeof obj.icon === "string" && VALID_BUTTON_ICONS.includes(obj.icon as HeroButtonIcon)
      ? (obj.icon as HeroButtonIcon)
      : index === 0
        ? "arrow-right"
        : "none";
  return {
    id: typeof obj.id === "string" && obj.id ? obj.id : `btn-${index + 1}`,
    label,
    href: typeof obj.href === "string" && obj.href.trim() ? obj.href.trim() : "/shop",
    variant,
    icon,
    bgColor: typeof obj.bgColor === "string" ? obj.bgColor.trim() : "",
    textColor: typeof obj.textColor === "string" ? obj.textColor.trim() : "",
  };
}

function normalizePromoSlide(raw: unknown, index: number): HeroPromoSlide | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const imageUrl = typeof obj.imageUrl === "string" ? obj.imageUrl.trim() : "";
  if (!imageUrl) return null;

  const textAlign =
    obj.textAlign === "center" || obj.textAlign === "none" ? obj.textAlign : "left";
  const rawOpacity = Number(obj.overlayOpacity);
  const overlayOpacity = Number.isFinite(rawOpacity)
    ? Math.max(0, Math.min(85, rawOpacity))
    : 45;

  const buttons = Array.isArray(obj.buttons)
    ? obj.buttons
        .map((b, idx) => normalizeButton(b, idx))
        .filter((b): b is HeroButtonConfig => b !== null)
    : [];

  return {
    id: typeof obj.id === "string" && obj.id ? obj.id : `promo-slide-${index + 1}`,
    imageUrl,
    imagePublicId:
      typeof obj.imagePublicId === "string" && obj.imagePublicId ? obj.imagePublicId : null,
    eyebrow: typeof obj.eyebrow === "string" ? obj.eyebrow : "",
    headline: typeof obj.headline === "string" ? obj.headline : "",
    subheadline: typeof obj.subheadline === "string" ? obj.subheadline : "",
    linkHref: typeof obj.linkHref === "string" ? obj.linkHref : "/shop",
    textAlign,
    overlayOpacity,
    eyebrowColor: typeof obj.eyebrowColor === "string" ? obj.eyebrowColor : "",
    textColor: typeof obj.textColor === "string" ? obj.textColor : "",
    subtextColor: typeof obj.subtextColor === "string" ? obj.subtextColor : "",
    accentColor: typeof obj.accentColor === "string" ? obj.accentColor : "",
    buttons,
  };
}

export function normalizeHeroConfig(rawSocialLinks: unknown): HeroCustomConfig {
  if (!rawSocialLinks || typeof rawSocialLinks !== "object" || Array.isArray(rawSocialLinks)) {
    return DEFAULT_HERO_CONFIG;
  }
  const root = rawSocialLinks as Record<string, unknown>;
  const raw = root.heroConfig;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return DEFAULT_HERO_CONFIG;
  }
  const obj = raw as Record<string, unknown>;
  const mode: HeroBannerMode = obj.mode === "full-slider" ? "full-slider" : "default";

  const parsedButtons = Array.isArray(obj.buttons)
    ? obj.buttons
        .map((b, i) => normalizeButton(b, i))
        .filter((b): b is HeroButtonConfig => b !== null)
    : DEFAULT_HERO_CONFIG.buttons;

  const promoSlides = Array.isArray(obj.promoSlides)
    ? obj.promoSlides
        .map((s, i) => normalizePromoSlide(s, i))
        .filter((s): s is HeroPromoSlide => s !== null)
    : [];

  return {
    mode,
    eyebrow:
      typeof obj.eyebrow === "string" ? obj.eyebrow : DEFAULT_HERO_CONFIG.eyebrow,
    accentWord:
      typeof obj.accentWord === "string" && obj.accentWord.trim()
        ? obj.accentWord.trim()
        : DEFAULT_HERO_CONFIG.accentWord,
    bgColor: typeof obj.bgColor === "string" ? obj.bgColor.trim() : "",
    eyebrowColor: typeof obj.eyebrowColor === "string" ? obj.eyebrowColor.trim() : "",
    textColor: typeof obj.textColor === "string" ? obj.textColor.trim() : "",
    accentColor: typeof obj.accentColor === "string" ? obj.accentColor.trim() : "",
    subtextColor: typeof obj.subtextColor === "string" ? obj.subtextColor.trim() : "",
    imageGlowColor: typeof obj.imageGlowColor === "string" ? obj.imageGlowColor.trim() : "",
    buttons: parsedButtons.length > 0 ? parsedButtons : DEFAULT_HERO_CONFIG.buttons,
    promoSlides,
  };
}

export async function getStoreSettings(): Promise<StoreSettingsView> {
  await connection();
  let row;
  try {
    row = await prisma.storeSetting.findUnique({ where: { id: 1 } });
  } catch {
    return DEFAULTS;
  }
  if (!row) return DEFAULTS;

  return {
    announcementText: row.announcementText,
    announcementEnabled: row.announcementEnabled,

    heroHeadline: row.heroHeadline,
    heroSubheadline: row.heroSubheadline,
    heroImageUrl: row.heroImageUrl,
    heroShowcaseProductIds: Array.isArray(row.heroShowcaseProductIds)
      ? Array.from({ length: 3 }, (_, i) => {
          const id = (row.heroShowcaseProductIds as unknown[])[i];
          return typeof id === "string" ? id : null;
        })
      : [null, null, null],
    heroShowcaseImageUrls: [
      row.heroShowcase1ImageUrl,
      row.heroShowcase2ImageUrl,
      row.heroShowcase3ImageUrl,
    ],
    heroConfig: normalizeHeroConfig(row.socialLinks),

    trustStripItems: Array.isArray(row.trustStripItems)
      ? (row.trustStripItems as unknown as TrustStripItem[])
      : DEFAULTS.trustStripItems,

    editorialEyebrow: row.editorialEyebrow,
    editorialHeading: row.editorialHeading,
    editorialBody: row.editorialBody,
    editorialCtaLabel: row.editorialCtaLabel,
    editorialImageUrl: row.editorialImageUrl,

    brandStatementHeading: row.brandStatementHeading,
    brandStatementBody: row.brandStatementBody,

    finalCtaHeadingLine1: row.finalCtaHeadingLine1,
    finalCtaHeadingLine2: row.finalCtaHeadingLine2,
    finalCtaButtonLabel: row.finalCtaButtonLabel,
    finalCtaImageUrl: row.finalCtaImageUrl,

    deliveryFeeCents: row.deliveryFeeCents,
    freeDeliveryThresholdCents: row.freeDeliveryThresholdCents,
    codEnabled: row.codEnabled,
  };
}
