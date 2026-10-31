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

export interface FooterSocialItem {
  enabled: boolean;
  url: string;
}

export interface FooterSocialsConfig {
  instagram: FooterSocialItem;
  facebook: FooterSocialItem;
  twitter: FooterSocialItem;
  whatsapp: FooterSocialItem;
  tiktok: FooterSocialItem;
  telegram: FooterSocialItem;
}

export interface FooterShopInfoConfig {
  address: string;
  phone: string;
  secondaryPhone: string;
  email: string;
  hours: string;
  aboutText: string;
}

export interface FooterCustomConfig {
  socials: FooterSocialsConfig;
  shopInfo: FooterShopInfoConfig;
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

  footerConfig: FooterCustomConfig;
}

export const DEFAULT_FOOTER_CONFIG: FooterCustomConfig = {
  socials: {
    instagram: { enabled: true, url: "https://instagram.com" },
    facebook: { enabled: true, url: "https://facebook.com" },
    twitter: { enabled: false, url: "https://x.com" },
    whatsapp: { enabled: true, url: "https://wa.me/8801328366311" },
    tiktok: { enabled: true, url: "https://tiktok.com" },
    telegram: { enabled: false, url: "https://t.me" },
  },
  shopInfo: {
    address:
      "Shop No # 6, 7, 8, 9, 14, 15 & 27 (1st Floor), Shahabuddin Plaza, Janata Co-Operative Housing Society Ltd, House No # 13, 23 Road No # 1, Ring Road, Adabor, Mohammadpur, Dhaka-1207",
    phone: "+8801328-366311",
    secondaryPhone: "+8801846-152393",
    email: "rumananasim13@gmail.com",
    hours: "Open 7 Days · 10:00 AM – 10:00 PM",
    aboutText:
      "Premium football jerseys for those who live the game. Authentic club kits, retro classics, and streetwear-inspired fits crafted with performance fabrics.",
  },
};

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

export const DEFAULTS: StoreSettingsView = {
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

  footerConfig: DEFAULT_FOOTER_CONFIG,
};

export const VALID_BUTTON_ICONS: HeroButtonIcon[] = [
  "none",
  "arrow-right",
  "shopping-bag",
  "tag",
  "sparkles",
  "flame",
  "zap",
];

export function normalizeButton(raw: unknown, index: number): HeroButtonConfig | null {
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

export function normalizePromoSlide(raw: unknown, index: number): HeroPromoSlide | null {
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

export function normalizeFooterConfig(rawSocialLinks: unknown): FooterCustomConfig {
  if (!rawSocialLinks || typeof rawSocialLinks !== "object" || Array.isArray(rawSocialLinks)) {
    return DEFAULT_FOOTER_CONFIG;
  }
  const root = rawSocialLinks as Record<string, unknown>;
  const raw = root.footerConfig;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return DEFAULT_FOOTER_CONFIG;
  }
  const obj = raw as Record<string, unknown>;
  const rawSocials = (obj.socials && typeof obj.socials === "object" ? obj.socials : {}) as Record<string, unknown>;
  const rawShopInfo = (obj.shopInfo && typeof obj.shopInfo === "object" ? obj.shopInfo : {}) as Record<string, unknown>;

  const parseSocial = (platform: keyof FooterSocialsConfig): FooterSocialItem => {
    const p = rawSocials[platform];
    const def = DEFAULT_FOOTER_CONFIG.socials[platform];
    if (!p || typeof p !== "object") return def;
    const po = p as Record<string, unknown>;
    return {
      enabled: typeof po.enabled === "boolean" ? po.enabled : def.enabled,
      url: typeof po.url === "string" ? po.url.trim() : def.url,
    };
  };

  return {
    socials: {
      instagram: parseSocial("instagram"),
      facebook: parseSocial("facebook"),
      twitter: parseSocial("twitter"),
      whatsapp: parseSocial("whatsapp"),
      tiktok: parseSocial("tiktok"),
      telegram: parseSocial("telegram"),
    },
    shopInfo: {
      address:
        typeof rawShopInfo.address === "string" && rawShopInfo.address.trim()
          ? rawShopInfo.address.trim()
          : DEFAULT_FOOTER_CONFIG.shopInfo.address,
      phone:
        typeof rawShopInfo.phone === "string" && rawShopInfo.phone.trim()
          ? rawShopInfo.phone.trim()
          : DEFAULT_FOOTER_CONFIG.shopInfo.phone,
      secondaryPhone:
        typeof rawShopInfo.secondaryPhone === "string" ? rawShopInfo.secondaryPhone.trim() : "",
      email:
        typeof rawShopInfo.email === "string" && rawShopInfo.email.trim()
          ? rawShopInfo.email.trim()
          : DEFAULT_FOOTER_CONFIG.shopInfo.email,
      hours:
        typeof rawShopInfo.hours === "string" && rawShopInfo.hours.trim()
          ? rawShopInfo.hours.trim()
          : DEFAULT_FOOTER_CONFIG.shopInfo.hours,
      aboutText:
        typeof rawShopInfo.aboutText === "string" && rawShopInfo.aboutText.trim()
          ? rawShopInfo.aboutText.trim()
          : DEFAULT_FOOTER_CONFIG.shopInfo.aboutText,
    },
  };
}

