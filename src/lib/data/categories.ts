import "server-only";
import { prisma } from "@/lib/prisma";

export async function getActiveCategories() {
  return prisma.category.findMany({
    where: { enabled: true },
    orderBy: { displayOrder: "asc" },
  });
}

export async function getAllCategories() {
  return prisma.category.findMany({
    orderBy: { displayOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}

export async function getCategoryById(id: string) {
  return prisma.category.findUnique({ where: { id } });
}
