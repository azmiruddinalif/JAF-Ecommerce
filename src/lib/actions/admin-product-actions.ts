"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import type { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth/session";
import { productSchema } from "@/lib/validation/schemas";
import { slugify } from "@/lib/slug";
import { unitsToCents } from "@/lib/money";
import { imageStorage } from "@/lib/storage";
import { validateImageFile } from "@/lib/storage/validate";

export interface ProductActionResult {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
  productId?: string;
}

function parseProductForm(formData: FormData) {
  const nameRaw = formData.get("name")?.toString().trim() ?? "";
  const slugRaw = formData.get("slug")?.toString().trim() ?? "";
  const normalizedSlug = slugify(slugRaw || nameRaw);
  const skuRaw = formData.get("sku")?.toString().trim() ?? "";
  const normalizedSku =
    skuRaw || (normalizedSlug ? normalizedSlug.toUpperCase().slice(0, 24) : "JAF-ITEM");

  const tagsRaw = formData.get("tags")?.toString() ?? "";
  const variantsRaw = formData.get("variantsJson")?.toString() ?? "[]";

  let rawVariants: Record<string, unknown>[] = [];
  try {
    const parsedJson = JSON.parse(variantsRaw);
    if (Array.isArray(parsedJson)) {
      rawVariants = parsedJson;
    }
  } catch {
    rawVariants = [];
  }

  // Merge duplicate size rows (summing stock) and ensure every variant has a unique SKU
  const mergedBySize = new Map<string, Record<string, unknown>>();
  for (const v of rawVariants.length > 0
    ? rawVariants
    : [{ size: "M", sku: `${normalizedSku}-M`, stock: 10, priceCents: null }]) {
    const size = String(v.size ?? "M").trim() || "M";
    const key = size.toUpperCase();
    const existing = mergedBySize.get(key);
    if (existing) {
      existing.stock = (Number(existing.stock) || 0) + (Number(v.stock) || 0);
    } else {
      mergedBySize.set(key, { ...v, size });
    }
  }

  const usedVariantSkus = new Set<string>();
  const normalizedVariants = [...mergedBySize.values()].map((v, idx) => {
    const size = String(v.size ?? "M").trim() || "M";
    const baseVarSku = String(v.sku ?? "").trim() || `${normalizedSku}-${size}`;
    let finalVarSku = baseVarSku;
    if (usedVariantSkus.has(finalVarSku.toUpperCase())) {
      finalVarSku = `${baseVarSku}-${idx + 1}`;
    }
    usedVariantSkus.add(finalVarSku.toUpperCase());

    return {
      ...v,
      size,
      sku: finalVarSku,
    };
  });

  // Price inputs hold Taka (the unit shown to the admin), not cents — convert before validation.
  const discountRaw = formData.get("discountPriceCents")?.toString().trim();
  const basePriceUnits = Number(formData.get("basePriceCents")?.toString() ?? "0");
  const customClubType = formData.get("customClubType")?.toString().trim() ?? "";
  const customSubType = formData.get("customSubType")?.toString().trim() ?? "";

  const parsedTags = tagsRaw
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(
      (tag) =>
        Boolean(tag) && !tag.startsWith("club-type:") && !tag.startsWith("sub-type:")
    );

  if (customClubType) {
    parsedTags.push(`club-type:${customClubType}`);
  }
  if (customSubType) {
    parsedTags.push(`sub-type:${customSubType}`);
  }

  return productSchema.safeParse({
    name: nameRaw,
    slug: normalizedSlug,
    description: formData.get("description")?.toString().trim() || nameRaw,
    categoryId: formData.get("categoryId")?.toString().trim() ?? "",
    type: formData.get("type")?.toString().trim() || "HOME",
    basePriceCents: unitsToCents(Number.isFinite(basePriceUnits) ? basePriceUnits : 0),
    discountPriceCents:
      discountRaw && Number(discountRaw) > 0 ? unitsToCents(Number(discountRaw)) : null,
    sku: normalizedSku,
    brand: formData.get("brand")?.toString().trim() ?? "",
    tags: parsedTags,
    featured: formData.get("featured") === "on",
    newArrival: formData.get("newArrival") === "on",
    published: formData.get("published") === "on",
    customizable: formData.get("customizable") === "on",
    showInHeroBanner: formData.get("showInHeroBanner") === "on",
    heroBannerLabel: formData.get("heroBannerLabel")?.toString().trim() ?? "",
    variants: normalizedVariants,
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

async function resolveValidCategoryId(rawCategoryId: string, fallbackName?: string): Promise<string> {
  if (rawCategoryId) {
    const found = await prisma.category.findUnique({ where: { id: rawCategoryId } });
    if (found) return found.id;
  }

  if (fallbackName && fallbackName.trim().length >= 2) {
    const name = fallbackName.trim();
    const slug = slugify(name) || "general";
    const bySlug = await prisma.category.findUnique({ where: { slug } });
    if (bySlug) return bySlug.id;
    const count = await prisma.category.count();
    const created = await prisma.category.create({
      data: { name, slug, displayOrder: count + 1, enabled: true },
    });
    return created.id;
  }

  const firstCat = await prisma.category.findFirst({ orderBy: { displayOrder: "asc" } });
  if (firstCat) return firstCat.id;

  const createdDefault = await prisma.category.create({
    data: { name: "Club", slug: "club-jerseys", displayOrder: 1, enabled: true },
  });
  return createdDefault.id;
}

async function attachInitialProductImages(
  productId: string,
  productName: string,
  formData: FormData
) {
  const files = formData
    .getAll("productImages")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const rawUrls = (formData.get("productImageUrls")?.toString() ?? "")
    .split(/[\n,]+/)
    .map((u) => u.trim())
    .filter((u) => u.startsWith("http://") || u.startsWith("https://") || u.startsWith("/"));

  let orderIndex = 0;

  for (const file of files) {
    const validationErr = validateImageFile(file);
    if (validationErr) continue;
    try {
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
          altText: productName,
          displayOrder: orderIndex,
          isPrimary: orderIndex === 0,
        },
      });
      orderIndex++;
    } catch {
      // Ignore individual image error so product creation still succeeds
    }
  }

  for (const url of rawUrls) {
    try {
      await prisma.productImage.create({
        data: {
          productId,
          publicId: `url:${Date.now()}-${orderIndex}`,
          secureUrl: url,
          altText: productName,
          displayOrder: orderIndex,
          isPrimary: orderIndex === 0,
        },
      });
      orderIndex++;
    } catch {
      // Ignore
    }
  }
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

  const fallbackCatName = formData.get("mainCategoryName")?.toString().trim() ?? "";
  if (!formData.get("categoryId")?.toString().trim()) {
    const resolvedId = await resolveValidCategoryId("", fallbackCatName);
    formData.set("categoryId", resolvedId);
  }

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the highlighted fields below.",
      fieldErrors: firstFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;

  try {
    const validCategoryId = await resolveValidCategoryId(data.categoryId, fallbackCatName);

    // If a product with the same Name + Category (or same SKU) already exists,
    // automatically add the new collection quantities to its existing size stocks!
    const existingCollectionProduct = await prisma.product.findFirst({
      where: {
        OR: [
          {
            name: { equals: data.name, mode: "insensitive" },
            categoryId: validCategoryId,
          },
          { sku: data.sku },
        ],
      },
      include: { variants: true, category: true },
    });

    if (existingCollectionProduct) {
      await prisma.$transaction(async (tx) => {
        for (const incomingVar of data.variants) {
          const matchedVariant = existingCollectionProduct.variants.find(
            (ev) => ev.size.toUpperCase() === incomingVar.size.toUpperCase()
          );
          if (matchedVariant) {
            await tx.productVariant.update({
              where: { id: matchedVariant.id },
              data: {
                stock: { increment: incomingVar.stock },
                ...(incomingVar.priceCents !== null && incomingVar.priceCents !== undefined
                  ? { priceCents: incomingVar.priceCents }
                  : {}),
              },
            });
          } else {
            let vSku = incomingVar.sku || `${existingCollectionProduct.sku}-${incomingVar.size}`;
            const duplicateVar = await tx.productVariant.findUnique({ where: { sku: vSku } });
            if (duplicateVar) {
              vSku = `${existingCollectionProduct.sku}-${incomingVar.size}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
            }
            await tx.productVariant.create({
              data: {
                productId: existingCollectionProduct.id,
                size: incomingVar.size,
                sku: vSku,
                priceCents: incomingVar.priceCents ?? null,
                stock: incomingVar.stock,
                color: incomingVar.color || null,
                edition: incomingVar.edition || null,
                playerName: incomingVar.playerName || null,
                playerNumber: incomingVar.playerNumber || null,
              },
            });
          }
        }
      });

      await attachInitialProductImages(
        existingCollectionProduct.id,
        existingCollectionProduct.name,
        formData
      );

      revalidatePath("/admin/products");
      revalidatePath("/admin/stocks");
      revalidatePath(`/admin/products/${existingCollectionProduct.id}`);
      revalidatePath("/admin", "layout");
      revalidatePath("/shop");
      revalidatePath(`/category/${existingCollectionProduct.category.slug}`);
      revalidatePath(`/product/${existingCollectionProduct.slug}`);
      revalidatePath("/", "layout");

      return {
        success: true,
        message: `Added new collection stock quantities to "${existingCollectionProduct.name}"!`,
        productId: existingCollectionProduct.id,
      };
    }

    // Avoid slug collision by appending short suffix if slug already exists
    let finalSlug = data.slug || slugify(data.name);
    const existingSlug = await prisma.product.findUnique({ where: { slug: finalSlug } });
    if (existingSlug) {
      finalSlug = `${finalSlug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    // Avoid SKU collision if SKU already exists
    let finalSku = data.sku;
    const existingSku = await prisma.product.findUnique({ where: { sku: finalSku } });
    if (existingSku) {
      finalSku = `${finalSku}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    }

    // Ensure variant SKUs don't collide with existing variant SKUs in DB
    const variantCreateList = [];
    for (let i = 0; i < data.variants.length; i++) {
      const variant = data.variants[i];
      let vSku = variant.sku;
      const existingVar = await prisma.productVariant.findUnique({ where: { sku: vSku } });
      if (existingVar) {
        vSku = `${finalSku}-${variant.size}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
      }
      variantCreateList.push({
        size: variant.size,
        sku: vSku,
        priceCents: variant.priceCents ?? null,
        stock: variant.stock,
        color: variant.color || null,
        edition: variant.edition || null,
        playerName: variant.playerName || null,
        playerNumber: variant.playerNumber || null,
      });
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: finalSlug,
        description: data.description,
        categoryId: validCategoryId,
        type: data.type,
        basePriceCents: data.basePriceCents,
        discountPriceCents: data.discountPriceCents ?? null,
        sku: finalSku,
        brand: data.brand || null,
        tags: data.tags,
        featured: data.featured,
        newArrival: data.newArrival,
        published: data.published,
        customizable: data.customizable,
        showInHeroBanner: data.showInHeroBanner,
        heroBannerLabel: data.heroBannerLabel || null,
        variants: {
          create: variantCreateList,
        },
      },
      include: { category: true },
    });

    await attachInitialProductImages(product.id, product.name, formData);

    revalidatePath("/admin/products");
    revalidatePath("/admin/stocks");
    revalidatePath(`/admin/products/${product.id}`);
    revalidatePath("/admin", "layout");
    revalidatePath("/shop");
    revalidatePath(`/category/${product.category.slug}`);
    revalidatePath(`/product/${product.slug}`);
    revalidatePath("/", "layout");

    return {
      success: true,
      message: "Product created successfully!",
      productId: product.id,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, message: "Slug or SKU already in use. Choose a different one." };
    }
    return {
      success: false,
      message:
        error instanceof Error
          ? `Could not create product: ${error.message}`
          : "Something went wrong while creating the product.",
    };
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

  const fallbackCatName = formData.get("mainCategoryName")?.toString().trim() ?? "";
  if (!formData.get("categoryId")?.toString().trim()) {
    const resolvedId = await resolveValidCategoryId("", fallbackCatName);
    formData.set("categoryId", resolvedId);
  }

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the highlighted fields below.",
      fieldErrors: firstFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;

  try {
    const validCategoryId = await resolveValidCategoryId(data.categoryId, fallbackCatName);
    const existingVariants = await prisma.productVariant.findMany({
      where: { productId },
      select: { id: true, size: true, sku: true },
    });
    const existingById = new Map(existingVariants.map((v) => [v.id, v]));
    const existingBySize = new Map(
      existingVariants.map((v) => [v.size.trim().toUpperCase(), v])
    );

    // Match incoming variants by explicit id first, or by size if re-added without id
    const matchedExistingIds = new Set<string>();
    const resolvedVariants = data.variants.map((v) => {
      if (v.id && existingById.has(v.id)) {
        matchedExistingIds.add(v.id);
        return { ...v, resolvedId: v.id };
      }
      const bySize = existingBySize.get(v.size.trim().toUpperCase());
      if (bySize && !matchedExistingIds.has(bySize.id)) {
        matchedExistingIds.add(bySize.id);
        return { ...v, resolvedId: bySize.id };
      }
      return { ...v, resolvedId: undefined };
    });

    const idsToDelete = existingVariants
      .map((v) => v.id)
      .filter((id) => !matchedExistingIds.has(id));

    const updatedProduct = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: productId },
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          categoryId: validCategoryId,
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
        include: { category: true },
      });

      if (idsToDelete.length > 0) {
        // Safely detach historical OrderItem references (preserving their snapshotted size/sku/price)
        // and clean up active CartItem references before deleting discontinued size variants.
        await tx.orderItem.updateMany({
          where: { variantId: { in: idsToDelete } },
          data: { variantId: null },
        });
        await tx.cartItem.deleteMany({
          where: { variantId: { in: idsToDelete } },
        });
        await tx.productVariant.deleteMany({
          where: { id: { in: idsToDelete } },
        });
      }

      for (const variant of resolvedVariants) {
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

        if (variant.resolvedId) {
          const duplicateVar = await tx.productVariant.findFirst({
            where: {
              sku: payload.sku,
              id: { not: variant.resolvedId },
            },
          });
          const safeVarSku = duplicateVar
            ? `${data.sku}-${variant.size}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`
            : payload.sku;
          await tx.productVariant.update({
            where: { id: variant.resolvedId },
            data: { ...payload, sku: safeVarSku },
          });
        } else {
          const duplicateVar = await tx.productVariant.findUnique({
            where: { sku: payload.sku },
          });
          const safeVarSku = duplicateVar
            ? `${data.sku}-${variant.size}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`
            : payload.sku;
          await tx.productVariant.create({
            data: { ...payload, sku: safeVarSku, productId },
          });
        }
      }

      return updated;
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin/stocks");
    revalidatePath(`/admin/products/${productId}`);
    revalidatePath("/admin", "layout");
    revalidatePath("/shop");
    revalidatePath(`/category/${updatedProduct.category.slug}`);
    revalidatePath(`/product/${updatedProduct.slug}`);
    revalidatePath("/", "layout");

    return { success: true, message: "Product updated successfully!", productId };
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
    return {
      success: false,
      message:
        error instanceof Error
          ? `Could not update product: ${error.message}`
          : "Something went wrong while updating the product.",
    };
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
    revalidatePath("/admin", "layout");
    revalidatePath("/shop");
    revalidatePath("/", "layout");
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

  try {
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
  } catch {
    return { success: false, message: "Something went wrong while duplicating the product." };
  }
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

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return { success: false, message: "Product not found." };

    await prisma.product.update({
      where: { id: productId },
      data: { [flag]: !product[flag] },
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin/stocks");
    revalidatePath("/admin", "layout");
    revalidatePath("/shop");
    revalidatePath("/", "layout");

    return { success: true, message: "Updated." };
  } catch {
    return { success: false, message: "Something went wrong while updating the product." };
  }
}

export async function updateProductSizeStocksAction(
  productId: string,
  sizeQuantities: Record<string, number>,
  mode: "increment" | "set" = "increment"
): Promise<ProductActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { success: false, message: "You must be signed in as an admin." };
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true, category: true },
    });

    if (!product) {
      return { success: false, message: "Product not found." };
    }

    await prisma.$transaction(async (tx) => {
      for (const [rawSize, rawQty] of Object.entries(sizeQuantities)) {
        const size = rawSize.trim();
        const qty = Math.floor(Number(rawQty));
        if (!size || !Number.isFinite(qty)) continue;
        if (mode === "increment" && qty === 0) continue;

        const existingVariant = product.variants.find(
          (v) => v.size.toUpperCase() === size.toUpperCase()
        );

        if (existingVariant) {
          const nextStock =
            mode === "increment"
              ? Math.max(0, existingVariant.stock + qty)
              : Math.max(0, qty);
          await tx.productVariant.update({
            where: { id: existingVariant.id },
            data: { stock: nextStock },
          });
        } else if (qty > 0) {
          let vSku = `${product.sku}-${size}`;
          const skuCollision = await tx.productVariant.findUnique({ where: { sku: vSku } });
          if (skuCollision) {
            vSku = `${product.sku}-${size}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
          }
          await tx.productVariant.create({
            data: {
              productId: product.id,
              size,
              sku: vSku,
              stock: qty,
            },
          });
        }
      }
    });

    revalidatePath("/admin/stocks");
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${product.id}`);
    revalidatePath("/admin", "layout");
    revalidatePath("/shop");
    revalidatePath(`/category/${product.category.slug}`);
    revalidatePath(`/product/${product.slug}`);
    revalidatePath("/", "layout");

    return {
      success: true,
      message:
        mode === "increment"
          ? `Added collection stock to "${product.name}".`
          : `Updated stock levels for "${product.name}".`,
      productId: product.id,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Could not update stock quantities.",
    };
  }
}
