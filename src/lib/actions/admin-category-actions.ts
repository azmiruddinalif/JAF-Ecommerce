"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth/session";
import { categorySchema } from "@/lib/validation/schemas";
import { imageStorage } from "@/lib/storage";
import { validateImageFile } from "@/lib/storage/validate";

export interface CategoryActionResult {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
}

function parseCategoryForm(formData: FormData) {
  return categorySchema.safeParse({
    name: formData.get("name")?.toString() ?? "",
    slug: formData.get("slug")?.toString() ?? "",
    description: formData.get("description")?.toString() ?? "",
    displayOrder: formData.get("displayOrder")?.toString() ?? "0",
    enabled: formData.get("enabled") === "on",
  });
}

async function uploadCategoryImageIfPresent(formData: FormData, categoryId: string) {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return null;

  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await imageStorage.upload(buffer, {
    folder: `categories/${categoryId}`,
    contentType: file.type,
  });
  return uploaded;
}

export async function createCategoryAction(
  _prev: CategoryActionResult | null,
  formData: FormData
): Promise<CategoryActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { success: false, message: "You must be signed in as an admin." };
  }

  const parsed = parseCategoryForm(formData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { success: false, message: "Please fix the errors below.", fieldErrors };
  }

  try {
    const category = await prisma.category.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description || null,
        displayOrder: parsed.data.displayOrder,
        enabled: parsed.data.enabled,
      },
    });

    try {
      const uploaded = await uploadCategoryImageIfPresent(formData, category.id);
      if (uploaded) {
        await prisma.category.update({
          where: { id: category.id },
          data: { imageUrl: uploaded.secureUrl, imagePublicId: uploaded.publicId },
        });
      }
    } catch (error) {
      return {
        success: true,
        message: `Category created, but the image failed to upload: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      };
    }

    revalidatePath("/admin/categories");
    revalidatePath("/");
    revalidatePath("/shop");

    return { success: true, message: "Category created." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, message: "That slug is already in use." };
    }
    return { success: false, message: "Something went wrong while creating the category." };
  }
}

export async function updateCategoryAction(
  categoryId: string,
  _prev: CategoryActionResult | null,
  formData: FormData
): Promise<CategoryActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { success: false, message: "You must be signed in as an admin." };
  }

  const parsed = parseCategoryForm(formData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { success: false, message: "Please fix the errors below.", fieldErrors };
  }

  try {
    await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description || null,
        displayOrder: parsed.data.displayOrder,
        enabled: parsed.data.enabled,
      },
    });

    const existing = await prisma.category.findUnique({ where: { id: categoryId } });

    try {
      const uploaded = await uploadCategoryImageIfPresent(formData, categoryId);
      if (uploaded) {
        if (existing?.imagePublicId) {
          await imageStorage.remove(existing.imagePublicId).catch(() => {});
        }
        await prisma.category.update({
          where: { id: categoryId },
          data: { imageUrl: uploaded.secureUrl, imagePublicId: uploaded.publicId },
        });
      } else if (formData.get("imageRemove") === "on" && existing?.imagePublicId) {
        await imageStorage.remove(existing.imagePublicId).catch(() => {});
        await prisma.category.update({
          where: { id: categoryId },
          data: { imageUrl: null, imagePublicId: null },
        });
      }
    } catch (error) {
      return {
        success: true,
        message: `Category updated, but the image failed to upload: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      };
    }

    revalidatePath("/admin/categories");
    revalidatePath("/");
    revalidatePath("/shop");

    return { success: true, message: "Category updated." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, message: "That slug is already in use." };
    }
    return { success: false, message: "Something went wrong while updating the category." };
  }
}

export async function deleteCategoryAction(categoryId: string): Promise<CategoryActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { success: false, message: "You must be signed in as an admin." };
  }

  try {
    const category = await prisma.category.delete({ where: { id: categoryId } });
    if (category.imagePublicId) {
      await imageStorage.remove(category.imagePublicId).catch(() => {});
    }
    revalidatePath("/admin/categories");
    revalidatePath("/");
    return { success: true, message: "Category deleted." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return {
        success: false,
        message: "This category has products assigned to it. Move or delete them first.",
      };
    }
    return { success: false, message: "Something went wrong while deleting the category." };
  }
}

export async function toggleCategoryEnabledAction(categoryId: string): Promise<CategoryActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { success: false, message: "You must be signed in as an admin." };
  }

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) return { success: false, message: "Category not found." };

  await prisma.category.update({ where: { id: categoryId }, data: { enabled: !category.enabled } });
  revalidatePath("/admin/categories");
  revalidatePath("/");

  return { success: true, message: "Updated." };
}
