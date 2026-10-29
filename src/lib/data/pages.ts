import "server-only";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

export type EditablePageKey = "about" | "shipping-returns" | "privacy" | "terms";

export type SectionImagePosition = "top" | "bottom" | "left" | "right";

export interface PageSlide {
  id: string;
  imageUrl: string;
  imagePublicId: string | null;
  heading: string;
  subheading: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface PageSection {
  id: string;
  heading: string;
  body: string;
  imageUrl: string | null;
  imagePublicId: string | null;
  imagePosition: SectionImagePosition;
}

export interface CustomPageContent {
  key: EditablePageKey;
  label: string;
  path: string;
  eyebrow: string;
  title: string;
  intro: string;
  bannerImageUrl: string | null;
  bannerImagePublicId: string | null;
  slides: PageSlide[];
  sections: PageSection[];
  showBrandStatement: boolean;
  seoTitle: string;
  seoDescription: string;
}

export const EDITABLE_PAGE_KEYS: EditablePageKey[] = [
  "about",
  "shipping-returns",
  "privacy",
  "terms",
];

export const DEFAULT_PAGES: Record<EditablePageKey, CustomPageContent> = {
  about: {
    key: "about",
    label: "About Page",
    path: "/about",
    eyebrow: "About JAF",
    title: "THE BRAND",
    intro: [
      "JAF (Jerseys & Fashion) started with a simple frustration: most football jerseys sold as everyday fashion feel like an afterthought. Based in Dhaka, Bangladesh, we set out to build a dedicated football apparel destination that treats every club kit, national team shirt, and retro jersey with the same respect fashion houses give a tailored jacket — considered athletic fits, breathable moisture-wicking fabrics, and authentic detailing that holds up on the street as well as it does on matchday.",
      "Every collection we curate and release moves between two worlds: the heritage and discipline of world football and the self-expression of modern streetwear. Whether you are backing your favorite Premier League or La Liga club, wearing your national team colors during international tournaments, or collecting iconic retro kits from football history, JAF delivers jerseys engineered for comfort, durability, and sharp style.",
      "From precision-woven crests and vibrant sublimation prints to lightweight, breathable mesh panels across sizes S to XXL, every jersey in our catalog is inspected for quality before it reaches your doorstep. With fast nationwide delivery across Bangladesh and hassle-free Cash on Delivery, JAF makes it effortless for every supporter to wear their passion on and off the pitch.",
    ].join("\n\n"),
    bannerImageUrl: null,
    bannerImagePublicId: null,
    slides: [],
    sections: [],
    showBrandStatement: true,
    seoTitle: "About JAF — Premium Football Jerseys & Streetwear Sports Fashion",
    seoDescription:
      "Learn the story behind JAF (Jerseys & Fashion) in Dhaka, Bangladesh. We craft authentic-fit club kits, national team football jerseys, and retro soccer apparel for matchday and everyday streetwear.",
  },
  "shipping-returns": {
    key: "shipping-returns",
    label: "Shipping & Returns",
    path: "/shipping-returns",
    eyebrow: "",
    title: "SHIPPING & RETURNS",
    intro: "",
    bannerImageUrl: null,
    bannerImagePublicId: null,
    slides: [],
    sections: [
      {
        id: "delivery",
        heading: "Delivery",
        body: "All football jersey and sports apparel orders are carefully inspected, packed, and dispatched within 1–2 business days via our trusted nationwide courier partners across Dhaka and all districts of Bangladesh. Standard delivery fees and complimentary free delivery thresholds on qualifying orders are automatically calculated and displayed at checkout before you confirm your order.",
        imageUrl: null,
        imagePublicId: null,
        imagePosition: "top",
      },
      {
        id: "exchanges",
        heading: "Exchanges",
        body: "Ordered the wrong jersey size? Contact our support team within 7 days of receiving your delivery with your JAF order number for a hassle-free size exchange (from S to XXL), subject to stock availability. Returned jerseys must be unworn, unwashed, and in their original condition with all factory tags and packaging intact. Custom-printed player name or number jerseys are eligible for exchange only in the event of a manufacturing defect or dispatch error.",
        imageUrl: null,
        imagePublicId: null,
        imagePosition: "top",
      },
      {
        id: "cod",
        heading: "Cash on Delivery",
        body: "Shop with complete confidence using Cash on Delivery (COD) anywhere in Bangladesh. Pay in cash directly to the courier when your football kit arrives at your doorstep — no advance online card payment required.",
        imageUrl: null,
        imagePublicId: null,
        imagePosition: "top",
      },
    ],
    showBrandStatement: false,
    seoTitle: "Shipping, Delivery & Jersey Size Exchange Policy",
    seoDescription:
      "Read JAF's shipping and return policy for football jerseys across Dhaka and all of Bangladesh. Fast courier delivery, Cash on Delivery (COD), and 7-day size exchanges.",
  },
  privacy: {
    key: "privacy",
    label: "Privacy Policy",
    path: "/privacy",
    eyebrow: "",
    title: "PRIVACY POLICY",
    intro: [
      "At JAF (Jerseys & Fashion), we respect your privacy and collect only the essential personal information required to process and deliver your football jersey order: your full name, phone number, email address (optional, for digital invoice delivery), and shipping address. This information is used exclusively to fulfill your order, coordinate courier delivery, and provide customer support, and is never sold or rented to third-party marketers.",
      "Because payments are collected via Cash on Delivery (COD) when your jerseys arrive, no sensitive credit card, debit card, or banking credentials are ever transmitted to or stored on JAF servers.",
      "Our website uses essential first-party cookies solely to maintain your active shopping cart session across visits so your selected jersey sizes and items remain saved while you browse. You may request to review, update, or delete your stored order contact details at any time by reaching out to our customer support team.",
    ].join("\n\n"),
    bannerImageUrl: null,
    bannerImagePublicId: null,
    slides: [],
    sections: [],
    showBrandStatement: false,
    seoTitle: "Privacy Policy — Data Protection & Secure Jersey Shopping",
    seoDescription:
      "Learn how JAF (Jerseys & Fashion) protects your personal data, delivery details, and shopping privacy when you order football jerseys online in Bangladesh.",
  },
  terms: {
    key: "terms",
    label: "Terms of Service",
    path: "/terms",
    eyebrow: "",
    title: "TERMS OF SERVICE",
    intro: [
      "By browsing and placing an order with JAF (Jerseys & Fashion), you agree to provide accurate contact and shipping information — including a valid Bangladesh phone number and complete delivery address — and to be available to receive your football jersey parcel and complete Cash on Delivery payment when our courier partner arrives.",
      "All jersey prices are listed in Bangladeshi Taka (BDT). Product pricing, seasonal kit availability, size stock (S through XXL), and promotional discounts are subject to change without prior notice. Orders are officially confirmed upon stock verification and completed once Cash on Delivery payment is accepted at delivery.",
      "All product photography and studio imagery on JAF are carefully captured to represent each Home, Away, Third, and Retro football kit accurately; however, minor variations in fabric shade or crest sheen may occur due to screen display settings and lighting conditions.",
    ].join("\n\n"),
    bannerImageUrl: null,
    bannerImagePublicId: null,
    slides: [],
    sections: [],
    showBrandStatement: false,
    seoTitle: "Terms of Service — Ordering & Conditions",
    seoDescription:
      "Review the Terms of Service for shopping at JAF (Jerseys & Fashion), covering football jersey orders, pricing in BDT, Cash on Delivery, and size exchanges.",
  },
};

function normalizeSlide(raw: unknown, index: number): PageSlide | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const imageUrl = typeof obj.imageUrl === "string" ? obj.imageUrl : "";
  if (!imageUrl) return null;
  return {
    id: typeof obj.id === "string" && obj.id ? obj.id : `slide-${index + 1}`,
    imageUrl,
    imagePublicId: typeof obj.imagePublicId === "string" ? obj.imagePublicId : null,
    heading: typeof obj.heading === "string" ? obj.heading : "",
    subheading: typeof obj.subheading === "string" ? obj.subheading : "",
    ctaLabel: typeof obj.ctaLabel === "string" ? obj.ctaLabel : "",
    ctaHref: typeof obj.ctaHref === "string" ? obj.ctaHref : "",
  };
}

function normalizeSection(raw: unknown, index: number): PageSection | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const position = obj.imagePosition;
  const validPosition: SectionImagePosition =
    position === "top" || position === "bottom" || position === "left" || position === "right"
      ? position
      : "top";

  return {
    id: typeof obj.id === "string" && obj.id ? obj.id : `section-${index + 1}`,
    heading: typeof obj.heading === "string" ? obj.heading : "",
    body: typeof obj.body === "string" ? obj.body : "",
    imageUrl: typeof obj.imageUrl === "string" && obj.imageUrl ? obj.imageUrl : null,
    imagePublicId:
      typeof obj.imagePublicId === "string" && obj.imagePublicId ? obj.imagePublicId : null,
    imagePosition: validPosition,
  };
}

function mergePageContent(key: EditablePageKey, raw: unknown): CustomPageContent {
  const fallback = DEFAULT_PAGES[key];
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Record<string, unknown>;

  const slides = Array.isArray(obj.slides)
    ? obj.slides.map((s, i) => normalizeSlide(s, i)).filter((s): s is PageSlide => s !== null)
    : fallback.slides;

  const sections = Array.isArray(obj.sections)
    ? obj.sections
        .map((s, i) => normalizeSection(s, i))
        .filter((s): s is PageSection => s !== null)
    : fallback.sections;

  return {
    key,
    label: fallback.label,
    path: fallback.path,
    eyebrow: typeof obj.eyebrow === "string" ? obj.eyebrow : fallback.eyebrow,
    title: typeof obj.title === "string" && obj.title.trim() ? obj.title : fallback.title,
    intro: typeof obj.intro === "string" ? obj.intro : fallback.intro,
    bannerImageUrl:
      typeof obj.bannerImageUrl === "string" && obj.bannerImageUrl ? obj.bannerImageUrl : null,
    bannerImagePublicId:
      typeof obj.bannerImagePublicId === "string" && obj.bannerImagePublicId
        ? obj.bannerImagePublicId
        : null,
    slides,
    sections,
    showBrandStatement:
      typeof obj.showBrandStatement === "boolean"
        ? obj.showBrandStatement
        : fallback.showBrandStatement,
    seoTitle:
      typeof obj.seoTitle === "string" && obj.seoTitle.trim() ? obj.seoTitle : fallback.seoTitle,
    seoDescription:
      typeof obj.seoDescription === "string" && obj.seoDescription.trim()
        ? obj.seoDescription
        : fallback.seoDescription,
  };
}

export async function getAllCustomPages(): Promise<Record<EditablePageKey, CustomPageContent>> {
  await connection();

  try {
    const row = await prisma.storeSetting.findUnique({
      where: { id: 1 },
      select: { socialLinks: true },
    });

    const root =
      row?.socialLinks && typeof row.socialLinks === "object" && !Array.isArray(row.socialLinks)
        ? (row.socialLinks as Record<string, unknown>)
        : {};

    const storedPages =
      root.pages && typeof root.pages === "object" && !Array.isArray(root.pages)
        ? (root.pages as Record<string, unknown>)
        : {};

    return {
      about: mergePageContent("about", storedPages["about"]),
      "shipping-returns": mergePageContent("shipping-returns", storedPages["shipping-returns"]),
      privacy: mergePageContent("privacy", storedPages["privacy"]),
      terms: mergePageContent("terms", storedPages["terms"]),
    };
  } catch {
    return DEFAULT_PAGES;
  }
}

export async function getCustomPage(key: EditablePageKey): Promise<CustomPageContent> {
  const all = await getAllCustomPages();
  return all[key];
}
