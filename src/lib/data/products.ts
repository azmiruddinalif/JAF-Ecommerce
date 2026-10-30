import "server-only";
import { connection } from "next/server";
import { Prisma, JerseyType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isNoSizeVariant } from "@/lib/constants";

const PAGE_SIZE = 12;
const JERSEY_TYPE_VALUES = Object.values(JerseyType);

export type SortOption =
  | "newest"
  | "price-asc"
  | "price-desc"
  | "featured"
  | "discount";

export interface ShopFilters {
  query?: string;
  category?: string;
  type?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: "in-stock" | "all";
  sort?: SortOption;
  page?: number;
}

const productListInclude = {
  images: { orderBy: { displayOrder: "asc" as const }, take: 2 },
  category: true,
  variants: { select: { size: true, stock: true, priceCents: true } },
} satisfies Prisma.ProductInclude;

export type ProductListItem = Prisma.ProductGetPayload<{
  include: typeof productListInclude;
}>;

function buildWhere(filters: ShopFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { published: true };

  if (filters.query) {
    where.OR = [
      { name: { contains: filters.query, mode: "insensitive" } },
      { description: { contains: filters.query, mode: "insensitive" } },
      { tags: { has: filters.query.toLowerCase() } },
    ];
  }

  if (filters.category) {
    where.category = { slug: filters.category };
  }

  if (filters.type && JERSEY_TYPE_VALUES.includes(filters.type as JerseyType)) {
    where.type = filters.type as JerseyType;
  }

  if (filters.size) {
    where.variants = { some: { size: filters.size } };
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const priceFilter: Prisma.IntFilter = {};
    if (filters.minPrice !== undefined) priceFilter.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) priceFilter.lte = filters.maxPrice;
    where.basePriceCents = priceFilter;
  }

  if (filters.availability === "in-stock") {
    where.variants = {
      ...(where.variants as Prisma.ProductVariantListRelationFilter | undefined),
      some: {
        ...(filters.size ? { size: filters.size } : {}),
        stock: { gt: 0 },
      },
    };
  }

  return where;
}

function buildOrderBy(sort: SortOption | undefined): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price-asc":
      return [{ basePriceCents: "asc" }];
    case "price-desc":
      return [{ basePriceCents: "desc" }];
    case "featured":
      return [{ featured: "desc" }, { createdAt: "desc" }];
    case "discount":
      return [{ discountPriceCents: "desc" }, { createdAt: "desc" }];
    case "newest":
    default:
      return [{ createdAt: "desc" }];
  }
}

export async function getShopProducts(filters: ShopFilters) {
  await connection();
  const page = Math.max(1, filters.page ?? 1);
  const where = buildWhere(filters);
  const orderBy = buildOrderBy(filters.sort);

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      include: productListInclude,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getFeaturedProducts(limit = 8) {
  await connection();
  return prisma.product.findMany({
    where: { published: true, featured: true },
    orderBy: { createdAt: "desc" },
    include: productListInclude,
    take: limit,
  });
}

/**
 * Resolves exactly `limit` hero slots in position order. Each slot is either
 * the explicitly curated product (`curatedIds[i]`) or, if that slot is unset
 * or the product no longer exists/is unpublished, auto-filled — preferring
 * products explicitly flagged `showInHeroBanner`, then `featured`, then
 * simply the newest published products. A slot stays `null` only if there
 * simply aren't enough published products to fill it. Position is preserved
 * so a caller can zip the result against per-slot data (e.g. image
 * overrides).
 */
export async function getHeroShowcaseProducts(
  curatedIds: (string | null)[] = [],
  limit = 3
): Promise<(ProductListItem | null)[]> {
  await connection();
  const slots = Array.from({ length: limit }, (_, i) => curatedIds[i] ?? null);
  const explicitIds = [...new Set(slots.filter((id): id is string => Boolean(id)))];

  const explicitProducts = explicitIds.length
    ? await prisma.product.findMany({
        where: { id: { in: explicitIds }, published: true },
        include: productListInclude,
      })
    : [];
  const byId = new Map(explicitProducts.map((p) => [p.id, p]));

  const autoNeeded = slots.filter((id) => !id || !byId.has(id)).length;
  let autoPool: ProductListItem[] = [];
  if (autoNeeded > 0) {
    const tiers: Prisma.ProductWhereInput[] = [
      { showInHeroBanner: true },
      { featured: true },
      {},
    ];
    for (const tierWhere of tiers) {
      if (autoPool.length >= autoNeeded) break;
      const excludeIds = [...explicitIds, ...autoPool.map((p) => p.id)];
      const more = await prisma.product.findMany({
        where: { published: true, id: { notIn: excludeIds }, ...tierWhere },
        orderBy: { createdAt: "desc" },
        include: productListInclude,
        take: autoNeeded - autoPool.length,
      });
      autoPool = [...autoPool, ...more];
    }
  }

  let autoIndex = 0;
  return slots.map((id) => {
    const explicit = id ? byId.get(id) : undefined;
    if (explicit) return explicit;
    return autoPool[autoIndex++] ?? null;
  });
}

export async function getPublishedProductOptions() {
  await connection();
  return prisma.product.findMany({
    where: { published: true },
    select: { id: true, name: true, sku: true },
    orderBy: { name: "asc" },
  });
}

export async function getNewArrivals(limit = 8) {
  await connection();
  return prisma.product.findMany({
    where: { published: true, newArrival: true },
    orderBy: { createdAt: "desc" },
    include: productListInclude,
    take: limit,
  });
}

const productDetailInclude = {
  images: { orderBy: { displayOrder: "asc" as const } },
  category: true,
  variants: { orderBy: { createdAt: "asc" as const } },
} satisfies Prisma.ProductInclude;

export type ProductDetail = Prisma.ProductGetPayload<{
  include: typeof productDetailInclude;
}>;

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  await connection();
  return prisma.product.findFirst({
    where: { slug, published: true },
    include: productDetailInclude,
  });
}

export async function getProductBySlugForAdmin(slug: string) {
  await connection();
  return prisma.product.findUnique({
    where: { slug },
    include: productDetailInclude,
  });
}

export async function getProductByIdForAdmin(id: string) {
  await connection();
  return prisma.product.findUnique({
    where: { id },
    include: productDetailInclude,
  });
}

export async function getRelatedProducts(categoryId: string, excludeProductId: string, limit = 4) {
  await connection();
  return prisma.product.findMany({
    where: {
      published: true,
      categoryId,
      id: { not: excludeProductId },
    },
    include: productListInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getAdminProducts(params: {
  page?: number;
  query?: string;
  category?: string;
  type?: string;
}) {
  await connection();
  const page = Math.max(1, params.page ?? 1);
  const where: Prisma.ProductWhereInput = {};

  if (params.query) {
    where.OR = [
      { name: { contains: params.query, mode: "insensitive" } },
      { sku: { contains: params.query, mode: "insensitive" } },
    ];
  }

  if (params.category) {
    where.category = { slug: params.category };
  }

  if (params.type && JERSEY_TYPE_VALUES.includes(params.type as JerseyType)) {
    where.type = params.type as JerseyType;
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        images: { orderBy: { displayOrder: "asc" }, take: 1 },
        variants: { select: { stock: true } },
      },
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * 20,
      take: 20,
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total, page, pageSize: 20, totalPages: Math.max(1, Math.ceil(total / 20)) };
}

export async function getLowStockProducts(threshold = 5) {
  await connection();
  return prisma.product.findMany({
    where: {
      published: true,
      variants: { some: { stock: { lte: threshold } } },
    },
    include: {
      variants: { where: { stock: { lte: threshold } } },
    },
    take: 10,
  });
}

export async function getProductStockOverview() {
  await connection();
  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      orderBy: { displayOrder: "asc" },
    }),
    prisma.product.findMany({
      include: {
        category: true,
        images: { orderBy: { displayOrder: "asc" }, take: 1 },
        variants: {
          select: { id: true, size: true, sku: true, stock: true, priceCents: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ category: { displayOrder: "asc" } }, { createdAt: "desc" }],
    }),
  ]);

  const productRows = products.map((p) => {
    const sizeStocks: Record<string, number> = {};
    let totalStock = 0;
    for (const v of p.variants) {
      sizeStocks[v.size] = (sizeStocks[v.size] ?? 0) + v.stock;
      totalStock += v.stock;
    }

    const hasSizes =
      p.variants.length > 0 &&
      !(p.variants.length === 1 && isNoSizeVariant(p.variants[0]?.size));

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      published: p.published,
      categoryId: p.categoryId,
      categoryName: p.category.name,
      categorySlug: p.category.slug,
      type: p.type,
      tags: p.tags,
      basePriceCents: p.basePriceCents,
      discountPriceCents: p.discountPriceCents,
      imageUrl: p.images[0]?.secureUrl ?? null,
      totalStock,
      hasSizes,
      sizeStocks,
      variants: p.variants,
    };
  });

  const categorySummaries = categories.map((cat) => {
    const catProducts = productRows.filter((p) => p.categoryId === cat.id);
    const totalStock = catProducts.reduce((sum, p) => sum + p.totalStock, 0);
    const inStockCount = catProducts.filter((p) => p.totalStock > 0).length;
    const lowStockCount = catProducts.filter((p) => p.totalStock > 0 && p.totalStock <= 5).length;
    const outOfStockCount = catProducts.filter((p) => p.totalStock === 0).length;

    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      enabled: cat.enabled,
      productCount: catProducts.length,
      totalStock,
      inStockCount,
      lowStockCount,
      outOfStockCount,
    };
  });

  const totalUnitsInStock = productRows.reduce((sum, p) => sum + p.totalStock, 0);
  const inStockProductsCount = productRows.filter((p) => p.totalStock > 0).length;
  const lowStockProductsCount = productRows.filter(
    (p) => p.totalStock > 0 && p.totalStock <= 5
  ).length;
  const outOfStockProductsCount = productRows.filter((p) => p.totalStock === 0).length;

  return {
    products: productRows,
    categories: categorySummaries,
    totals: {
      totalProducts: productRows.length,
      totalUnitsInStock,
      inStockProductsCount,
      lowStockProductsCount,
      outOfStockProductsCount,
    },
  };
}
