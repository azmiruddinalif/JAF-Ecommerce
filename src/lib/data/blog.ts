import "server-only";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

export async function getPublishedBlogPosts() {
  await connection();
  return prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
  });
}

export async function getPublishedBlogPostBySlug(slug: string) {
  await connection();
  return prisma.blogPost.findFirst({ where: { slug, published: true } });
}

export async function getAllBlogPosts() {
  await connection();
  return prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getBlogPostById(id: string) {
  await connection();
  return prisma.blogPost.findUnique({ where: { id } });
}
