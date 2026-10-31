import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getAllCategories } from "@/lib/data/categories";
import { getProductByIdForAdmin } from "@/lib/data/products";
import { ProductForm } from "@/components/admin/product-form";
import { ImageUploader } from "@/components/admin/image-uploader";

export const metadata = { title: "Edit Product", robots: { index: false } };
export const instant = false;

async function EditProductContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductByIdForAdmin(id),
    getAllCategories(),
  ]);

  if (!product) notFound();

  return (
    <>
      <section className="mb-10">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-paper-dim">
          Images
        </h2>
        <ImageUploader
          productId={product.id}
          images={product.images.map((img) => ({
            id: img.id,
            secureUrl: img.secureUrl,
            altText: img.altText,
            displayOrder: img.displayOrder,
            isPrimary: img.isPrimary,
          }))}
        />
      </section>

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-paper-dim">
          Details
        </h2>
        <ProductForm
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
          }))}
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            categoryId: product.categoryId,
            type: product.type,
            basePriceCents: product.basePriceCents,
            discountPriceCents: product.discountPriceCents,
            sku: product.sku,
            brand: product.brand,
            tags: product.tags,
            featured: product.featured,
            newArrival: product.newArrival,
            published: product.published,
            customizable: product.customizable,
            showInHeroBanner: product.showInHeroBanner,
            heroBannerLabel: product.heroBannerLabel,
            variants: product.variants,
          }}
        />
      </section>
    </>
  );
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="max-w-4xl">
      <h1 className="mb-8 font-display text-3xl">EDIT PRODUCT</h1>
      <Suspense fallback={<div className="h-96 animate-pulse bg-ink-raised" />}>
        <EditProductContent params={params} />
      </Suspense>
    </div>
  );
}
