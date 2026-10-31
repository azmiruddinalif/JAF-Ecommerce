import { Suspense } from "react";
import { getAllCategories } from "@/lib/data/categories";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "New Product", robots: { index: false } };
export const instant = false;

async function NewProductContent() {
  const categories = await getAllCategories();
  return (
    <ProductForm
      categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
    />
  );
}

export default function NewProductPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="mb-2 font-display text-3xl">NEW PRODUCT</h1>
      <p className="mb-8 text-sm text-paper-dim">
        Create the product details first, then add images once it&apos;s saved.
      </p>
      <Suspense fallback={<div className="h-96 animate-pulse bg-ink-raised" />}>
        <NewProductContent />
      </Suspense>
    </div>
  );
}
