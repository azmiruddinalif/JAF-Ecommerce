"use client";

import { useActionState, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ImagePlus, Plus, Trash2, UploadCloud, X } from "lucide-react";
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
  OTHER_PRODUCT_CATEGORY_PRESETS,
  getSubTypeFromTags,
  isClubCategory,
  isJerseySubCategory,
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
const NONE_SUBTYPE_SENTINEL = "__none__";

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

const SUBTYPE_PRESETS_BY_CATEGORY: Record<string, string[]> = {
  "football boots": ["Firm Ground (FG)", "Turf (TF)", "Indoor (IC)", "Soft Ground (SG)"],
  "tracksuits & jackets": ["Full Tracksuit", "Anthem Jacket", "Windbreaker", "Training Top"],
  "shorts & pants": ["Match Shorts", "Training Shorts", "Track Pants", "Joggers"],
  "training wear": ["Drill Top", "Training Jersey", "Sleeveless Vest", "Compression Base Layer"],
  "accessories & gear": ["Football Socks", "Shin Guards", "Goalkeeper Gloves", "Kit Bag", "Cap & Scarf"],
};

export function ProductForm({
  product,
  categories: initialCategories,
}: {
  product?: ProductFormValues;
  categories: CategoryOptionItem[];
}) {
  const [resetKey, setResetKey] = useState(0);
  const handleResetForm = useCallback(() => {
    setResetKey((k) => k + 1);
  }, []);

  return (
    <ProductFormInner
      key={`${product?.id ?? "new"}-${resetKey}`}
      product={product}
      categories={initialCategories}
      onResetForm={handleResetForm}
    />
  );
}

function ProductFormInner({
  product,
  categories: initialCategories,
  onResetForm,
}: {
  product?: ProductFormValues;
  categories: CategoryOptionItem[];
  onResetForm: () => void;
}) {
  const router = useRouter();
  const action = product ? updateProductAction.bind(null, product.id) : createProductAction;
  const [state, formAction, isActionPending] = useActionState(action, initialState);
  const [isSubmitTransition, startSubmitTransition] = useTransition();
  const isPending = isActionPending || isSubmitTransition;
  const isRedirecting = Boolean(state.success && state.productId);
  const redirectedRef = useRef(false);
  const hasResetRef = useRef(false);

  // Controlled text & number inputs so form values never get wiped out on error
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product?.slug));
  const [sku, setSku] = useState(product?.sku ?? "");
  const [skuTouched, setSkuTouched] = useState(Boolean(product?.sku));
  const [description, setDescription] = useState(product?.description ?? "");
  const [basePriceUnits, setBasePriceUnits] = useState(
    product ? String(centsToUnits(product.basePriceCents)) : ""
  );
  const [discountPriceUnits, setDiscountPriceUnits] = useState(
    product?.discountPriceCents ? String(centsToUnits(product.discountPriceCents)) : ""
  );
  const [brand, setBrand] = useState(product?.brand ?? "JAF");
  const [tags, setTags] = useState(
    product?.tags
      .filter(
        (t) => !t.toLowerCase().startsWith("club-type:") && !t.toLowerCase().startsWith("sub-type:")
      )
      .join(", ") ?? ""
  );
  const [heroBannerLabel, setHeroBannerLabel] = useState(product?.heroBannerLabel ?? "");

  // Controlled checkboxes (new products default to `published = true` so they are immediately visible!)
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [newArrival, setNewArrival] = useState(product?.newArrival ?? true);
  const [published, setPublished] = useState(product ? product.published : true);
  const [customizable, setCustomizable] = useState(product?.customizable ?? false);
  const [showInHeroBanner, setShowInHeroBanner] = useState(product?.showInHeroBanner ?? false);

  // New-product image upload state (files + direct URLs)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [directImageUrls, setDirectImageUrls] = useState("");
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);

  // Categories list from DB
  const [categoryList, setCategoryList] = useState<CategoryOptionItem[]>(initialCategories);

  // Separate Jersey categories (National, Club, Retro, etc.) vs Other Product categories
  const jerseyCategories = categoryList.filter((c) => isJerseySubCategory(c));
  const otherDbCategories = categoryList.filter((c) => !isJerseySubCategory(c));

  // Build Main Category options: "Jersey" + all non-jersey DB categories + preset other categories
  const initialProductCat = product
    ? categoryList.find((c) => c.id === product.categoryId)
    : undefined;
  const initialIsOtherCat = Boolean(initialProductCat && !isJerseySubCategory(initialProductCat));

  const [customMainCategories, setCustomMainCategories] = useState<string[]>([]);
  const allMainCategoryOptions = Array.from(
    new Set([
      "Jersey",
      ...otherDbCategories.map((c) => c.name),
      ...OTHER_PRODUCT_CATEGORY_PRESETS.map((p) => p.name),
      ...customMainCategories,
    ])
  );

  const [selectedMainCategory, setSelectedMainCategory] = useState<string>(
    initialIsOtherCat && initialProductCat ? initialProductCat.name : "Jersey"
  );
  const [addingMainCategory, setAddingMainCategory] = useState(false);
  const [newMainCategoryName, setNewMainCategoryName] = useState("");

  // Jersey Type (National, Club, Retro, + custom options backed by Category table)
  const defaultJerseyCategoryId =
    jerseyCategories.find((c) => c.name.toLowerCase() === "club" || c.slug === "club-jerseys")
      ?.id ??
    jerseyCategories[0]?.id ??
    categoryList[0]?.id ??
    "";

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    product?.categoryId ?? defaultJerseyCategoryId
  );
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

  // Sub-type for non-jersey categories (e.g. Firm Ground, Full Tracksuit, Match Shorts, etc.)
  const existingSubType = getSubTypeFromTags(product?.tags) ?? "";
  const [selectedSubType, setSelectedSubType] = useState<string>(
    existingSubType || NONE_SUBTYPE_SENTINEL
  );
  const [customSubTypes, setCustomSubTypes] = useState<string[]>(
    existingSubType ? [existingSubType] : []
  );
  const [addingSubType, setAddingSubType] = useState(false);
  const [newSubTypeName, setNewSubTypeName] = useState("");

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

  // Sync fileInputRef files whenever selectedFiles changes
  useEffect(() => {
    if (!fileInputRef.current || typeof DataTransfer === "undefined") return;
    const dt = new DataTransfer();
    for (const file of selectedFiles) {
      dt.items.add(file);
    }
    fileInputRef.current.files = dt.files;
  }, [selectedFiles]);

  // Redirect to /admin/products listing page, refresh immediately, and reset the form instance
  // so clicking "Add Product" again always shows a fresh Create Product form (even with Next.js cacheComponents).
  useEffect(() => {
    if (!state.success || !state.productId) return;

    const triggerResetOnce = () => {
      if (hasResetRef.current) return;
      hasResetRef.current = true;
      onResetForm();
    };

    if (redirectedRef.current) {
      triggerResetOnce();
      return;
    }

    redirectedRef.current = true;
    router.replace("/admin/products");
    router.refresh();

    const timer = setTimeout(() => {
      triggerResetOnce();
    }, 150);

    return () => {
      clearTimeout(timer);
      triggerResetOnce();
    };
  }, [state.success, state.productId, router, onResetForm]);

  function selectMainCategoryOption(categoryName: string) {
    setSelectedMainCategory(categoryName);
    if (categoryName.toLowerCase() === "jersey") {
      setSelectedCategoryId(defaultJerseyCategoryId);
      return;
    }

    // Check if this category already exists in categoryList
    const match = categoryList.find(
      (c) =>
        c.name.toLowerCase() === categoryName.toLowerCase() ||
        c.slug === slugify(categoryName)
    );
    if (match) {
      setSelectedCategoryId(match.id);
      return;
    }

    // Create it in DB automatically via server action
    startAddCategoryTransition(async () => {
      const res = await createQuickCategoryAction(categoryName);
      if (res.success && res.category) {
        setCategoryList((prev) =>
          prev.some((c) => c.id === res.category!.id) ? prev : [...prev, res.category!]
        );
        setSelectedCategoryId(res.category.id);
      }
    });
  }

  function handleAddMainCategory() {
    const trimmed = newMainCategoryName.trim();
    if (!trimmed) return;
    if (!allMainCategoryOptions.includes(trimmed)) {
      setCustomMainCategories((prev) => [...prev, trimmed]);
    }
    setNewMainCategoryName("");
    setAddingMainCategory(false);
    selectMainCategoryOption(trimmed);
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

  function handleAddSubType() {
    const trimmed = newSubTypeName.trim();
    if (!trimmed) return;
    if (!customSubTypes.includes(trimmed)) {
      setCustomSubTypes((prev) => [...prev, trimmed]);
    }
    setSelectedSubType(trimmed);
    setNewSubTypeName("");
    setAddingSubType(false);
  }

  function addNewProductFiles(files: FileList | File[]) {
    const valid = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (valid.length === 0) return;
    const nextFiles = [...selectedFiles, ...valid];
    setSelectedFiles(nextFiles);
    const newUrls = valid.map((f) => URL.createObjectURL(f));
    setFilePreviews((prev) => [...prev, ...newUrls]);
  }

  function removeSelectedFile(idx: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
    setFilePreviews((prev) => {
      const target = prev[idx];
      if (target) URL.revokeObjectURL(target);
      return prev.filter((_, i) => i !== idx);
    });
  }

  const subTypePresets =
    SUBTYPE_PRESETS_BY_CATEGORY[selectedMainCategory.toLowerCase()] ?? [
      "Standard",
      "Pro / Match",
      "Training",
      "Limited Edition",
    ];
  const allSubTypeOptions = Array.from(new Set([...subTypePresets, ...customSubTypes]));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        formData.delete("productImages");
        for (const file of selectedFiles) {
          formData.append("productImages", file);
        }
        startSubmitTransition(() => {
          formAction(formData);
        });
      }}
      className="flex flex-col gap-6"
    >
      <input type="hidden" name="categoryId" value={selectedCategoryId} readOnly />
      <input type="hidden" name="mainCategoryName" value={selectedMainCategory} readOnly />
      <input type="hidden" name="type" value={effectivePrismaType} readOnly />
      <input
        type="hidden"
        name="customClubType"
        value={isClubSelected ? customClubTypeValue : ""}
        readOnly
      />
      <input
        type="hidden"
        name="customSubType"
        value={
          !isJerseyCategory && selectedSubType !== NONE_SUBTYPE_SENTINEL ? selectedSubType : ""
        }
        readOnly
      />
      <input type="hidden" name="featured" value={featured ? "on" : ""} readOnly />
      <input type="hidden" name="newArrival" value={newArrival ? "on" : ""} readOnly />
      <input type="hidden" name="published" value={published ? "on" : ""} readOnly />
      <input type="hidden" name="customizable" value={customizable ? "on" : ""} readOnly />
      <input
        type="hidden"
        name="showInHeroBanner"
        value={showInHeroBanner ? "on" : ""}
        readOnly
      />

      {state.message && (
        <div
          className={`flex items-center justify-between gap-4 px-4 py-3 text-sm ${
            state.success
              ? "border border-gold/40 bg-gold/10 text-gold"
              : "border border-danger/40 bg-danger/10 text-danger"
          }`}
        >
          <span className="flex items-center gap-2">
            {state.success && <CheckCircle2 size={16} />}
            {state.message}
          </span>
          {state.success && state.productId && (
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider">
              <Link href="/admin/products" className="underline hover:text-paper">
                View All Products
              </Link>
              <Link
                href={`/admin/products/${state.productId}`}
                className="underline hover:text-paper"
              >
                Edit Product
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Product Name & Slug */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            name="name"
            value={name}
            required
            placeholder="e.g. Argentina 2026 Home Jersey or Predator Elite Boots"
            onChange={(e) => {
              const val = e.target.value;
              setName(val);
              if (!slugTouched) {
                setSlug(slugify(val));
              }
              if (!skuTouched && !product) {
                const autoSku = slugify(val).toUpperCase().slice(0, 20);
                setSku(autoSku);
              }
            }}
          />
          <FieldError message={state.fieldErrors?.name} />
        </div>
        <div>
          <Label htmlFor="slug">URL Slug *</Label>
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

      {/* Category & Type Architecture (Aligned 3-Column Grid for both Jerseys and Other Products) */}
      <div className="border border-ink-border bg-ink-raised/50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gold">
              Product Classification & Category
            </h3>
            <p className="mt-0.5 text-xs text-paper-dim">
              Choose &ldquo;Jersey&rdquo; for football kits, or select/add any other product category
              (Boots, Tracksuits, Shorts, Accessories, etc.).
            </p>
          </div>
          <Link
            href="/admin/categories"
            className="text-[11px] font-semibold uppercase tracking-wider text-paper-dim hover:text-gold"
          >
            Manage Categories →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {/* Column 1: Main Product Category */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label className="mb-0">Product Category *</Label>
              <button
                type="button"
                onClick={() => setAddingMainCategory((v) => !v)}
                className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-gold hover:underline"
              >
                <Plus size={12} /> Add Category
              </button>
            </div>
            <Select
              value={selectedMainCategory}
              onValueChange={(value) => {
                if (value === ADD_NEW_SENTINEL) {
                  setAddingMainCategory(true);
                  return;
                }
                selectMainCategoryOption(value);
              }}
            >
              <SelectTrigger aria-label="Select Product Category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {allMainCategoryOptions.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
                <SelectItem value={ADD_NEW_SENTINEL} className="text-gold">
                  + Add New Category...
                </SelectItem>
              </SelectContent>
            </Select>

            {addingMainCategory && (
              <div className="mt-2 flex items-center gap-2">
                <Input
                  value={newMainCategoryName}
                  onChange={(e) => setNewMainCategoryName(e.target.value)}
                  placeholder="e.g. Goalkeeper Gear..."
                  disabled={isAddingCategory}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddMainCategory();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isAddingCategory}
                  onClick={handleAddMainCategory}
                >
                  {isAddingCategory ? "..." : "Add"}
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

          {/* Column 2: Jersey Type (when Jersey) OR Sub-Category / Style (when Other Product) */}
          {isJerseyCategory ? (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label className="mb-0">Jersey Type *</Label>
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
                  {(jerseyCategories.length > 0 ? jerseyCategories : categoryList).map((cat) => (
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
          ) : (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label className="mb-0">Sub-Type / Style</Label>
                <button
                  type="button"
                  onClick={() => setAddingSubType((v) => !v)}
                  className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-gold hover:underline"
                >
                  <Plus size={12} /> Add Option
                </button>
              </div>
              <Select
                value={selectedSubType}
                onValueChange={(value) => {
                  if (value === ADD_NEW_SENTINEL) {
                    setAddingSubType(true);
                    return;
                  }
                  setSelectedSubType(value);
                }}
              >
                <SelectTrigger aria-label="Select Sub-Type">
                  <SelectValue placeholder="Select sub-type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_SUBTYPE_SENTINEL}>General / All Styles</SelectItem>
                  {allSubTypeOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                  <SelectItem value={ADD_NEW_SENTINEL} className="text-gold">
                    + Add New Option...
                  </SelectItem>
                </SelectContent>
              </Select>
              <FieldError message={state.fieldErrors?.categoryId} />

              {addingSubType && (
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    value={newSubTypeName}
                    onChange={(e) => setNewSubTypeName(e.target.value)}
                    placeholder="e.g. Firm Ground, Matchwear..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSubType();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleAddSubType}>
                    Add
                  </Button>
                  <button
                    type="button"
                    onClick={() => setAddingSubType(false)}
                    aria-label="Cancel"
                    className="p-1 text-paper-dim hover:text-danger"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Column 3: Club Type (when Club Jersey) OR Brand (always keeps the 3-column grid aligned) */}
          {isClubSelected ? (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label className="mb-0">Club Kit Type *</Label>
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
                    placeholder="e.g. Fourth Kit, Special Edition..."
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
          ) : (
            <div>
              <Label htmlFor="brand-inline" className="mb-1.5 block">
                Brand
              </Label>
              <Input
                id="brand-inline"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="JAF"
              />
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe fabric quality, fit, season details, and care instructions..."
          required
        />
        <FieldError message={state.fieldErrors?.description} />
      </div>

      {/* Pricing, SKU & Brand */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div>
          <Label htmlFor="basePriceCents">Base Price (৳) *</Label>
          <Input
            id="basePriceCents"
            name="basePriceCents"
            type="number"
            min={0}
            step="0.01"
            value={basePriceUnits}
            onChange={(e) => setBasePriceUnits(e.target.value)}
            placeholder="e.g. 1250"
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
            min={0}
            step="0.01"
            value={discountPriceUnits}
            onChange={(e) => setDiscountPriceUnits(e.target.value)}
            placeholder="Optional sale price"
          />
        </div>
        <div>
          <Label htmlFor="sku">Product SKU *</Label>
          <Input
            id="sku"
            name="sku"
            value={sku}
            onChange={(e) => {
              setSkuTouched(true);
              setSku(e.target.value);
            }}
            placeholder="Auto-filled from name"
            required
          />
          <FieldError message={state.fieldErrors?.sku} />
        </div>
        <div>
          <Label htmlFor="brand">Brand</Label>
          <Input
            id="brand"
            name="brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="JAF"
          />
        </div>
      </div>

      {/* Tags & Hero Banner Label */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input
            id="tags"
            name="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="retro, home, 2026, player-edition"
          />
        </div>
        <div>
          <Label htmlFor="heroBannerLabel">Hero Banner Caption (optional)</Label>
          <Input
            id="heroBannerLabel"
            name="heroBannerLabel"
            value={heroBannerLabel}
            onChange={(e) => setHeroBannerLabel(e.target.value)}
            placeholder="Defaults to the product name"
            maxLength={60}
          />
        </div>
      </div>

      {/* Visibility & Storefront Flags */}
      <div className="border border-ink-border bg-ink-raised/40 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-paper-dim">
          Visibility & Storefront Placement
        </p>
        <div className="flex flex-wrap gap-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-paper">
            <Checkbox
              checked={published}
              onCheckedChange={(v) => setPublished(Boolean(v))}
            />
            Published (Visible on Storefront)
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={featured}
              onCheckedChange={(v) => setFeatured(Boolean(v))}
            />
            Featured Product
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={newArrival}
              onCheckedChange={(v) => setNewArrival(Boolean(v))}
            />
            New Arrival
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={customizable}
              onCheckedChange={(v) => setCustomizable(Boolean(v))}
            />
            Allow Customization (Name / Number)
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={showInHeroBanner}
              onCheckedChange={(v) => setShowInHeroBanner(Boolean(v))}
            />
            Show in Hero Banner
          </label>
        </div>
      </div>

      {/* Product Images Section during Creation (!product) */}
      {!product && (
        <div className="border border-ink-border bg-ink-raised/40 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold">
                <ImagePlus size={15} /> Product Images
              </h3>
              <p className="mt-0.5 text-xs text-paper-dim">
                Upload product photos from your device or paste direct image URLs. The first image
                is used as the primary cover photo.
              </p>
            </div>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingFiles(true);
            }}
            onDragLeave={() => setIsDraggingFiles(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingFiles(false);
              addNewProductFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center gap-2 border-2 border-dashed p-8 text-center transition-colors ${
              isDraggingFiles
                ? "border-gold bg-gold/10"
                : "border-ink-border hover:border-gold/60"
            }`}
          >
            <UploadCloud size={26} className="text-gold" />
            <p className="text-sm text-paper">
              Drag & drop product images here, or click to select files
            </p>
            <p className="text-xs text-paper-dim">JPEG, PNG, WEBP or AVIF — up to 8MB each</p>
            <input
              ref={fileInputRef}
              type="file"
              name="productImages"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addNewProductFiles(e.target.files)}
            />
          </div>

          {filePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {filePreviews.map((previewUrl, idx) => (
                <div
                  key={previewUrl}
                  className="group relative aspect-square overflow-hidden border border-ink-border bg-ink"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt={`Selected preview ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {idx === 0 && (
                    <span className="absolute left-1.5 top-1.5 bg-gold-bright px-2 py-0.5 text-[10px] font-bold uppercase text-ink">
                      Primary
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeSelectedFile(idx)}
                    aria-label="Remove image"
                    className="absolute right-1.5 top-1.5 bg-ink/85 p-1.5 text-paper hover:text-danger"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4">
            <Label htmlFor="productImageUrls">Or Paste Direct Image URL(s) (Optional)</Label>
            <Input
              id="productImageUrls"
              name="productImageUrls"
              value={directImageUrls}
              onChange={(e) => setDirectImageUrls(e.target.value)}
              placeholder="https://images.unsplash.com/... (comma-separated for multiple)"
            />
          </div>
        </div>
      )}

      {/* Sizes & Variants */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label className="mb-0">Sizes & Stock Variants *</Label>
          <span className="text-xs text-paper-dim">
            Variant SKUs auto-generate from Product SKU + Size if left blank
          </span>
        </div>
        <VariantBuilder
          productSku={sku}
          initialRows={
            product && product.variants.length > 0
              ? product.variants.map(variantRowFromExisting)
              : [createEmptyVariantRow("M")]
          }
        />
        <FieldError message={state.fieldErrors?.variants} />
      </div>

      <div className="flex items-center gap-4 pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isPending || isRedirecting}
        >
          {isPending
            ? product
              ? "SAVING CHANGES..."
              : "CREATING PRODUCT..."
            : isRedirecting
              ? "REDIRECTING TO PRODUCTS..."
              : product
                ? "SAVE CHANGES"
                : "CREATE PRODUCT"}
        </Button>
        <Link
          href="/admin/products"
          onClick={() => {
            if (!product) onResetForm();
          }}
          className="text-xs font-semibold uppercase tracking-wider text-paper-dim hover:text-paper"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
