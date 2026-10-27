"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import type { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth/session";
import { productSchema } from "@/lib/validation/schemas";
import { slugify } from "@/lib/slug";
import { unitsToCents } from "@/lib/money";

export interface ProductActionResult {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
  productId?: string;
}

function parseProductForm(formData: FormData) {
  const tagsRaw = formData.get("tags")?.toString() ?? "";
  const variantsRaw = formData.get("variantsJson")?.toString() ?? "[]";

  let variants: unknown[] = [];
  try {
    variants = JSON.parse(variantsRaw);
  } catch {
    variants = [];
  }

  // Price inputs hold Taka (the unit shown to the admin), not cents — convert before validation.
  const discountRaw = formData.get("discountPriceCents")?.toString();
  const basePriceUnits = Number(formData.get("basePriceCents")?.toString() ?? "0");

  return productSchema.safeParse({
    name: formData.get("name")?.toString() ?? "",
    slug: formData.get("slug")?.toString() ?? "",
    description: formData.get("description")?.toString() ?? "",
    categoryId: formData.get("categoryId")?.toString() ?? "",
    type: formData.get("type")?.toString() ?? "",
    basePriceCents: unitsToCents(basePriceUnits),
    discountPriceCents: discountRaw ? unitsToCents(Number(discountRaw)) : null,
    sku: formData.get("sku")?.toString() ?? "",
    brand: formData.get("brand")?.toString() ?? "",
    tags: tagsRaw
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean),
    featured: formData.get("featured") === "on",
    newArrival: formData.get("newArrival") === "on",
    published: formData.get("published") === "on",
    customizable: formData.get("customizable") === "on",
    showInHeroBanner: formData.get("showInHeroBanner") === "on",
    heroBannerLabel: formData.get("heroBannerLabel")?.toString() ?? "",
    variants,
  });
}

function firstFieldErrors(error: ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export async function createProductAction(
  _prev: ProductActionResult | null,
  formData: FormData
): Promise<ProductActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { success: false, message: "You must be signed in as an admin." };
  }

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the errors below.",
      fieldErrors: firstFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;

  try {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug || slugify(data.name),
        description: data.description,
        categoryId: data.categoryId,
        type: data.type,
        basePriceCents: data.basePriceCents,
        discountPriceCents: data.discountPriceCents ?? null,
        sku: data.sku,
        brand: data.brand || null,
        tags: data.tags,
        featured: data.featured,
        newArrival: data.newArrival,
        published: data.published,
        customizable: data.customizable,
        showInHeroBanner: data.showInHeroBanner,
        heroBannerLabel: data.heroBannerLabel || null,
        variants: {
          create: data.variants.map((variant) => ({
            size: variant.size,
            sku: variant.sku,
            priceCents: variant.priceCents ?? null,
            stock: variant.stock,
            color: variant.color || null,
            edition: variant.edition || null,
            playerName: variant.playerName || null,
            playerNumber: variant.playerNumber || null,
          })),
        },
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath("/");

    return { success: true, message: "Product created.", productId: product.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, message: "Slug or SKU already in use. Choose a different one." };
    }
    return { success: false, message: "Something went wrong while creating the product." };
  }
}

export async function updateProductAction(
  productId: string,
  _prev: ProductActionResult | null,
  formData: FormData
): Promise<ProductActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { success: false, message: "You must be signed in as an admin." };
  }

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the errors below.",
      fieldErrors: firstFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  const existingVariants = await prisma.productVariant.findMany({
    where: { productId },
    select: { id: true },
  });
  const existingIds = new Set(existingVariants.map((v) => v.id));
  const incomingIds = new Set(data.variants.filter((v) => v.id).map((v) => v.id as string));
  const idsToDelete = [...existingIds].filter((id) => !incomingIds.has(id));

  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          categoryId: data.categoryId,
          type: data.type,
          basePriceCents: data.basePriceCents,
          discountPriceCents: data.discountPriceCents ?? null,
          sku: data.sku,
          brand: data.brand || null,
          tags: data.tags,
          featured: data.featured,
          newArrival: data.newArrival,
          published: data.published,
          customizable: data.customizable,
          showInHeroBanner: data.showInHeroBanner,
          heroBannerLabel: data.heroBannerLabel || null,
        },
      });

      if (idsToDelete.length > 0) {
        await tx.productVariant.deleteMany({ where: { id: { in: idsToDelete } } });
      }

      for (const variant of data.variants) {
        const payload = {
          size: variant.size,
          sku: variant.sku,
          priceCents: variant.priceCents ?? null,
          stock: variant.stock,
          color: variant.color || null,
          edition: variant.edition || null,
          playerName: variant.playerName || null,
          playerNumber: variant.playerNumber || null,
        };

        if (variant.id && existingIds.has(variant.id)) {
          await tx.productVariant.update({ where: { id: variant.id }, data: payload });
        } else {
          await tx.productVariant.create({ data: { ...payload, productId } });
        }
      }
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
    revalidatePath("/shop");
    revalidatePath("/");

    return { success: true, message: "Product updated.", productId };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return { success: false, message: "Slug or SKU already in use. Choose a different one." };
      }
      if (error.code === "P2003") {
        return {
          success: false,
          message: "Can't remove a size that is referenced by an existing order.",
        };
      }
    }
    return { success: false, message: "Something went wrong while updating the product." };
  }
}

export async function deleteProductAction(productId: string): Promise<ProductActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { success: false, message: "You must be signed in as an admin." };
  }

  try {
    await prisma.product.delete({ where: { id: productId } });
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath("/");
    return { success: true, message: "Product deleted." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return {
        success: false,
        message: "This product has existing orders and can't be deleted. Unpublish it instead.",
      };
    }
    return { success: false, message: "Something went wrong while deleting the product." };
  }
}

export async function duplicateProductAction(productId: string): Promise<ProductActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { success: false, message: "You must be signed in as an admin." };
  }

  const original = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: true, images: true },
  });

  if (!original) {
    return { success: false, message: "Product not found." };
  }

  const suffix = Math.random().toString(36).slice(2, 6);

  const copy = await prisma.product.create({
    data: {
      name: `${original.name} (Copy)`,
      slug: `${original.slug}-copy-${suffix}`,
      description: original.description,
      categoryId: original.categoryId,
      type: original.type,
      basePriceCents: original.basePriceCents,
      discountPriceCents: original.discountPriceCents,
      sku: `${original.sku}-COPY-${suffix.toUpperCase()}`,
      brand: original.brand,
      tags: original.tags,
      featured: false,
      newArrival: false,
      published: false,
      customizable: original.customizable,
      showInHeroBanner: false,
      variants: {
        create: original.variants.map((variant) => ({
          size: variant.size,
          sku: `${variant.sku}-COPY-${suffix.toUpperCase()}`,
          priceCents: variant.priceCents,
          stock: variant.stock,
          color: variant.color,
          edition: variant.edition,
          playerName: variant.playerName,
          playerNumber: variant.playerNumber,
        })),
      },
      images: {
        create: original.images.map((image) => ({
          publicId: image.publicId,
          secureUrl: image.secureUrl,
          altText: image.altText,
          displayOrder: image.displayOrder,
          isPrimary: image.isPrimary,
        })),
      },
    },
  });

  revalidatePath("/admin/products");
  return { success: true, message: "Product duplicated as a draft.", productId: copy.id };
}

export async function toggleProductFlagAction(
  productId: string,
  flag: "featured" | "newArrival" | "published" | "showInHeroBanner"
): Promise<ProductActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { success: false, message: "You must be signed in as an admin." };
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { success: false, message: "Product not found." };

  await prisma.product.update({
    where: { id: productId },
    data: { [flag]: !product[flag] },
  });

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");

  return { success: true, message: "Updated." };
}
