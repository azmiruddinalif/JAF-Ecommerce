import "server-only";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

export async function getActiveCategories() {
  await connection();
  return prisma.category.findMany({
    where: { enabled: true },
    orderBy: { displayOrder: "asc" },
  });
}

export async function getAllCategories() {
  await connection();
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
