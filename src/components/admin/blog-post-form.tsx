"use client";

import { useActionState } from "react";
import Image from "next/image";
import { Input, Textarea, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { slugify } from "@/lib/slug";
import {
  createBlogPostAction,
  updateBlogPostAction,
  type BlogPostActionResult,
} from "@/lib/actions/admin-blog-actions";

const initialState: BlogPostActionResult = { success: false, message: "" };

export interface BlogPostFormValues {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  tags: string[];
  authorName: string;
  seoTitle: string | null;
  seoDescription: string | null;
  published: boolean;
  coverImageUrl: string | null;
}

export function BlogPostForm({ post, onDone }: { post?: BlogPostFormValues; onDone?: () => void }) {
  const action = post ? updateBlogPostAction.bind(null, post.id) : createBlogPostAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form
      action={async (formData) => {
        await formAction(formData);
        onDone?.();
      }}
      className="flex flex-col gap-4"
    >
      {state.message && (
        <p
          className={`px-4 py-2 text-sm ${
            state.success ? "text-gold" : "border border-danger/40 bg-danger/10 text-danger"
          }`}
        >
          {state.message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            defaultValue={post?.title}
            required
            onChange={(e) => {
              const slugInput = document.getElementById("blog-slug") as HTMLInputElement | null;
              if (slugInput && !slugInput.dataset.touched) {
                slugInput.value = slugify(e.target.value);
              }
            }}
          />
          <FieldError message={state.fieldErrors?.title} />
        </div>
        <div>
          <Label htmlFor="blog-slug">Slug</Label>
          <Input
            id="blog-slug"
            name="slug"
            defaultValue={post?.slug}
            required
            onChange={(e) => {
              e.target.dataset.touched = "true";
            }}
          />
          <FieldError message={state.fieldErrors?.slug} />
        </div>
      </div>

      <div>
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea
          id="excerpt"
          name="excerpt"
          rows={2}
          defaultValue={post?.excerpt ?? ""}
          placeholder="Short summary shown on the blog list and used as the fallback SEO description."
        />
        <FieldError message={state.fieldErrors?.excerpt} />
      </div>

      <div>
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          name="content"
          rows={14}
          defaultValue={post?.content}
          required
          placeholder="Write the post. Leave a blank line between paragraphs."
        />
        <FieldError message={state.fieldErrors?.content} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="authorName">Author</Label>
          <Input id="authorName" name="authorName" defaultValue={post?.authorName ?? "JAF Team"} />
          <FieldError message={state.fieldErrors?.authorName} />
        </div>
        <div>
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input id="tags" name="tags" defaultValue={post?.tags.join(", ")} placeholder="culture, kits, style" />
        </div>
      </div>

      <div>
        <Label htmlFor="coverImage">Cover Image</Label>
        <div className="flex items-center gap-3">
          {post?.coverImageUrl && (
            <div className="relative h-14 w-14 shrink-0 overflow-hidden border border-ink-border bg-ink">
              <Image src={post.coverImageUrl} alt={post.title} fill sizes="56px" className="object-cover" />
            </div>
          )}
          <div className="flex w-full flex-col gap-2">
            <input id="coverImage" name="coverImage" type="file" accept="image/*" className="w-full text-sm text-paper-dim" />
            {post?.coverImageUrl && (
              <label className="flex items-center gap-2 text-xs text-paper-dim">
                <Checkbox name="coverImageRemove" />
                Remove this image
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-ink-border pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-paper-dim">SEO (optional)</p>
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="seoTitle">SEO Title</Label>
            <Input id="seoTitle" name="seoTitle" defaultValue={post?.seoTitle ?? ""} placeholder="Defaults to the post title" />
          </div>
          <div>
            <Label htmlFor="seoDescription">SEO Description</Label>
            <Textarea
              id="seoDescription"
              name="seoDescription"
              rows={2}
              defaultValue={post?.seoDescription ?? ""}
              placeholder="Defaults to the excerpt"
            />
          </div>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox name="published" defaultChecked={post?.published ?? false} />
        Published (visible on the site)
      </label>

      <Button type="submit" variant="primary" disabled={isPending} className="self-start">
        {isPending ? "SAVING..." : post ? "SAVE CHANGES" : "CREATE POST"}
      </Button>
    </form>
  );
}
