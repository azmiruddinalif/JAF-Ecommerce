import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPublishedBlogPosts } from "@/lib/data/blog";

// Reads posts directly from the database with no cache directive — render
// at request time rather than maintaining a static shell.
export const instant = false;

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Stories on football culture, kit design and the streetwear edge of the game, from the JAF team.",
  alternates: { canonical: "/blog" },
};

const dateFormatter = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" });

export default async function BlogIndexPage() {
  const posts = await getPublishedBlogPosts();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold">Journal</p>
      <h1 className="mb-10 font-display text-4xl sm:text-5xl">THE JAF BLOG</h1>

      {posts.length === 0 ? (
        <p className="text-sm text-paper-dim">No stories published yet — check back soon.</p>
      ) : (
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2">
          {posts.map((post) => (
            <article key={post.id} className="group">
              <Link href={`/blog/${post.slug}`} className="block">
                <div className="relative mb-4 aspect-16/10 overflow-hidden bg-ink-raised">
                  {post.coverImageUrl && (
                    <Image
                      src={post.coverImageUrl}
                      alt={post.title}
                      fill
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </div>
                <p className="mb-1 text-xs text-paper-dim">
                  {post.publishedAt ? dateFormatter.format(post.publishedAt) : ""}
                </p>
                <h2 className="font-display text-xl transition-colors group-hover:text-gold">{post.title}</h2>
                {post.excerpt && <p className="mt-2 text-sm leading-relaxed text-paper-dim">{post.excerpt}</p>}
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
