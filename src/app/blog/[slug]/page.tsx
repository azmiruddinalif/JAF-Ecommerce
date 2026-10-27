import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getPublishedBlogPostBySlug } from "@/lib/data/blog";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const dateFormatter = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" });

// Reads the post directly from the database with no cache directive — render
// at request time rather than maintaining a static shell.
export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);
  if (!post) return {};

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt || post.content.slice(0, 160);

  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const paragraphs = post.content
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription || post.excerpt || undefined,
    image: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    author: { "@type": "Organization", name: post.authorName || "JAF" },
    publisher: { "@type": "Organization", name: "JAF" },
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="mb-8 text-xs text-paper-dim">
        <Link href="/blog" className="hover:text-gold">
          Blog
        </Link>{" "}
        / <span className="text-paper">{post.title}</span>
      </nav>

      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold">
        {post.publishedAt ? dateFormatter.format(post.publishedAt) : ""}
        {post.authorName ? ` · ${post.authorName}` : ""}
      </p>
      <h1 className="mb-8 font-display text-4xl sm:text-5xl">{post.title}</h1>

      {post.coverImageUrl && (
        <div className="relative mb-10 aspect-16/9 overflow-hidden bg-ink-raised">
          <Image src={post.coverImageUrl} alt={post.title} fill sizes="768px" className="object-cover" priority />
        </div>
      )}

      <div className="space-y-5 text-sm leading-relaxed text-paper/80 sm:text-base">
        {paragraphs.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      {post.tags.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2 border-t border-ink-border pt-6">
          {post.tags.map((tag) => (
            <span key={tag} className="border border-ink-border px-2.5 py-1 text-[11px] uppercase text-paper-dim">
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
