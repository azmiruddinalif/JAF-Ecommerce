"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth/session";
import { imageStorage } from "@/lib/storage";
import { validateImageFile } from "@/lib/storage/validate";
import {
  DEFAULT_PAGES,
  EDITABLE_PAGE_KEYS,
  getAllCustomPages,
  type CustomPageContent,
  type EditablePageKey,
  type PageSection,
  type PageSlide,
  type SectionImagePosition,
} from "@/lib/data/pages";

export interface CustomPageActionResult {
  success: boolean;
  message: string;
  updatedPage?: CustomPageContent;
}

interface IncomingSlideMeta {
  id: string;
  heading: string;
  subheading: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl?: string | null;
  imagePublicId?: string | null;
}

interface IncomingSectionMeta {
  id: string;
  heading: string;
  body: string;
  imagePosition: SectionImagePosition;
  imageUrl?: string | null;
  imagePublicId?: string | null;
}

export async function updateCustomPageAction(
  pageKey: EditablePageKey,
  _prev: CustomPageActionResult | null,
  formData: FormData
): Promise<CustomPageActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { success: false, message: "You must be signed in as an admin." };
  }

  if (!EDITABLE_PAGE_KEYS.includes(pageKey)) {
    return { success: false, message: "Invalid page selected." };
  }

  try {
  const allPages = await getAllCustomPages();
  const current = allPages[pageKey];
  const fallback = DEFAULT_PAGES[pageKey];

  const eyebrow = (formData.get("eyebrow")?.toString() ?? "").trim();
  const title = (formData.get("title")?.toString() ?? "").trim() || fallback.title;
  const intro = (formData.get("intro")?.toString() ?? "").replace(/\r\n/g, "\n").trim();
  const showBrandStatement = formData.get("showBrandStatement") === "on";
  const seoTitle = (formData.get("seoTitle")?.toString() ?? "").trim() || fallback.seoTitle;
  const seoDescription =
    (formData.get("seoDescription")?.toString() ?? "").trim() || fallback.seoDescription;

  const uploadErrors: string[] = [];

  // 1. Handle Main Banner Picture
  let bannerImageUrl = current.bannerImageUrl;
  let bannerImagePublicId = current.bannerImagePublicId;

  const bannerFile = formData.get("bannerImage");
  if (bannerFile instanceof File && bannerFile.size > 0) {
    const err = validateImageFile(bannerFile);
    if (err) {
      uploadErrors.push(`Banner picture: ${err}`);
    } else {
      try {
        const buffer = Buffer.from(await bannerFile.arrayBuffer());
        const uploaded = await imageStorage.upload(buffer, {
          folder: `pages/${pageKey}/banner`,
          contentType: bannerFile.type,
        });
        if (bannerImagePublicId) {
          await imageStorage.remove(bannerImagePublicId).catch(() => {});
        }
        bannerImageUrl = uploaded.secureUrl;
        bannerImagePublicId = uploaded.publicId;
      } catch (e) {
        uploadErrors.push(e instanceof Error ? e.message : "Banner picture upload failed.");
      }
    }
  } else if (formData.get("bannerImageRemove") === "on") {
    if (bannerImagePublicId) {
      await imageStorage.remove(bannerImagePublicId).catch(() => {});
    }
    bannerImageUrl = null;
    bannerImagePublicId = null;
  }

  // 2. Handle Slider Slides
  let incomingSlides: IncomingSlideMeta[] = [];
  try {
    const rawSlides = formData.get("slidesJson")?.toString() ?? "[]";
    const parsed = JSON.parse(rawSlides);
    if (Array.isArray(parsed)) incomingSlides = parsed;
  } catch {
    incomingSlides = [];
  }

  const keptSlidePublicIds = new Set<string>();
  const resolvedSlides: PageSlide[] = [];

  for (let i = 0; i < incomingSlides.length; i++) {
    const item = incomingSlides[i];
    const slideId = typeof item.id === "string" && item.id ? item.id : `slide-${Date.now()}-${i}`;
    let imageUrl = typeof item.imageUrl === "string" && item.imageUrl ? item.imageUrl : "";
    let imagePublicId =
      typeof item.imagePublicId === "string" && item.imagePublicId ? item.imagePublicId : null;

    const slideFile = formData.get(`slideImage_${slideId}`);
    if (slideFile instanceof File && slideFile.size > 0) {
      const err = validateImageFile(slideFile);
      if (err) {
        uploadErrors.push(`Slide ${i + 1} image: ${err}`);
      } else {
        try {
          const buffer = Buffer.from(await slideFile.arrayBuffer());
          const uploaded = await imageStorage.upload(buffer, {
            folder: `pages/${pageKey}/slides`,
            contentType: slideFile.type,
          });
          if (imagePublicId) {
            await imageStorage.remove(imagePublicId).catch(() => {});
          }
          imageUrl = uploaded.secureUrl;
          imagePublicId = uploaded.publicId;
        } catch (e) {
          uploadErrors.push(e instanceof Error ? e.message : `Slide ${i + 1} upload failed.`);
        }
      }
    }

    if (!imageUrl) {
      // A slide without an image cannot be displayed; skip it.
      continue;
    }

    if (imagePublicId) keptSlidePublicIds.add(imagePublicId);

    resolvedSlides.push({
      id: slideId,
      imageUrl,
      imagePublicId,
      heading: (item.heading ?? "").trim(),
      subheading: (item.subheading ?? "").trim(),
      ctaLabel: (item.ctaLabel ?? "").trim(),
      ctaHref: (item.ctaHref ?? "").trim(),
    });
  }

  // Clean up any removed slide images from storage
  for (const oldSlide of current.slides) {
    if (oldSlide.imagePublicId && !keptSlidePublicIds.has(oldSlide.imagePublicId)) {
      await imageStorage.remove(oldSlide.imagePublicId).catch(() => {});
    }
  }

  // 3. Handle Content Sections
  let incomingSections: IncomingSectionMeta[] = [];
  try {
    const rawSections = formData.get("sectionsJson")?.toString() ?? "[]";
    const parsed = JSON.parse(rawSections);
    if (Array.isArray(parsed)) incomingSections = parsed;
  } catch {
    incomingSections = [];
  }

  const keptSectionPublicIds = new Set<string>();
  const resolvedSections: PageSection[] = [];

  for (let i = 0; i < incomingSections.length; i++) {
    const item = incomingSections[i];
    const sectionId =
      typeof item.id === "string" && item.id ? item.id : `section-${Date.now()}-${i}`;
    let imageUrl = typeof item.imageUrl === "string" && item.imageUrl ? item.imageUrl : null;
    let imagePublicId =
      typeof item.imagePublicId === "string" && item.imagePublicId ? item.imagePublicId : null;

    const pos = item.imagePosition;
    const imagePosition: SectionImagePosition =
      pos === "top" || pos === "bottom" || pos === "left" || pos === "right" ? pos : "top";

    const sectionFile = formData.get(`sectionImage_${sectionId}`);
    const removeRequested = formData.get(`sectionImageRemove_${sectionId}`) === "on";

    if (sectionFile instanceof File && sectionFile.size > 0) {
      const err = validateImageFile(sectionFile);
      if (err) {
        uploadErrors.push(`Section ${i + 1} picture: ${err}`);
      } else {
        try {
          const buffer = Buffer.from(await sectionFile.arrayBuffer());
          const uploaded = await imageStorage.upload(buffer, {
            folder: `pages/${pageKey}/sections`,
            contentType: sectionFile.type,
          });
          if (imagePublicId) {
            await imageStorage.remove(imagePublicId).catch(() => {});
          }
          imageUrl = uploaded.secureUrl;
          imagePublicId = uploaded.publicId;
        } catch (e) {
          uploadErrors.push(e instanceof Error ? e.message : `Section ${i + 1} upload failed.`);
        }
      }
    } else if (removeRequested) {
      if (imagePublicId) {
        await imageStorage.remove(imagePublicId).catch(() => {});
      }
      imageUrl = null;
      imagePublicId = null;
    }

    const heading = (item.heading ?? "").trim();
    const body = (item.body ?? "").replace(/\r\n/g, "\n").trim();

    if (!heading && !body && !imageUrl) {
      continue;
    }

    if (imagePublicId) keptSectionPublicIds.add(imagePublicId);

    resolvedSections.push({
      id: sectionId,
      heading,
      body,
      imageUrl,
      imagePublicId,
      imagePosition,
    });
  }

  // Clean up any removed section images from storage
  for (const oldSec of current.sections) {
    if (oldSec.imagePublicId && !keptSectionPublicIds.has(oldSec.imagePublicId)) {
      await imageStorage.remove(oldSec.imagePublicId).catch(() => {});
    }
  }

  const updatedPage: CustomPageContent = {
    key: pageKey,
    label: fallback.label,
    path: fallback.path,
    eyebrow,
    title,
    intro,
    bannerImageUrl,
    bannerImagePublicId,
    slides: resolvedSlides,
    sections: resolvedSections,
    showBrandStatement,
    seoTitle,
    seoDescription,
  };

  const existingRow = await prisma.storeSetting.findUnique({
    where: { id: 1 },
    select: { socialLinks: true },
  });

  const existingJson =
    existingRow?.socialLinks &&
    typeof existingRow.socialLinks === "object" &&
    !Array.isArray(existingRow.socialLinks)
      ? (existingRow.socialLinks as Record<string, unknown>)
      : {};

  const existingPages =
    existingJson.pages &&
    typeof existingJson.pages === "object" &&
    !Array.isArray(existingJson.pages)
      ? (existingJson.pages as Record<string, unknown>)
      : {};

  const nextSocialLinks = {
    ...existingJson,
    pages: {
      ...existingPages,
      [pageKey]: updatedPage,
    },
  } as unknown as Prisma.InputJsonValue;

  await prisma.storeSetting.upsert({
    where: { id: 1 },
    create: { id: 1, socialLinks: nextSocialLinks },
    update: { socialLinks: nextSocialLinks },
  });

  revalidatePath(fallback.path);
  revalidatePath("/admin/pages");
  revalidatePath("/admin/settings");

  if (uploadErrors.length > 0) {
    return {
      success: true,
      message: `${fallback.label} saved, with image warnings: ${uploadErrors.join("; ")}`,
      updatedPage,
    };
  }

  return {
    success: true,
    message: `${fallback.label} updated successfully.`,
    updatedPage,
  };
  } catch {
    return {
      success: false,
      message: "Couldn't save this page — the database is unreachable. Please try again shortly.",
    };
  }
}

