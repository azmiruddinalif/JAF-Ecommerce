import "server-only";
import { prisma } from "@/lib/prisma";

export interface TrustStripItem {
  label: string;
}

export interface StoreSettingsView {
  announcementText: string;
  announcementEnabled: boolean;

  heroHeadline: string;
  heroSubheadline: string;
  heroImageUrl: string | null;
  heroShowcaseProductIds: (string | null)[];
  heroShowcaseImageUrls: (string | null)[];

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

const DEFAULTS: StoreSettingsView = {
  announcementText: "NEW SEASON HAS ARRIVED • FREE DELIVERY ON SELECTED ORDERS",
  announcementEnabled: true,

  heroHeadline: "WE ARE THE ION TO FASHION",
  heroSubheadline:
    "Premium football jerseys for the modern fan. Authentic fits, editorial style.",
  heroImageUrl: null,
  heroShowcaseProductIds: [null, null, null],
  heroShowcaseImageUrls: [null, null, null],

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
    "Every JAF jersey is built on the same tension that drives the game — discipline and flair, heritage and rebellion. Wear it on matchday. Wear it every day.",
  editorialCtaLabel: "DISCOVER THE EDIT",
  editorialImageUrl: null,

  brandStatementHeading: "WE ARE THE ION TO FASHION",
  brandStatementBody:
    "JAF was built for fans who treat the jersey as more than merchandise. It is identity. We obsess over fit, fabric and finish so that every release feels as premium off the pitch as the clubs we celebrate feel on it. Football is our language — fashion is how we speak it.",

  finalCtaHeadingLine1: "FIND YOUR JERSEY.",
  finalCtaHeadingLine2: "WEAR YOUR GAME.",
  finalCtaButtonLabel: "SHOP NOW",
  finalCtaImageUrl: null,

  deliveryFeeCents: 6000,
  freeDeliveryThresholdCents: 300000,
  codEnabled: true,
};

export async function getStoreSettings(): Promise<StoreSettingsView> {
  const row = await prisma.storeSetting.findUnique({ where: { id: 1 } });
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
