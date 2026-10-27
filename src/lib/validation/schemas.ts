import { z } from "zod";
import { JERSEY_TYPES } from "@/lib/constants";

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers and hyphens"),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  displayOrder: z.coerce.number().int().min(0).default(0),
  enabled: z.coerce.boolean().default(true),
});

export const variantInputSchema = z.object({
  id: z.string().optional(),
  size: z.string().trim().min(1, "Size is required").max(20),
  sku: z.string().trim().min(2, "SKU is required").max(60),
  priceCents: z.coerce.number().int().min(0).optional().nullable(),
  stock: z.coerce.number().int().min(0).default(0),
  color: z.string().trim().max(40).optional().or(z.literal("")),
  edition: z.string().trim().max(40).optional().or(z.literal("")),
  playerName: z.string().trim().max(60).optional().or(z.literal("")),
  playerNumber: z.string().trim().max(10).optional().or(z.literal("")),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(140),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .max(140)
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers and hyphens"),
  description: z.string().trim().min(10, "Description is required").max(5000),
  categoryId: z.string().trim().min(1, "Category is required"),
  type: z.enum(JERSEY_TYPES, { message: "Type is required" }),
  basePriceCents: z.coerce.number().int().min(0, "Price must be positive"),
  discountPriceCents: z.coerce.number().int().min(0).optional().nullable(),
  sku: z.string().trim().min(2, "SKU is required").max(60),
  brand: z.string().trim().max(60).optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1)).default([]),
  featured: z.coerce.boolean().default(false),
  newArrival: z.coerce.boolean().default(false),
  published: z.coerce.boolean().default(false),
  customizable: z.coerce.boolean().default(false),
  showInHeroBanner: z.coerce.boolean().default(false),
  heroBannerLabel: z.string().trim().max(60).optional().or(z.literal("")),
  variants: z.array(variantInputSchema).min(1, "Add at least one size/variant"),
});

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "Full name is required").max(120),
  customerPhone: z
    .string()
    .trim()
    .min(7, "Phone number is required")
    .max(20)
    .regex(/^[0-9+\-\s]+$/, "Enter a valid phone number"),
  customerEmail: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  address: z.string().trim().min(5, "Address is required").max(300),
  city: z.string().trim().min(2, "City is required").max(80),
  area: z.string().trim().min(2, "Area is required").max(80),
  deliveryInstructions: z.string().trim().max(300).optional().or(z.literal("")),
  paymentMethod: z.literal("COD"),
});

export const storeSettingsSchema = z.object({
  announcementText: z.string().trim().max(200),
  announcementEnabled: z.coerce.boolean(),

  heroHeadline: z.string().trim().max(120),
  heroSubheadline: z.string().trim().max(300),
  heroProduct1: z.string().trim().optional().or(z.literal("")),
  heroProduct2: z.string().trim().optional().or(z.literal("")),
  heroProduct3: z.string().trim().optional().or(z.literal("")),

  editorialEyebrow: z.string().trim().max(60),
  editorialHeading: z.string().trim().max(120),
  editorialBody: z.string().trim().max(600),
  editorialCtaLabel: z.string().trim().max(60),

  brandStatementHeading: z.string().trim().max(120),
  brandStatementBody: z.string().trim().max(800),

  finalCtaHeadingLine1: z.string().trim().max(80),
  finalCtaHeadingLine2: z.string().trim().max(80),
  finalCtaButtonLabel: z.string().trim().max(40),

  deliveryFeeCents: z.coerce.number().int().min(0),
  freeDeliveryThresholdCents: z.coerce.number().int().min(0),
  codEnabled: z.coerce.boolean(),
});

export const blogPostSchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(160),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .max(160)
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers and hyphens"),
  excerpt: z.string().trim().max(300).optional().or(z.literal("")),
  content: z.string().trim().min(20, "Content is required"),
  tags: z.array(z.string().trim().min(1)).default([]),
  authorName: z.string().trim().min(1, "Author is required").max(80).default("JAF Team"),
  seoTitle: z.string().trim().max(160).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(300).optional().or(z.literal("")),
  published: z.coerce.boolean().default(false),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type VariantInput = z.infer<typeof variantInputSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>;
export type BlogPostInput = z.infer<typeof blogPostSchema>;
