export const STORE_CONTACT = {
  legalName: "JERSEYS & FASHION",
  address:
    "Shop No # 6, 7, 8, 9, 14, 15 & 27 (1st Floor), Shahabuddin Plaza, Janata Co-Operative Housing Society Ltd, House No # 13, 23 Road No # 1, Ring Road, Adabor, Mohammadpur, Dhaka-1207",
  phones: ["+8801328-366311", "+8801846-152393"],
  bkashNumbers: ["+880 1736-656164 (Bkash)", "+880 1966-277445 (Bkash-Nagad)"],
  email: "rumananasim13@gmail.com",
};

export const AVAILABLE_SIZES = ["S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"] as const;

export const NO_SIZE_VALUE = "Standard";

export function isNoSizeVariant(size?: string | null): boolean {
  if (!size) return true;
  const normalized = size.trim().toLowerCase();
  return (
    normalized === "" ||
    normalized === "standard" ||
    normalized === "no size" ||
    normalized === "no-size" ||
    normalized === "regular" ||
    normalized === "default" ||
    normalized === "n/a" ||
    normalized === "none"
  );
}

export const JERSEY_TYPES = ["HOME", "AWAY", "THIRD", "RETRO"] as const;

export const CLUB_TYPES = ["HOME", "AWAY", "THIRD"] as const;

export const JERSEY_TYPE_LABELS: Record<(typeof JERSEY_TYPES)[number], string> = {
  HOME: "Home",
  AWAY: "Away",
  THIRD: "Third",
  RETRO: "Retro",
};

export const CLUB_TYPE_LABELS: Record<(typeof CLUB_TYPES)[number], string> = {
  HOME: "Home",
  AWAY: "Away",
  THIRD: "Third",
};

export const DEFAULT_JERSEY_CATEGORIES = [
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
] as const;

export const OTHER_PRODUCT_CATEGORY_PRESETS = [
  {
    name: "Football Boots",
    slug: "football-boots",
    description: "Firm ground, indoor, and turf football boots engineered for traction, touch, and speed.",
    displayOrder: 4,
  },
  {
    name: "Tracksuits & Jackets",
    slug: "tracksuits-jackets",
    description: "Premium club and national team training tracksuits, anthem jackets, and warm-up tops.",
    displayOrder: 5,
  },
  {
    name: "Shorts & Pants",
    slug: "shorts-pants",
    description: "Breathable matchday football shorts, training pants, and athletic joggers.",
    displayOrder: 6,
  },
  {
    name: "Training Wear",
    slug: "training-wear",
    description: "High-performance football training shirts, drill tops, and base layers.",
    displayOrder: 7,
  },
  {
    name: "Accessories & Gear",
    slug: "accessories-gear",
    description: "Football socks, shin guards, goalkeeper gloves, gym bags, and fan accessories.",
    displayOrder: 8,
  },
] as const;

export function isClubCategory(category?: { name?: string | null; slug?: string | null } | null): boolean {
  if (!category) return false;
  const slug = (category.slug ?? "").toLowerCase();
  const name = (category.name ?? "").toLowerCase();
  return slug === "club-jerseys" || slug === "club" || name === "club" || name === "club jerseys";
}

export function isJerseySubCategory(
  category?: { name?: string | null; slug?: string | null } | null
): boolean {
  if (!category) return false;
  const slug = (category.slug ?? "").toLowerCase();
  const name = (category.name ?? "").toLowerCase();
  return (
    slug === "national-teams" ||
    slug === "national" ||
    slug === "club-jerseys" ||
    slug === "club" ||
    slug === "retro" ||
    slug === "retro-jerseys" ||
    name === "national" ||
    name === "national teams" ||
    name === "club" ||
    name === "club jerseys" ||
    name === "retro" ||
    name === "retro jerseys" ||
    slug.startsWith("jersey-") ||
    name.includes("jersey")
  );
}

export function getClubTypeLabel(type: string, tags?: string[] | null): string {
  if (tags && tags.length > 0) {
    const customTag = tags.find(
      (t) => t.toLowerCase().startsWith("club-type:") || t.toLowerCase().startsWith("sub-type:")
    );
    if (customTag) {
      const colonIdx = customTag.indexOf(":");
      const label = colonIdx >= 0 ? customTag.slice(colonIdx + 1).trim() : "";
      if (label) {
        return label.charAt(0).toUpperCase() + label.slice(1);
      }
    }
  }
  return JERSEY_TYPE_LABELS[type as keyof typeof JERSEY_TYPE_LABELS] ?? type;
}

export function getSubTypeFromTags(tags?: string[] | null): string | null {
  if (!tags || tags.length === 0) return null;
  const tag = tags.find(
    (t) => t.toLowerCase().startsWith("sub-type:") || t.toLowerCase().startsWith("club-type:")
  );
  if (!tag) return null;
  const colonIdx = tag.indexOf(":");
  const val = colonIdx >= 0 ? tag.slice(colonIdx + 1).trim() : "";
  return val ? val.charAt(0).toUpperCase() + val.slice(1) : null;
}

export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "featured", label: "Featured" },
  { value: "discount", label: "Discount" },
];
