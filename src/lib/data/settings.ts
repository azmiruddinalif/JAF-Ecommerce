import "server-only";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

export * from "./settings-shared";
import {
  DEFAULTS,
  normalizeHeroConfig,
  normalizeFooterConfig,
  type StoreSettingsView,
  type TrustStripItem,
} from "./settings-shared";

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

    footerConfig: normalizeFooterConfig(row.socialLinks),
  };
}
