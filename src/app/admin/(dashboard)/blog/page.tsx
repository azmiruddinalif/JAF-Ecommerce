import { getAllBlogPosts } from "@/lib/data/blog";
import { BlogManager } from "@/components/admin/blog-manager";

export const metadata = { title: "Blog", robots: { index: false } };

export default async function AdminBlogPage() {
  const posts = await getAllBlogPosts();

  return (
    <BlogManager
      posts={posts.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        content: p.content,
        tags: p.tags,
        authorName: p.authorName,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        published: p.published,
        publishedAt: p.publishedAt,
        createdAt: p.createdAt,
        coverImageUrl: p.coverImageUrl,
      }))}
    />
  );
}
