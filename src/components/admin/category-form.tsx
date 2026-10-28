"use client";

import { useActionState } from "react";
import { Input, Textarea, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageInputWithPreview } from "@/components/admin/image-input-preview";
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
  const action = category ? updateCategoryAction.bind(null, category.id) : createCategoryAction;
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
        <p className={`px-4 py-2 text-sm ${state.success ? "text-gold" : "border border-danger/40 bg-danger/10 text-danger"}`}>
          {state.message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={category?.name} required />
          <FieldError message={state.fieldErrors?.name} />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" defaultValue={category?.slug} required />
          <FieldError message={state.fieldErrors?.slug} />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={2} defaultValue={category?.description ?? ""} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="displayOrder">Display Order</Label>
          <Input id="displayOrder" name="displayOrder" type="number" defaultValue={category?.displayOrder ?? 0} />
        </div>
        <div>
          <Label htmlFor="image">Category Image</Label>
          <ImageInputWithPreview
            id="image"
            name="image"
            alt={category?.name ?? "Category image"}
            currentUrl={category?.imageUrl}
            removeName="imageRemove"
            wrapperClassName="flex items-center gap-3"
            boxClassName="h-14 w-14"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox name="enabled" defaultChecked={category?.enabled ?? true} />
        Enabled (visible on storefront)
      </label>

      <Button type="submit" variant="primary" disabled={isPending} className="self-start">
        {isPending ? "SAVING..." : category ? "SAVE CHANGES" : "CREATE CATEGORY"}
      </Button>
    </form>
  );
}
