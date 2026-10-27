"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { centsToUnits } from "@/lib/money";
import { slugify } from "@/lib/slug";
import { JERSEY_TYPES, JERSEY_TYPE_LABELS } from "@/lib/constants";
import {
  createProductAction,
  updateProductAction,
  type ProductActionResult,
} from "@/lib/actions/admin-product-actions";
import { VariantBuilder, variantRowFromExisting, createEmptyVariantRow } from "./variant-builder";

const initialState: ProductActionResult = { success: false, message: "" };

export interface ProductFormValues {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  type: (typeof JERSEY_TYPES)[number];
  basePriceCents: number;
  discountPriceCents: number | null;
  sku: string;
  brand: string | null;
  tags: string[];
  featured: boolean;
  newArrival: boolean;
  published: boolean;
  customizable: boolean;
  showInHeroBanner: boolean;
  heroBannerLabel: string | null;
  variants: {
    id: string;
    size: string;
    sku: string;
    priceCents: number | null;
    stock: number;
    color: string | null;
    edition: string | null;
    playerName: string | null;
    playerNumber: string | null;
  }[];
}

export function ProductForm({
  product,
  categories,
}: {
  product?: ProductFormValues;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const action = product ? updateProductAction.bind(null, product.id) : createProductAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success && state.productId && !product) {
      router.push(`/admin/products/${state.productId}`);
    }
  }, [state, product, router]);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.message && (
        <p
          className={`px-4 py-3 text-sm ${
            state.success ? "border border-gold/40 bg-gold/10 text-gold" : "border border-danger/40 bg-danger/10 text-danger"
          }`}
        >
          {state.message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={product?.name}
            required
            onChange={(e) => {
              const slugInput = document.getElementById("slug") as HTMLInputElement | null;
              if (slugInput && !slugInput.dataset.touched) {
                slugInput.value = slugify(e.target.value);
              }
            }}
          />
          <FieldError message={state.fieldErrors?.name} />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            defaultValue={product?.slug}
            required
            onChange={(e) => {
              e.target.dataset.touched = "true";
            }}
          />
          <FieldError message={state.fieldErrors?.slug} />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={5} defaultValue={product?.description} required />
        <FieldError message={state.fieldErrors?.description} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="categoryId">Category</Label>
          <Select id="categoryId" name="categoryId" defaultValue={product?.categoryId} required>
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
          <FieldError message={state.fieldErrors?.categoryId} />
        </div>
        <div>
          <Label htmlFor="type">Type</Label>
          <Select id="type" name="type" defaultValue={product?.type ?? "HOME"} required>
            {JERSEY_TYPES.map((type) => (
              <option key={type} value={type}>
                {JERSEY_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
          <FieldError message={state.fieldErrors?.type} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" name="sku" defaultValue={product?.sku} required />
          <FieldError message={state.fieldErrors?.sku} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div>
          <Label htmlFor="basePriceCents">Base Price (৳)</Label>
          <Input
            id="basePriceCents"
            name="basePriceCents"
            type="number"
            step="0.01"
            defaultValue={product ? centsToUnits(product.basePriceCents) : undefined}
            required
          />
          <FieldError message={state.fieldErrors?.basePriceCents} />
        </div>
        <div>
          <Label htmlFor="discountPriceCents">Discount Price (৳)</Label>
          <Input
            id="discountPriceCents"
            name="discountPriceCents"
            type="number"
            step="0.01"
            defaultValue={product?.discountPriceCents ? centsToUnits(product.discountPriceCents) : undefined}
            placeholder="Optional"
          />
        </div>
        <div>
          <Label htmlFor="brand">Brand</Label>
          <Input id="brand" name="brand" defaultValue={product?.brand ?? ""} placeholder="JAF" />
        </div>
      </div>

      <div>
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input id="tags" name="tags" defaultValue={product?.tags.join(", ")} placeholder="retro, home, 2026" />
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="featured" defaultChecked={product?.featured} /> Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="newArrival" defaultChecked={product?.newArrival} /> New Arrival
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="published" defaultChecked={product?.published} /> Published
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="customizable" defaultChecked={product?.customizable} /> Allow Customization
          (name/number)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="showInHeroBanner" defaultChecked={product?.showInHeroBanner} /> Show in Hero Banner
        </label>
      </div>

      <div>
        <Label htmlFor="heroBannerLabel">Hero Banner Text (optional)</Label>
        <Input
          id="heroBannerLabel"
          name="heroBannerLabel"
          defaultValue={product?.heroBannerLabel ?? ""}
          placeholder="Defaults to the product name"
          maxLength={60}
        />
        <p className="mt-1 text-xs text-paper-dim">
          Short caption shown on the hero banner card when this product is featured there. The price
          always comes from this product&apos;s own price above.
        </p>
      </div>

      <div>
        <Label className="mb-2 block">Sizes & Variants</Label>
        <VariantBuilder
          initialRows={
            product && product.variants.length > 0
              ? product.variants.map(variantRowFromExisting)
              : [createEmptyVariantRow()]
          }
        />
        <FieldError message={state.fieldErrors?.variants} />
      </div>

      <Button type="submit" variant="primary" size="lg" disabled={isPending} className="self-start">
        {isPending ? "SAVING..." : product ? "SAVE CHANGES" : "CREATE PRODUCT"}
      </Button>
    </form>
  );
}
