import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function photo(id: string, w = 1600, h = 1200) {
  return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=80&auto=format`;
}

// Starting taxonomy: National, Club, Retro (Club kits are further classified by Home, Away, Third).
const categories = [
  {
    name: "National",
    slug: "national-teams",
    description:
      "Represent your nation on matchday with official-inspired international football jerseys from iconic World Cup, Copa América, and Euro contenders.",
    displayOrder: 1,
  },
  {
    name: "Club",
    slug: "club-jerseys",
    description:
      "Shop current-season and classic European and international club football jerseys — including Home, Away, and Third kits crafted with breathable performance fabrics.",
    displayOrder: 2,
  },
  {
    name: "Retro",
    slug: "retro",
    description:
      "Iconic classic and throwback Retro football jerseys celebrating timeless club and international football heritage.",
    displayOrder: 3,
  },
];

async function main() {
  // Admin identity is provisioned separately via Clerk — see `npm run admin:provision`.

  await prisma.storeSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      heroImageUrl: photo("1556816214-6d16c62fbbf6", 1600, 1400),
      heroImagePublicId: "seed-hero",
      editorialImageUrl: photo("1771344164946-61fa9e4d0212", 1000, 1200),
      editorialImagePublicId: "seed-editorial",
      finalCtaImageUrl: photo("1571754472834-677ab0a62ba7", 1600, 1000),
      finalCtaImagePublicId: "seed-final-cta",
    },
  });
  console.log("Ensured default homepage section images exist (replace from /admin/settings).");

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description, displayOrder: category.displayOrder },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        displayOrder: category.displayOrder,
      },
    });
  }
  console.log(`Ensured ${categories.length} starting categories exist. Add real products from /admin/products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
