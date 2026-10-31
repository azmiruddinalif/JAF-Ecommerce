import "server-only";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_JERSEY_CATEGORIES, OTHER_PRODUCT_CATEGORY_PRESETS } from "@/lib/constants";

async function ensureDefaultCategoriesIfEmpty() {
  try {
    const count = await prisma.category.count();
    if (count > 0) return;

    const defaults = [...DEFAULT_JERSEY_CATEGORIES, ...OTHER_PRODUCT_CATEGORY_PRESETS];
    for (const cat of defaults) {
      await prisma.category
        .upsert({
          where: { slug: cat.slug },
          update: {},
          create: {
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            displayOrder: cat.displayOrder,
            enabled: true,
          },
        })
        .catch(() => {});
    }
  } catch {
    // Database connection down or initializing
  }
}

export async function getActiveCategories() {
  await connection();
  try {
    await ensureDefaultCategoriesIfEmpty();
    return await prisma.category.findMany({
      where: { enabled: true },
      orderBy: { displayOrder: "asc" },
    });
  } catch {
    return DEFAULT_JERSEY_CATEGORIES.map((c, i) => ({
      id: `default-${c.slug}`,
      name: c.name,
      slug: c.slug,
      description: c.description ?? null,
      imageUrl: null,
      imagePublicId: null,
      displayOrder: i,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }
}

export async function getAllCategories() {
  await connection();
  try {
    await ensureDefaultCategoriesIfEmpty();
    return await prisma.category.findMany({
      orderBy: { displayOrder: "asc" },
      include: { _count: { select: { products: true } } },
    });
  } catch {
    return DEFAULT_JERSEY_CATEGORIES.map((c, i) => ({
      id: `default-${c.slug}`,
      name: c.name,
      slug: c.slug,
      description: c.description ?? null,
      imageUrl: null,
      imagePublicId: null,
      displayOrder: i,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { products: 0 },
    }));
  }
}

export async function getCategoryBySlug(slug: string) {
  await connection();
  try {
    return await prisma.category.findUnique({ where: { slug } });
  } catch {
    const fallback = DEFAULT_JERSEY_CATEGORIES.find((c) => c.slug === slug);
    if (!fallback) return null;
    return {
      id: `default-${fallback.slug}`,
      name: fallback.name,
      slug: fallback.slug,
      description: fallback.description ?? null,
      imageUrl: null,
      imagePublicId: null,
      displayOrder: 0,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export async function getCategoryById(id: string) {
  await connection();
  try {
    return await prisma.category.findUnique({ where: { id } });
  } catch {
    return null;
  }
}
