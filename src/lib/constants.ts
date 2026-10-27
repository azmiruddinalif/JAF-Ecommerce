export const AVAILABLE_SIZES = ["S", "M", "L", "XL", "XXL"] as const;

export const JERSEY_TYPES = ["HOME", "AWAY", "THIRD", "RETRO"] as const;

export const JERSEY_TYPE_LABELS: Record<(typeof JERSEY_TYPES)[number], string> = {
  HOME: "Home",
  AWAY: "Away",
  THIRD: "Third",
  RETRO: "Retro",
};

export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "featured", label: "Featured" },
  { value: "discount", label: "Discount" },
];
