"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageInputWithPreview } from "@/components/admin/image-input-preview";
import { slugify } from "@/lib/slug";
import {
  createCategoryAction,
  updateCategoryAction,
  type CategoryActionResult,
} from "@/lib/actions/admin-category-actions";

const initialState: CategoryActionResult = { success: false, message: "" };

interface CategoryFormValues {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  enabled: boolean;
  imageUrl: string | null;
}

export function CategoryForm({ category, onDone }: { category?: CategoryFormValues; onDone?: () => void }) {
  const router = useRouter();
  const action = category ? updateCategoryAction.bind(null, category.id) : createCategoryAction;
  const [state, formAction, isActionPending] = useActionState(action, initialState);
  const [isSubmitTransition, startSubmitTransition] = useTransition();
  const isPending = isActionPending || isSubmitTransition;

  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(category?.slug));
  const [description, setDescription] = useState(category?.description ?? "");
  const [displayOrder, setDisplayOrder] = useState(String(category?.displayOrder ?? 0));
  const [enabled, setEnabled] = useState(category?.enabled ?? true);

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onDoneRef.current?.();
    }
  }, [state.success, router]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startSubmitTransition(() => {
          formAction(formData);
        });
      }}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="enabled" value={enabled ? "on" : ""} readOnly />

      {state.message && (
        <p className={`px-4 py-2 text-sm ${state.success ? "text-gold" : "border border-danger/40 bg-danger/10 text-danger"}`}>
          {state.message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Category Name *</Label>
          <Input
            id="name"
            name="name"
            value={name}
            required
            placeholder="e.g. Football Boots, Tracksuits, National..."
            onChange={(e) => {
              const val = e.target.value;
              setName(val);
              if (!slugTouched) {
                setSlug(slugify(val));
              }
            }}
          />
          <FieldError message={state.fieldErrors?.name} />
        </div>
        <div>
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            name="slug"
            value={slug}
            required
            placeholder="auto-generated-from-name"
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
          />
          <FieldError message={state.fieldErrors?.slug} />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="displayOrder">Display Order</Label>
          <Input
            id="displayOrder"
            name="displayOrder"
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="image">Category Image</Label>
          <ImageInputWithPreview
            id="image"
            name="image"
            alt={name || "Category image"}
            currentUrl={category?.imageUrl}
            removeName="imageRemove"
            wrapperClassName="flex items-center gap-3"
            boxClassName="h-14 w-14"
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <Checkbox checked={enabled} onCheckedChange={(v) => setEnabled(Boolean(v))} />
        Enabled (visible on storefront)
      </label>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={isPending} className="self-start">
          {isPending ? "SAVING..." : category ? "SAVE CHANGES" : "CREATE CATEGORY"}
        </Button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="text-xs font-semibold uppercase tracking-wider text-paper-dim hover:text-paper"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
