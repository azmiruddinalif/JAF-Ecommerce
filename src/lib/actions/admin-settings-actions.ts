"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth/session";
import { storeSettingsSchema } from "@/lib/validation/schemas";
import { imageStorage } from "@/lib/storage";
import { validateImageFile } from "@/lib/storage/validate";
import { unitsToCents } from "@/lib/money";

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

  const { heroProduct1, heroProduct2, heroProduct3, ...rest } = parsed.data;
  // Keep position: a blank slot means "auto-fill this slide", not "shift the others up".
  const heroShowcaseProductIds = [heroProduct1 || null, heroProduct2 || null, heroProduct3 || null];

  const data = { ...rest, heroShowcaseProductIds, ...imageUpdates };

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
}
