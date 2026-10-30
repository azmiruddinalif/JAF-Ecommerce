import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getAllCategories } from "@/lib/data/categories";
import { getProductByIdForAdmin } from "@/lib/data/products";
import { ProductForm } from "@/components/admin/product-form";
import { ImageUploader } from "@/components/admin/image-uploader";

export const metadata = { title: "Edit Product", robots: { index: false } };
export const instant = false;

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([getProductByIdForAdmin(id), getAllCategories()]);

  if (!product) notFound();

  return (
    <div className="max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-paper-dim hover:text-gold"
        >
          <ArrowLeft size={14} /> Back to Products
        </Link>
        {product.published && (
          <Link
            href={`/product/${product.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold hover:underline"
          >
            View Live Product <ExternalLink size={13} />
          </Link>
        )}
      </div>
      <h1 className="mb-8 font-display text-3xl">EDIT PRODUCT</h1>

      <section className="mb-10">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-paper-dim">Images</h2>
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
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-paper-dim">Details</h2>
        <ProductForm
          categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
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
    </div>
  );
}
