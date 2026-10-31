"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth/session";
import { blogPostSchema } from "@/lib/validation/schemas";
import { imageStorage } from "@/lib/storage";
import { validateImageFile } from "@/lib/storage/validate";

export interface BlogPostActionResult {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
}

function parseBlogPostForm(formData: FormData) {
  const tagsRaw = formData.get("tags")?.toString() ?? "";

  return blogPostSchema.safeParse({
    title: formData.get("title")?.toString() ?? "",
    slug: formData.get("slug")?.toString() ?? "",
    excerpt: formData.get("excerpt")?.toString() ?? "",
    content: (formData.get("content")?.toString() ?? "").replace(/\r\n/g, "\n"),
    tags: tagsRaw
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean),
    authorName: formData.get("authorName")?.toString() || "JAF Team",
    seoTitle: formData.get("seoTitle")?.toString() ?? "",
    seoDescription: formData.get("seoDescription")?.toString() ?? "",
    published: formData.get("published") === "on",
  });
}

function fieldErrorsFrom(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

async function uploadCoverImageIfPresent(formData: FormData, postId: string) {
  const file = formData.get("coverImage");
  if (!(file instanceof File) || file.size === 0) return null;

  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await imageStorage.upload(buffer, {
    folder: `blog/${postId}`,
    contentType: file.type,
  });
  return uploaded;
}

function revalidateBlogPaths(slug?: string, previousSlug?: string) {
  revalidatePath("/admin/blog");
  revalidatePath("/admin", "layout");
  revalidatePath("/blog");
  revalidatePath("/", "layout");
  if (slug) revalidatePath(`/blog/${slug}`);
  if (previousSlug && previousSlug !== slug) revalidatePath(`/blog/${previousSlug}`);
}

export async function createBlogPostAction(
  _prev: BlogPostActionResult | null,
  formData: FormData
): Promise<BlogPostActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { success: false, message: "You must be signed in as an admin." };
  }

  const parsed = parseBlogPostForm(formData);
  if (!parsed.success) {
    return { success: false, message: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    const post = await prisma.blogPost.create({
      data: {
        title: parsed.data.title,
        slug: parsed.data.slug,
        excerpt: parsed.data.excerpt || null,
        content: parsed.data.content,
        tags: parsed.data.tags,
        authorName: parsed.data.authorName,
        seoTitle: parsed.data.seoTitle || null,
        seoDescription: parsed.data.seoDescription || null,
        published: parsed.data.published,
        publishedAt: parsed.data.published ? new Date() : null,
      },
    });

    try {
      const uploaded = await uploadCoverImageIfPresent(formData, post.id);
      if (uploaded) {
        await prisma.blogPost.update({
          where: { id: post.id },
          data: { coverImageUrl: uploaded.secureUrl, coverImagePublicId: uploaded.publicId },
        });
      }
    } catch (error) {
      revalidateBlogPaths(post.slug);
      return {
        success: true,
        message: `Post created, but the cover image failed to upload: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      };
    }

    revalidateBlogPaths(post.slug);
    return { success: true, message: "Post created." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, message: "That slug is already in use." };
    }
    return { success: false, message: "Something went wrong while creating the post." };
  }
}

export async function updateBlogPostAction(
  postId: string,
  _prev: BlogPostActionResult | null,
  formData: FormData
): Promise<BlogPostActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { success: false, message: "You must be signed in as an admin." };
  }

  const parsed = parseBlogPostForm(formData);
  if (!parsed.success) {
    return { success: false, message: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    const existing = await prisma.blogPost.findUnique({ where: { id: postId } });
    if (!existing) {
      return { success: false, message: "Post not found." };
    }

    await prisma.blogPost.update({
      where: { id: postId },
      data: {
        title: parsed.data.title,
        slug: parsed.data.slug,
        excerpt: parsed.data.excerpt || null,
        content: parsed.data.content,
        tags: parsed.data.tags,
        authorName: parsed.data.authorName,
        seoTitle: parsed.data.seoTitle || null,
        seoDescription: parsed.data.seoDescription || null,
        published: parsed.data.published,
        // Set publishedAt the first time a post goes live; keep it stable afterwards
        // so it reflects the original publish date, not the latest edit.
        publishedAt: parsed.data.published ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
      },
    });

    try {
      const uploaded = await uploadCoverImageIfPresent(formData, postId);
      if (uploaded) {
        if (existing.coverImagePublicId) {
          await imageStorage.remove(existing.coverImagePublicId).catch(() => {});
        }
        await prisma.blogPost.update({
          where: { id: postId },
          data: { coverImageUrl: uploaded.secureUrl, coverImagePublicId: uploaded.publicId },
        });
      } else if (formData.get("coverImageRemove") === "on" && existing.coverImagePublicId) {
        await imageStorage.remove(existing.coverImagePublicId).catch(() => {});
        await prisma.blogPost.update({
          where: { id: postId },
          data: { coverImageUrl: null, coverImagePublicId: null },
        });
      }
    } catch (error) {
      revalidateBlogPaths(parsed.data.slug, existing.slug);
      return {
        success: true,
        message: `Post updated, but the cover image failed to upload: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      };
    }

    revalidateBlogPaths(parsed.data.slug, existing.slug);
    return { success: true, message: "Post updated." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, message: "That slug is already in use." };
    }
    return { success: false, message: "Something went wrong while updating the post." };
  }
}

export async function deleteBlogPostAction(postId: string): Promise<BlogPostActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { success: false, message: "You must be signed in as an admin." };
  }

  try {
    const post = await prisma.blogPost.delete({ where: { id: postId } });
    if (post.coverImagePublicId) {
      await imageStorage.remove(post.coverImagePublicId).catch(() => {});
    }
    revalidateBlogPaths(post.slug);
    return { success: true, message: "Post deleted." };
  } catch {
    return { success: false, message: "Something went wrong while deleting the post." };
  }
}

export async function toggleBlogPostPublishedAction(postId: string): Promise<BlogPostActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { success: false, message: "You must be signed in as an admin." };
  }

  try {
    const post = await prisma.blogPost.findUnique({ where: { id: postId } });
    if (!post) return { success: false, message: "Post not found." };

    const published = !post.published;
    await prisma.blogPost.update({
      where: { id: postId },
      data: { published, publishedAt: published ? (post.publishedAt ?? new Date()) : post.publishedAt },
    });

    revalidateBlogPaths(post.slug);
    return { success: true, message: "Updated." };
  } catch {
    return { success: false, message: "Something went wrong while updating the post." };
  }
}
