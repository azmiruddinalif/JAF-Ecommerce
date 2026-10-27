import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function photo(id: string, w = 1600, h = 1200) {
  return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=80&auto=format`;
}

// Starting taxonomy only — no demo products or stock photography. Real
// products (with real photography) are created from `/admin/products`;
// "Home"/"Away"/"Third"/"Retro" is the per-product `type` field, not a
// category, so it isn't seeded here.
const categories = [
  { name: "Club Jerseys", slug: "club-jerseys", description: "Official and inspired club kits.", displayOrder: 1 },
  { name: "National Teams", slug: "national-teams", description: "Represent your country.", displayOrder: 2 },
  { name: "Premier League", slug: "premier-league", description: "England's top flight.", displayOrder: 3 },
  { name: "La Liga", slug: "la-liga", description: "Spanish football royalty.", displayOrder: 4 },
  { name: "Training", slug: "training", description: "Performance training wear.", displayOrder: 5 },
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
