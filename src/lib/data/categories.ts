import "server-only";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_JERSEY_CATEGORIES, OTHER_PRODUCT_CATEGORY_PRESETS } from "@/lib/constants";

async function ensureDefaultCategoriesIfEmpty() {
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
}

export async function getActiveCategories() {
  await connection();
  await ensureDefaultCategoriesIfEmpty();
  return prisma.category.findMany({
    where: { enabled: true },
    orderBy: { displayOrder: "asc" },
  });
}

export async function getAllCategories() {
  await connection();
  await ensureDefaultCategoriesIfEmpty();
  return prisma.category.findMany({
    orderBy: { displayOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

export async function getCategoryBySlug(slug: string) {
  await connection();
  return prisma.category.findUnique({ where: { slug } });
}

export async function getCategoryById(id: string) {
  await connection();
  return prisma.category.findUnique({ where: { id } });
}
