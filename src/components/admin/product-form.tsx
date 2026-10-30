"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Input, Textarea, Label, FieldError } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { centsToUnits } from "@/lib/money";
import { slugify } from "@/lib/slug";
import {
  CLUB_TYPES,
  CLUB_TYPE_LABELS,
  JERSEY_TYPES,
  isClubCategory,
} from "@/lib/constants";
import {
  createProductAction,
  updateProductAction,
  type ProductActionResult,
} from "@/lib/actions/admin-product-actions";
import { createQuickCategoryAction } from "@/lib/actions/admin-category-actions";
import { VariantBuilder, variantRowFromExisting, createEmptyVariantRow } from "./variant-builder";

const initialState: ProductActionResult = { success: false, message: "" };
const ADD_NEW_SENTINEL = "__add_new__";

export interface CategoryOptionItem {
  id: string;
  name: string;
  slug?: string;
}

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
  categories: initialCategories,
}: {
  product?: ProductFormValues;
  categories: CategoryOptionItem[];
}) {
  const router = useRouter();
  const action = product ? updateProductAction.bind(null, product.id) : createProductAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  const [categoryList, setCategoryList] = useState<CategoryOptionItem[]>(initialCategories);

  // Main Category ("Jersey" vs any custom main category)
  const [mainCategories, setMainCategories] = useState<string[]>(["Jersey"]);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>("Jersey");
  const [addingMainCategory, setAddingMainCategory] = useState(false);
  const [newMainCategoryName, setNewMainCategoryName] = useState("");

  // Jersey Type (National, Club, Retro, + custom options backed by Category table)
  const defaultCategoryId =
    product?.categoryId ??
    initialCategories.find((c) => c.name.toLowerCase() === "club" || c.slug === "club-jerseys")?.id ??
    initialCategories[0]?.id ??
    "";
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(defaultCategoryId);
  const [addingJerseyType, setAddingJerseyType] = useState(false);
  const [newJerseyTypeName, setNewJerseyTypeName] = useState("");
  const [jerseyTypeError, setJerseyTypeError] = useState<string | null>(null);
  const [isAddingCategory, startAddCategoryTransition] = useTransition();

  // Club Type (Home, Away, Third, + custom options when Jersey Type is Club)
  const existingCustomClubTag = product?.tags
    .find((t) => t.toLowerCase().startsWith("club-type:"))
    ?.slice("club-type:".length)
    .trim();

  const [customClubOptions, setCustomClubOptions] = useState<string[]>(
    existingCustomClubTag ? [existingCustomClubTag] : []
  );
  const initialClubSelection = existingCustomClubTag
    ? `CUSTOM:${existingCustomClubTag}`
    : product?.type && (CLUB_TYPES as readonly string[]).includes(product.type)
      ? product.type
      : "HOME";

  const [selectedClubType, setSelectedClubType] = useState<string>(initialClubSelection);
  const [addingClubType, setAddingClubType] = useState(false);
  const [newClubTypeName, setNewClubTypeName] = useState("");

  const selectedCategory = categoryList.find((c) => c.id === selectedCategoryId) ?? null;
  const isJerseyCategory = selectedMainCategory.toLowerCase() === "jersey";
  const isClubSelected = isJerseyCategory && isClubCategory(selectedCategory);
  const isRetroSelected =
    isJerseyCategory &&
    Boolean(
      selectedCategory &&
        (selectedCategory.slug?.toLowerCase() === "retro" ||
          selectedCategory.name.toLowerCase() === "retro")
    );

  // Determine the Prisma enum `type` and optional customClubType
  const isCustomClubType = selectedClubType.startsWith("CUSTOM:");
  const customClubTypeValue = isCustomClubType ? selectedClubType.slice("CUSTOM:".length) : "";
  const effectivePrismaType: (typeof JERSEY_TYPES)[number] = isRetroSelected
    ? "RETRO"
    : isClubSelected
      ? isCustomClubType
        ? "THIRD"
        : (selectedClubType as (typeof JERSEY_TYPES)[number])
      : "HOME";

  useEffect(() => {
    if (state.success && state.productId && !product) {
      router.push(`/admin/products/${state.productId}`);
    }
  }, [state, product, router]);

  function handleAddMainCategory() {
    const trimmed = newMainCategoryName.trim();
    if (!trimmed) return;
    if (!mainCategories.includes(trimmed)) {
      setMainCategories((prev) => [...prev, trimmed]);
    }
    setSelectedMainCategory(trimmed);
    if (trimmed.toLowerCase() !== "jersey") {
      startAddCategoryTransition(async () => {
        const res = await createQuickCategoryAction(trimmed);
        if (res.success && res.category) {
          setCategoryList((prev) =>
            prev.some((c) => c.id === res.category!.id) ? prev : [...prev, res.category!]
          );
          setSelectedCategoryId(res.category.id);
        }
      });
    }
    setNewMainCategoryName("");
    setAddingMainCategory(false);
  }

  function handleAddJerseyType() {
    const trimmed = newJerseyTypeName.trim();
    if (!trimmed) return;
    setJerseyTypeError(null);
    startAddCategoryTransition(async () => {
      const res = await createQuickCategoryAction(trimmed);
      if (res.success && res.category) {
        setCategoryList((prev) =>
          prev.some((c) => c.id === res.category!.id) ? prev : [...prev, res.category!]
        );
        setSelectedCategoryId(res.category.id);
        setNewJerseyTypeName("");
        setAddingJerseyType(false);
      } else {
        setJerseyTypeError(res.message);
      }
    });
  }

  function handleAddClubType() {
    const trimmed = newClubTypeName.trim();
    if (!trimmed) return;
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    const upper = formatted.toUpperCase();
    if ((CLUB_TYPES as readonly string[]).includes(upper)) {
      setSelectedClubType(upper);
    } else {
      if (!customClubOptions.includes(formatted)) {
        setCustomClubOptions((prev) => [...prev, formatted]);
      }
      setSelectedClubType(`CUSTOM:${formatted}`);
    }
    setNewClubTypeName("");
    setAddingClubType(false);
  }

  const displayTags =
    product?.tags.filter((t) => !t.toLowerCase().startsWith("club-type:")).join(", ") ?? "";

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="categoryId" value={selectedCategoryId} readOnly />
      <input type="hidden" name="type" value={effectivePrismaType} readOnly />
      <input
        type="hidden"
        name="customClubType"
        value={isClubSelected ? customClubTypeValue : ""}
        readOnly
      />

      {state.message && (
        <p
          className={`px-4 py-3 text-sm ${
            state.success
              ? "border border-gold/40 bg-gold/10 text-gold"
              : "border border-danger/40 bg-danger/10 text-danger"
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
        <Textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={product?.description}
          required
        />
        <FieldError message={state.fieldErrors?.description} />
      </div>

      {/* Cascading shadcn Select fields: Category -> Jersey Type -> Club Type */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* 1. Category (Jersey) */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label className="mb-0">Category</Label>
            <button
              type="button"
              onClick={() => setAddingMainCategory((v) => !v)}
              className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-gold hover:underline"
            >
              <Plus size={12} /> Add Option
            </button>
          </div>
          <Select
            value={selectedMainCategory}
            onValueChange={(value) => {
              if (value === ADD_NEW_SENTINEL) {
                setAddingMainCategory(true);
                return;
              }
              setSelectedMainCategory(value);
            }}
          >
            <SelectTrigger aria-label="Select Category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {mainCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
              <SelectItem value={ADD_NEW_SENTINEL} className="text-gold">
                + Add New Option...
              </SelectItem>
            </SelectContent>
          </Select>

          {addingMainCategory && (
            <div className="mt-2 flex items-center gap-2">
              <Input
                value={newMainCategoryName}
                onChange={(e) => setNewMainCategoryName(e.target.value)}
                placeholder="New category name..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddMainCategory();
                  }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddMainCategory}>
                Add
              </Button>
              <button
                type="button"
                onClick={() => setAddingMainCategory(false)}
                aria-label="Cancel"
                className="p-1 text-paper-dim hover:text-danger"
              >
                <X size={15} />
              </button>
            </div>
          )}
        </div>

        {/* 2. When "Jersey" is chosen -> show "Jersey Type" (National, Club, Retro, + Add Option) */}
        {isJerseyCategory && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label className="mb-0">Jersey Type</Label>
              <button
                type="button"
                onClick={() => setAddingJerseyType((v) => !v)}
                className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-gold hover:underline"
              >
                <Plus size={12} /> Add Option
              </button>
            </div>
            <Select
              value={selectedCategoryId}
              onValueChange={(value) => {
                if (value === ADD_NEW_SENTINEL) {
                  setAddingJerseyType(true);
                  return;
                }
                setSelectedCategoryId(value);
              }}
            >
              <SelectTrigger aria-label="Select Jersey Type">
                <SelectValue placeholder="Select jersey type" />
              </SelectTrigger>
              <SelectContent>
                {categoryList.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
                <SelectItem value={ADD_NEW_SENTINEL} className="text-gold">
                  + Add New Option...
                </SelectItem>
              </SelectContent>
            </Select>
            <FieldError message={state.fieldErrors?.categoryId ?? jerseyTypeError ?? undefined} />

            {addingJerseyType && (
              <div className="mt-2 flex items-center gap-2">
                <Input
                  value={newJerseyTypeName}
                  onChange={(e) => setNewJerseyTypeName(e.target.value)}
                  placeholder="e.g. National, Club, Retro..."
                  disabled={isAddingCategory}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddJerseyType();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isAddingCategory}
                  onClick={handleAddJerseyType}
                >
                  {isAddingCategory ? "..." : "Add"}
                </Button>
                <button
                  type="button"
                  onClick={() => setAddingJerseyType(false)}
                  aria-label="Cancel"
                  className="p-1 text-paper-dim hover:text-danger"
                >
                  <X size={15} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. When "Club" is chosen in Jersey Type -> show "Club Type" (Home, Away, Third, + Add Option) */}
        {isClubSelected && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label className="mb-0">Club Type</Label>
              <button
                type="button"
                onClick={() => setAddingClubType((v) => !v)}
                className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-gold hover:underline"
              >
                <Plus size={12} /> Add Option
              </button>
            </div>
            <Select
              value={selectedClubType}
              onValueChange={(value) => {
                if (value === ADD_NEW_SENTINEL) {
                  setAddingClubType(true);
                  return;
                }
                setSelectedClubType(value);
              }}
            >
              <SelectTrigger aria-label="Select Club Type">
                <SelectValue placeholder="Select club type" />
              </SelectTrigger>
              <SelectContent>
                {CLUB_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {CLUB_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
                {customClubOptions.map((opt) => (
                  <SelectItem key={`CUSTOM:${opt}`} value={`CUSTOM:${opt}`}>
                    {opt}
                  </SelectItem>
                ))}
                <SelectItem value={ADD_NEW_SENTINEL} className="text-gold">
                  + Add New Option...
                </SelectItem>
              </SelectContent>
            </Select>
            <FieldError message={state.fieldErrors?.type} />

            {addingClubType && (
              <div className="mt-2 flex items-center gap-2">
                <Input
                  value={newClubTypeName}
                  onChange={(e) => setNewClubTypeName(e.target.value)}
                  placeholder="e.g. Home, Away, Third..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddClubType();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddClubType}>
                  Add
                </Button>
                <button
                  type="button"
                  onClick={() => setAddingClubType(false)}
                  aria-label="Cancel"
                  className="p-1 text-paper-dim hover:text-danger"
                >
                  <X size={15} />
                </button>
              </div>
            )}
          </div>
        )}
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
            defaultValue={
              product?.discountPriceCents ? centsToUnits(product.discountPriceCents) : undefined
            }
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
        <Input
          id="tags"
          name="tags"
          defaultValue={displayTags}
          placeholder="retro, home, 2026"
        />
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
          <Checkbox name="showInHeroBanner" defaultChecked={product?.showInHeroBanner} /> Show in
          Hero Banner
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
