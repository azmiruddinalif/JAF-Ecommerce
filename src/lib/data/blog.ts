import "server-only";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

export async function getPublishedBlogPosts() {
  await connection();
  try {
    return await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
    });
  } catch {
    return [];
  }
}

export async function getPublishedBlogPostBySlug(slug: string) {
  await connection();
  try {
    return await prisma.blogPost.findFirst({ where: { slug, published: true } });
  } catch {
    return null;
  }
}

export async function getAllBlogPosts() {
  await connection();
  try {
    return await prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } });
  } catch {
    return [];
  }
}

export async function getBlogPostById(id: string) {
  await connection();
  try {
    return await prisma.blogPost.findUnique({ where: { id } });
  } catch {
    return null;
  }
}
