export const STORE_CONTACT = {
  legalName: "JERSEYS & FASHION",
  address:
    "Shop No # 6, 7, 8, 9, 14, 15 & 27 (1st Floor), Shahabuddin Plaza, Janata Co-Operative Housing Society Ltd, House No # 13, 23 Road No # 1, Ring Road, Adabor, Mohammadpur, Dhaka-1207",
  phones: ["+8801328-366311", "+8801846-152393"],
  bkashNumbers: ["+880 1736-656164 (Bkash)", "+880 1966-277445 (Bkash-Nagad)"],
  email: "rumananasim13@gmail.com",
};

export const AVAILABLE_SIZES = ["S", "M", "L", "XL", "XXL"] as const;

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

export function isClubCategory(category?: { name?: string | null; slug?: string | null } | null): boolean {
  if (!category) return false;
  const slug = (category.slug ?? "").toLowerCase();
  const name = (category.name ?? "").toLowerCase();
  return slug === "club-jerseys" || slug === "club" || name === "club" || name === "club jerseys";
}

export function getClubTypeLabel(type: string, tags?: string[] | null): string {
  if (tags && tags.length > 0) {
    const customTag = tags.find((t) => t.toLowerCase().startsWith("club-type:"));
    if (customTag) {
      const label = customTag.slice("club-type:".length).trim();
      if (label) {
        return label.charAt(0).toUpperCase() + label.slice(1);
      }
    }
  }
  return JERSEY_TYPE_LABELS[type as keyof typeof JERSEY_TYPE_LABELS] ?? type;
}

export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "featured", label: "Featured" },
  { value: "discount", label: "Discount" },
];
