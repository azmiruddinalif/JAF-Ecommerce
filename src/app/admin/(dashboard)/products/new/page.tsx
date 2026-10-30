import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAllCategories } from "@/lib/data/categories";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "New Product", robots: { index: false } };
export const instant = false;

export default async function NewProductPage() {
  const categories = await getAllCategories();

  return (
    <div className="max-w-4xl">
      <Link
        href="/admin/products"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-paper-dim hover:text-gold"
      >
        <ArrowLeft size={14} /> Back to Products
      </Link>
      <h1 className="mb-2 font-display text-3xl">NEW PRODUCT</h1>
      <p className="mb-8 text-sm text-paper-dim">
        Configure product details, category, images, and stock sizes in one step.
      </p>
      <ProductForm categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))} />
    </div>
  );
}
