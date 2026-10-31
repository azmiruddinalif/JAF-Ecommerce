import "dotenv/config";
import { PrismaClient, JerseyType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const nationalCategory = await prisma.category.findUnique({ where: { slug: "national-teams" } });
  const clubCategory = await prisma.category.findUnique({ where: { slug: "club-jerseys" } });
  const retroCategory = await prisma.category.findUnique({ where: { slug: "retro" } });

  if (!nationalCategory || !clubCategory || !retroCategory) {
    console.error("Categories not found. Please run seed first.");
    return;
  }

  const products = [
    {
      name: "Argentina 2024 Home Three Star Jersey",
      slug: "argentina-2024-home-jersey",
      description: "Official-style Argentina 3-star home kit with iconic albiceleste stripes and gold embroidery. Engineered for ultimate performance and street style.",
      categoryId: nationalCategory.id,
      type: JerseyType.HOME,
      basePriceCents: 185000, // 1850 BDT
      discountPriceCents: 165000, // 1650 BDT
      sku: "ARG-24-HM",
      brand: "JAF Select",
      tags: ["argentina", "national", "world cup", "messi"],
      featured: true,
      newArrival: true,
      published: true,
      customizable: true,
      showInHeroBanner: true,
      heroBannerLabel: "Argentina Home 2024",
      image: "https://images.unsplash.com/photo-1556816214-6d16c62fbbf6?w=1200&h=1400&fit=crop&q=80&auto=format",
    },
    {
      name: "Real Madrid 24/25 Home White Classic Jersey",
      slug: "real-madrid-24-25-home-jersey",
      description: "The royal white classic kit featuring houndstooth pattern finish and gold accents. Premium breathable fabric designed for matchday.",
      categoryId: clubCategory.id,
      type: JerseyType.HOME,
      basePriceCents: 195000,
      discountPriceCents: 175000,
      sku: "RMA-25-HM",
      brand: "JAF Select",
      tags: ["real madrid", "club", "la liga", "bellingham", "mbappe"],
      featured: true,
      newArrival: true,
      published: true,
      customizable: true,
      showInHeroBanner: true,
      heroBannerLabel: "Real Madrid 24/25",
      image: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=1200&h=1400&fit=crop&q=80&auto=format",
    },
    {
      name: "Brazil 1998 Retro Classic World Cup Jersey",
      slug: "brazil-1998-retro-jersey",
      description: "Iconic canary yellow retro kit made famous by Ronaldo R9 in France 98. Heritage fit with classic green trim collar.",
      categoryId: retroCategory.id,
      type: JerseyType.RETRO,
      basePriceCents: 210000,
      discountPriceCents: 185000,
      sku: "BRA-98-RETRO",
      brand: "JAF Retro Vault",
      tags: ["brazil", "retro", "r9", "ronaldo", "classic"],
      featured: true,
      newArrival: false,
      published: true,
      customizable: true,
      showInHeroBanner: false,
      image: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=1200&h=1400&fit=crop&q=80&auto=format",
    },
    {
      name: "Arsenal 24/25 Away Black & Green Jersey",
      slug: "arsenal-24-25-away-jersey",
      description: "Bold African-inspired design celebrating North London's diaspora culture. Vibrant red and green collar details on deep black base.",
      categoryId: clubCategory.id,
      type: JerseyType.AWAY,
      basePriceCents: 190000,
      discountPriceCents: 170000,
      sku: "ARS-25-AW",
      brand: "JAF Select",
      tags: ["arsenal", "club", "premier league", "saka"],
      featured: true,
      newArrival: true,
      published: true,
      customizable: true,
      showInHeroBanner: true,
      heroBannerLabel: "Arsenal Away 24/25",
      image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&h=1400&fit=crop&q=80&auto=format",
    },
  ];

  for (const item of products) {
    const { image, ...productData } = item;
    const existing = await prisma.product.findUnique({ where: { slug: item.slug } });

    const p = existing
      ? await prisma.product.update({
          where: { id: existing.id },
          data: productData,
        })
      : await prisma.product.create({
          data: {
            ...productData,
            images: {
              create: [
                {
                  secureUrl: image,
                  publicId: `starter-${item.sku}`,
                  isPrimary: true,
                  displayOrder: 1,
                  altText: item.name,
                },
              ],
            },
            variants: {
              create: [
                { size: "M", sku: `${item.sku}-M`, stock: 15, priceCents: item.discountPriceCents ?? item.basePriceCents },
                { size: "L", sku: `${item.sku}-L`, stock: 20, priceCents: item.discountPriceCents ?? item.basePriceCents },
                { size: "XL", sku: `${item.sku}-XL`, stock: 10, priceCents: item.discountPriceCents ?? item.basePriceCents },
                { size: "XXL", sku: `${item.sku}-XXL`, stock: 5, priceCents: item.discountPriceCents ?? item.basePriceCents },
              ],
            },
          },
        });

    console.log(`Product seeded/verified: ${p.name}`);
  }

  console.log("Starter products successfully seeded!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
