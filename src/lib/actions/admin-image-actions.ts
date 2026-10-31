"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth/session";
import { imageStorage } from "@/lib/storage";
import { validateImageFile } from "@/lib/storage/validate";

export interface ImageActionResult {
  success: boolean;
  message: string;
}

export async function uploadProductImageAction(
  productId: string,
  formData: FormData
): Promise<ImageActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { success: false, message: "You must be signed in as an admin." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, message: "No file provided." };
  }

  const validationError = validateImageFile(file);
  if (validationError) {
    return { success: false, message: validationError };
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });
    if (!product) {
      return { success: false, message: "Product not found." };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await imageStorage.upload(buffer, {
      folder: `products/${productId}`,
      contentType: file.type,
    });

    await prisma.productImage.create({
      data: {
        productId,
        publicId: uploaded.publicId,
        secureUrl: uploaded.secureUrl,
        altText: product.name,
        displayOrder: product.images.length,
        isPrimary: product.images.length === 0,
      },
    });

    revalidatePath(`/admin/products/${productId}`);
    revalidatePath("/admin/products");
    revalidatePath(`/product/${product.slug}`);
    revalidatePath("/shop");
    revalidatePath("/");

    return { success: true, message: "Image uploaded." };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Upload failed. Please try again.",
    };
  }
}

export async function addProductImageUrlAction(
  productId: string,
  rawUrl: string
): Promise<ImageActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { success: false, message: "You must be signed in as an admin." };
  }

  const url = rawUrl.trim();
  if (!url || (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("/"))) {
    return { success: false, message: "Enter a valid image URL (https://... or /...)." };
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });
    if (!product) {
      return { success: false, message: "Product not found." };
    }

    await prisma.productImage.create({
      data: {
        productId,
        publicId: `url:${Date.now()}`,
        secureUrl: url,
        altText: product.name,
        displayOrder: product.images.length,
        isPrimary: product.images.length === 0,
      },
    });

    revalidatePath(`/admin/products/${productId}`);
    revalidatePath("/admin/products");
    revalidatePath(`/product/${product.slug}`);
    revalidatePath("/shop");
    revalidatePath("/");

    return { success: true, message: "Image added." };
  } catch {
    return { success: false, message: "Something went wrong while adding the image." };
  }
}

export async function deleteProductImageAction(imageId: string): Promise<ImageActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { success: false, message: "You must be signed in as an admin." };
  }

  try {
    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
      include: { product: true },
    });
    if (!image) return { success: false, message: "Image not found." };

    await prisma.productImage.delete({ where: { id: imageId } });

    try {
      await imageStorage.remove(image.publicId);
    } catch {
      // Non-fatal: the DB record is gone even if the remote asset cleanup failed.
    }

    if (image.isPrimary) {
      const next = await prisma.productImage.findFirst({
        where: { productId: image.productId },
        orderBy: { displayOrder: "asc" },
      });
      if (next) {
        await prisma.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
      }
    }

    revalidatePath(`/admin/products/${image.productId}`);
    revalidatePath(`/product/${image.product.slug}`);

    return { success: true, message: "Image deleted." };
  } catch {
    return { success: false, message: "Something went wrong while deleting the image." };
  }
}

export async function setPrimaryProductImageAction(imageId: string): Promise<ImageActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { success: false, message: "You must be signed in as an admin." };
  }

  try {
    const image = await prisma.productImage.findUnique({ where: { id: imageId }, include: { product: true } });
    if (!image) return { success: false, message: "Image not found." };

    await prisma.$transaction([
      prisma.productImage.updateMany({
        where: { productId: image.productId },
        data: { isPrimary: false },
      }),
      prisma.productImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
    ]);

    revalidatePath(`/admin/products/${image.productId}`);
    revalidatePath(`/product/${image.product.slug}`);

    return { success: true, message: "Primary image updated." };
  } catch {
    return { success: false, message: "Something went wrong while updating the primary image." };
  }
}

export async function reorderProductImagesAction(
  productId: string,
  orderedImageIds: string[]
): Promise<ImageActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { success: false, message: "You must be signed in as an admin." };
  }

  try {
    await prisma.$transaction(
      orderedImageIds.map((id, index) =>
        prisma.productImage.update({ where: { id }, data: { displayOrder: index } })
      )
    );

    revalidatePath(`/admin/products/${productId}`);

    return { success: true, message: "Image order updated." };
  } catch {
    return { success: false, message: "Something went wrong while reordering images." };
  }
}
