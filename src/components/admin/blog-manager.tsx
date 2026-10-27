"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BlogPostForm, type BlogPostFormValues } from "./blog-post-form";
import { deleteBlogPostAction, toggleBlogPostPublishedAction } from "@/lib/actions/admin-blog-actions";

interface BlogPostRow extends BlogPostFormValues {
  publishedAt: Date | null;
  createdAt: Date;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" });

export function BlogManager({ posts }: { posts: BlogPostRow[] }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove(id: string) {
    if (!confirm("Delete this post? This can't be undone.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteBlogPostAction(id);
      if (!result.success) setError(result.message);
    });
  }

  function togglePublished(id: string) {
    startTransition(async () => {
      await toggleBlogPostPublishedAction(id);
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl">BLOG</h1>
        <Button variant="primary" onClick={() => setAdding((v) => !v)}>
          <Plus size={16} /> {adding ? "CLOSE" : "WRITE POST"}
        </Button>
      </div>

      {error && <p className="mb-4 border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">{error}</p>}

      {adding && (
        <div className="mb-8 border border-ink-border bg-ink-raised p-6">
          <BlogPostForm onDone={() => setAdding(false)} />
        </div>
      )}

      <div className="divide-y divide-ink-border border border-ink-border">
        {posts.length === 0 && <p className="px-5 py-8 text-center text-sm text-paper-dim">No posts yet.</p>}
        {posts.map((post) => (
          <div key={post.id} className={isPending ? "opacity-70" : ""}>
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden bg-ink-raised">
                {post.coverImageUrl && (
                  <Image src={post.coverImageUrl} alt={post.title} fill sizes="48px" className="object-cover" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{post.title}</p>
                <p className="text-xs text-paper-dim">
                  /blog/{post.slug} · {post.publishedAt ? dateFormatter.format(post.publishedAt) : dateFormatter.format(post.createdAt)}
                </p>
              </div>
              <Badge variant={post.published ? "success" : "neutral"}>{post.published ? "Published" : "Draft"}</Badge>
              <button
                type="button"
                onClick={() => togglePublished(post.id)}
                className="text-xs uppercase tracking-wider text-paper-dim hover:text-gold"
              >
                Toggle
              </button>
              <button
                type="button"
                onClick={() => setEditingId(editingId === post.id ? null : post.id)}
                aria-label="Edit post"
                className="text-paper-dim hover:text-gold"
              >
                <Pencil size={16} />
              </button>
              <button
                type="button"
                onClick={() => remove(post.id)}
                aria-label="Delete post"
                className="text-paper-dim hover:text-danger"
              >
                <Trash2 size={16} />
              </button>
            </div>
            {editingId === post.id && (
              <div className="border-t border-ink-border bg-ink-raised p-6">
                <BlogPostForm post={post} onDone={() => setEditingId(null)} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
