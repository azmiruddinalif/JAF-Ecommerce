"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth/session";
import { storeSettingsSchema } from "@/lib/validation/schemas";
import { imageStorage } from "@/lib/storage";
import { validateImageFile } from "@/lib/storage/validate";
import { unitsToCents } from "@/lib/money";
import {
  DEFAULT_HERO_CONFIG,
  normalizeHeroConfig,
  normalizeFooterConfig,
  type FooterCustomConfig,
  type HeroBannerMode,
  type HeroButtonConfig,
  type HeroButtonIcon,
  type HeroCustomConfig,
  type HeroPromoSlide,
} from "@/lib/data/settings";

export interface SettingsActionResult {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
}

type ImageUrlColumn =
  | "heroImageUrl"
  | "editorialImageUrl"
  | "finalCtaImageUrl"
  | "heroShowcase1ImageUrl"
  | "heroShowcase2ImageUrl"
  | "heroShowcase3ImageUrl";
type ImagePublicIdColumn =
  | "heroImagePublicId"
  | "editorialImagePublicId"
  | "finalCtaImagePublicId"
  | "heroShowcase1ImagePublicId"
  | "heroShowcase2ImagePublicId"
  | "heroShowcase3ImagePublicId";

interface ImageSlot {
  field: string; // FormData field name for the new file
  folder: string;
  urlColumn: ImageUrlColumn;
  publicIdColumn: ImagePublicIdColumn;
}

const IMAGE_SLOTS: ImageSlot[] = [
  { field: "heroImage", folder: "settings/hero", urlColumn: "heroImageUrl", publicIdColumn: "heroImagePublicId" },
  {
    field: "heroShowcase1Image",
    folder: "settings/hero-showcase",
    urlColumn: "heroShowcase1ImageUrl",
    publicIdColumn: "heroShowcase1ImagePublicId",
  },
  {
    field: "heroShowcase2Image",
    folder: "settings/hero-showcase",
    urlColumn: "heroShowcase2ImageUrl",
    publicIdColumn: "heroShowcase2ImagePublicId",
  },
  {
    field: "heroShowcase3Image",
    folder: "settings/hero-showcase",
    urlColumn: "heroShowcase3ImageUrl",
    publicIdColumn: "heroShowcase3ImagePublicId",
  },
  {
    field: "editorialImage",
    folder: "settings/editorial",
    urlColumn: "editorialImageUrl",
    publicIdColumn: "editorialImagePublicId",
  },
  {
    field: "finalCtaImage",
    folder: "settings/final-cta",
    urlColumn: "finalCtaImageUrl",
    publicIdColumn: "finalCtaImagePublicId",
  },
];

const VALID_BUTTON_ICONS: HeroButtonIcon[] = [
  "none",
  "arrow-right",
  "shopping-bag",
  "tag",
  "sparkles",
  "flame",
  "zap",
];

function sanitizeButtons(raw: unknown): HeroButtonConfig[] {
  if (!Array.isArray(raw)) return DEFAULT_HERO_CONFIG.buttons;
  const result: HeroButtonConfig[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const label = typeof obj.label === "string" ? obj.label.trim() : "";
    if (!label) continue;
    const variant =
      obj.variant === "outline" || obj.variant === "secondary" ? obj.variant : "primary";
    const icon: HeroButtonIcon =
      typeof obj.icon === "string" && VALID_BUTTON_ICONS.includes(obj.icon as HeroButtonIcon)
        ? (obj.icon as HeroButtonIcon)
        : i === 0
          ? "arrow-right"
          : "none";
    result.push({
      id: typeof obj.id === "string" && obj.id ? obj.id : `btn-${i + 1}`,
      label,
      href: typeof obj.href === "string" && obj.href.trim() ? obj.href.trim() : "/shop",
      variant,
      icon,
      bgColor: typeof obj.bgColor === "string" ? obj.bgColor.trim() : "",
      textColor: typeof obj.textColor === "string" ? obj.textColor.trim() : "",
    });
  }
  return result.length > 0 ? result : DEFAULT_HERO_CONFIG.buttons;
}

export async function updateStoreSettingsAction(
  _prev: SettingsActionResult | null,
  formData: FormData
): Promise<SettingsActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { success: false, message: "You must be signed in as an admin." };
  }

  const parsed = storeSettingsSchema.safeParse({
    announcementText: formData.get("announcementText")?.toString() ?? "",
    announcementEnabled: formData.get("announcementEnabled") === "on",

    heroHeadline: formData.get("heroHeadline")?.toString() ?? "",
    heroSubheadline: formData.get("heroSubheadline")?.toString() ?? "",
    heroProduct1: formData.get("heroProduct1")?.toString() ?? "",
    heroProduct2: formData.get("heroProduct2")?.toString() ?? "",
    heroProduct3: formData.get("heroProduct3")?.toString() ?? "",

    editorialEyebrow: formData.get("editorialEyebrow")?.toString() ?? "",
    editorialHeading: formData.get("editorialHeading")?.toString() ?? "",
    editorialBody: formData.get("editorialBody")?.toString() ?? "",
    editorialCtaLabel: formData.get("editorialCtaLabel")?.toString() ?? "",

    brandStatementHeading: formData.get("brandStatementHeading")?.toString() ?? "",
    brandStatementBody: formData.get("brandStatementBody")?.toString() ?? "",

    finalCtaHeadingLine1: formData.get("finalCtaHeadingLine1")?.toString() ?? "",
    finalCtaHeadingLine2: formData.get("finalCtaHeadingLine2")?.toString() ?? "",
    finalCtaButtonLabel: formData.get("finalCtaButtonLabel")?.toString() ?? "",

    // These inputs hold Taka, not cents — convert before validation.
    deliveryFeeCents: unitsToCents(Number(formData.get("deliveryFeeCents")?.toString() ?? "0")),
    freeDeliveryThresholdCents: unitsToCents(
      Number(formData.get("freeDeliveryThresholdCents")?.toString() ?? "0")
    ),
    codEnabled: formData.get("codEnabled") === "on",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { success: false, message: "Please fix the errors below.", fieldErrors };
  }

  try {
  const existing = await prisma.storeSetting.findUnique({ where: { id: 1 } });

  const imageUpdates: Record<string, string | null> = {};
  const uploadErrors: string[] = [];

  for (const slot of IMAGE_SLOTS) {
    const file = formData.get(slot.field);
    const hasNewFile = file instanceof File && file.size > 0;

    if (!hasNewFile) {
      // No replacement chosen — honor an explicit "remove this image" request.
      if (formData.get(`${slot.field}Remove`) === "on") {
        const previousPublicId = existing?.[slot.publicIdColumn] ?? null;
        if (previousPublicId) {
          await imageStorage.remove(previousPublicId).catch(() => {});
        }
        imageUpdates[slot.urlColumn] = null;
        imageUpdates[slot.publicIdColumn] = null;
      }
      continue;
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      uploadErrors.push(`${slot.field}: ${validationError}`);
      continue;
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploaded = await imageStorage.upload(buffer, { folder: slot.folder, contentType: file.type });

      const previousPublicId = existing?.[slot.publicIdColumn] ?? null;
      if (previousPublicId) {
        await imageStorage.remove(previousPublicId).catch(() => {});
      }

      imageUpdates[slot.urlColumn] = uploaded.secureUrl;
      imageUpdates[slot.publicIdColumn] = uploaded.publicId;
    } catch (error) {
      uploadErrors.push(error instanceof Error ? error.message : `${slot.field} upload failed.`);
    }
  }

  // Parse and process HeroCustomConfig (mode, colors, buttons, promoSlides)
  const previousHeroConfig = normalizeHeroConfig(existing?.socialLinks);
  const heroMode: HeroBannerMode =
    formData.get("heroMode")?.toString() === "full-slider" ? "full-slider" : "default";
  const heroEyebrow = (formData.get("heroEyebrow")?.toString() ?? "").trim();
  const heroAccentWord =
    (formData.get("heroAccentWord")?.toString() ?? "").trim() || DEFAULT_HERO_CONFIG.accentWord;
  const heroBgColor = (formData.get("heroBgColor")?.toString() ?? "").trim();
  const heroEyebrowColor = (formData.get("heroEyebrowColor")?.toString() ?? "").trim();
  const heroTextColor = (formData.get("heroTextColor")?.toString() ?? "").trim();
  const heroAccentColor = (formData.get("heroAccentColor")?.toString() ?? "").trim();
  const heroSubtextColor = (formData.get("heroSubtextColor")?.toString() ?? "").trim();
  const heroImageGlowColor = (formData.get("heroImageGlowColor")?.toString() ?? "").trim();

  let rawButtons: unknown = [];
  try {
    rawButtons = JSON.parse(formData.get("heroButtonsJson")?.toString() ?? "[]");
  } catch {
    rawButtons = [];
  }
  const heroButtons = sanitizeButtons(rawButtons);

  let incomingPromoSlides: Record<string, unknown>[] = [];
  try {
    const parsedPromo = JSON.parse(formData.get("heroPromoSlidesJson")?.toString() ?? "[]");
    if (Array.isArray(parsedPromo)) incomingPromoSlides = parsedPromo;
  } catch {
    incomingPromoSlides = [];
  }

  const keptPromoPublicIds = new Set<string>();
  const resolvedPromoSlides: HeroPromoSlide[] = [];

  for (let i = 0; i < incomingPromoSlides.length; i++) {
    const item = incomingPromoSlides[i];
    const slideId =
      typeof item.id === "string" && item.id ? item.id : `promo-slide-${Date.now()}-${i}`;
    let imageUrl = typeof item.imageUrl === "string" ? item.imageUrl.trim() : "";
    let imagePublicId =
      typeof item.imagePublicId === "string" && item.imagePublicId ? item.imagePublicId : null;

    const slideFile = formData.get(`promoSlideImage_${slideId}`);
    if (slideFile instanceof File && slideFile.size > 0) {
      const err = validateImageFile(slideFile);
      if (err) {
        uploadErrors.push(`Offer Banner Slide ${i + 1}: ${err}`);
      } else {
        try {
          const buffer = Buffer.from(await slideFile.arrayBuffer());
          const uploaded = await imageStorage.upload(buffer, {
            folder: "settings/hero-promo",
            contentType: slideFile.type,
          });
          if (imagePublicId) {
            await imageStorage.remove(imagePublicId).catch(() => {});
          }
          imageUrl = uploaded.secureUrl;
          imagePublicId = uploaded.publicId;
        } catch (e) {
          uploadErrors.push(
            e instanceof Error ? e.message : `Offer Banner Slide ${i + 1} upload failed.`
          );
        }
      }
    }

    if (!imageUrl) continue;

    if (imagePublicId) keptPromoPublicIds.add(imagePublicId);

    const textAlign =
      item.textAlign === "center" || item.textAlign === "none" ? item.textAlign : "left";
    const rawOpacity = Number(item.overlayOpacity);
    const overlayOpacity = Number.isFinite(rawOpacity)
      ? Math.max(0, Math.min(85, rawOpacity))
      : 45;

    const slideButtons = Array.isArray(item.buttons) && item.buttons.length > 0
      ? sanitizeButtons(item.buttons)
      : [];

    resolvedPromoSlides.push({
      id: slideId,
      imageUrl,
      imagePublicId,
      eyebrow: typeof item.eyebrow === "string" ? item.eyebrow.trim() : "",
      headline: typeof item.headline === "string" ? item.headline.trim() : "",
      subheadline: typeof item.subheadline === "string" ? item.subheadline.trim() : "",
      linkHref:
        typeof item.linkHref === "string" && item.linkHref.trim()
          ? item.linkHref.trim()
          : "/shop",
      textAlign,
      overlayOpacity,
      eyebrowColor: typeof item.eyebrowColor === "string" ? item.eyebrowColor.trim() : "",
      textColor: typeof item.textColor === "string" ? item.textColor.trim() : "",
      subtextColor: typeof item.subtextColor === "string" ? item.subtextColor.trim() : "",
      accentColor: typeof item.accentColor === "string" ? item.accentColor.trim() : "",
      buttons: slideButtons,
    });
  }

  for (const oldSlide of previousHeroConfig.promoSlides) {
    if (oldSlide.imagePublicId && !keptPromoPublicIds.has(oldSlide.imagePublicId)) {
      await imageStorage.remove(oldSlide.imagePublicId).catch(() => {});
    }
  }

  const nextHeroConfig: HeroCustomConfig = {
    mode: heroMode,
    eyebrow: heroEyebrow,
    accentWord: heroAccentWord,
    bgColor: heroBgColor,
    eyebrowColor: heroEyebrowColor,
    textColor: heroTextColor,
    accentColor: heroAccentColor,
    subtextColor: heroSubtextColor,
    imageGlowColor: heroImageGlowColor,
    buttons: heroButtons,
    promoSlides: resolvedPromoSlides,
  };

  // Parse and process FooterCustomConfig (social links + shop info)
  const previousFooterConfig = normalizeFooterConfig(existing?.socialLinks);
  let nextFooterConfig: FooterCustomConfig = previousFooterConfig;
  const footerConfigJsonRaw = formData.get("footerConfigJson")?.toString();

  if (footerConfigJsonRaw) {
    try {
      const parsedFooter = JSON.parse(footerConfigJsonRaw);
      nextFooterConfig = normalizeFooterConfig({ footerConfig: parsedFooter });
    } catch {
      // fallback
    }
  } else {
    const getSocialItem = (name: string, defaultUrl: string) => {
      const enabled = formData.get(`social_${name}_enabled`) === "on";
      const url = (formData.get(`social_${name}_url`)?.toString() ?? defaultUrl).trim();
      return { enabled, url };
    };

    nextFooterConfig = {
      socials: {
        instagram: getSocialItem("instagram", "https://instagram.com"),
        facebook: getSocialItem("facebook", "https://facebook.com"),
        twitter: getSocialItem("twitter", "https://x.com"),
        whatsapp: getSocialItem("whatsapp", "https://wa.me"),
        tiktok: getSocialItem("tiktok", "https://tiktok.com"),
        telegram: getSocialItem("telegram", "https://t.me"),
      },
      shopInfo: {
        address: (formData.get("footerShopAddress")?.toString() ?? previousFooterConfig.shopInfo.address).trim(),
        phone: (formData.get("footerShopPhone")?.toString() ?? previousFooterConfig.shopInfo.phone).trim(),
        secondaryPhone: (formData.get("footerShopSecondaryPhone")?.toString() ?? "").trim(),
        email: (formData.get("footerShopEmail")?.toString() ?? previousFooterConfig.shopInfo.email).trim(),
        hours: (formData.get("footerShopHours")?.toString() ?? previousFooterConfig.shopInfo.hours).trim(),
        aboutText: (formData.get("footerAboutText")?.toString() ?? previousFooterConfig.shopInfo.aboutText).trim(),
      },
    };
  }

  const existingSocialLinks =
    existing?.socialLinks &&
    typeof existing.socialLinks === "object" &&
    !Array.isArray(existing.socialLinks)
      ? (existing.socialLinks as Record<string, unknown>)
      : {};

  const socialLinks = {
    ...existingSocialLinks,
    heroConfig: nextHeroConfig,
    footerConfig: nextFooterConfig,
  } as unknown as Prisma.InputJsonValue;

  const { heroProduct1, heroProduct2, heroProduct3, ...rest } = parsed.data;
  // Keep position: a blank slot means "auto-fill this slide", not "shift the others up".
  const heroShowcaseProductIds = [heroProduct1 || null, heroProduct2 || null, heroProduct3 || null];

  const data = { ...rest, heroShowcaseProductIds, ...imageUpdates, socialLinks };

  await prisma.storeSetting.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");

  if (uploadErrors.length > 0) {
    return {
      success: true,
      message: `Settings saved, but some images failed to upload: ${uploadErrors.join("; ")}`,
    };
  }

  return { success: true, message: "Settings saved." };
  } catch {
    return { success: false, message: "Couldn't save settings — the database is unreachable. Please try again shortly." };
  }
}
