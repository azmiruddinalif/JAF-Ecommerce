import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductBySlug, getRelatedProducts } from "@/lib/data/products";
import { Gallery } from "@/components/product/gallery";
import { AddToCartForm } from "@/components/product/add-to-cart-form";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { JERSEY_TYPE_LABELS } from "@/lib/constants";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Live stock/pricing per product — always render at request time rather
// than maintaining a static shell.
export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const description = product.description.slice(0, 160);
  const image = product.images[0]?.secureUrl;

  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

async function RelatedProducts({ categoryId, productId }: { categoryId: string; productId: string }) {
  const related = await getRelatedProducts(categoryId, productId);
  if (related.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h2 className="mb-8 font-display text-2xl">YOU MAY ALSO LIKE</h2>
      <ProductGrid products={related} />
    </section>
  );
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand ?? "JAF" },
    image: product.images.map((img) => img.secureUrl),
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/product/${product.slug}`,
      priceCurrency: "BDT",
      price: ((product.discountPriceCents ?? product.basePriceCents) / 100).toFixed(2),
      availability:
        totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="mb-8 text-xs text-paper-dim">
        <Link href="/shop" className="hover:text-gold">
          Shop
        </Link>{" "}
        /{" "}
        <Link href={`/category/${product.category.slug}`} className="hover:text-gold">
          {product.category.name}
        </Link>{" "}
        / <span className="text-paper">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <Gallery
          images={product.images.map((img) => ({ id: img.id, secureUrl: img.secureUrl, altText: img.altText }))}
          productName={product.name}
        />

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="neutral">{product.category.name}</Badge>
            <Badge variant="neutral">{JERSEY_TYPE_LABELS[product.type] ?? product.type}</Badge>
            {product.newArrival && <Badge variant="emerald">New Arrival</Badge>}
            {totalStock === 0 && <Badge variant="danger">Sold Out</Badge>}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl">{product.name}</h1>
          {product.brand && <p className="mt-1 text-sm text-paper-dim">{product.brand}</p>}

          <div className="mt-6">
            <AddToCartForm
              productId={product.id}
              variants={product.variants.map((v) => ({ id: v.id, size: v.size, stock: v.stock, priceCents: v.priceCents }))}
              basePriceCents={product.basePriceCents}
              discountPriceCents={product.discountPriceCents}
            />
          </div>

          <div className="mt-10 border-t border-ink-border pt-8">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-paper-dim">Description</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-paper/80">{product.description}</p>
          </div>

          {product.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="border border-ink-border px-2.5 py-1 text-[11px] uppercase text-paper-dim">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <Suspense fallback={<ProductGridSkeleton count={4} />}>
        <RelatedProducts categoryId={product.categoryId} productId={product.id} />
      </Suspense>
    </div>
  );
}
