const formatter = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

/** Formats an integer cent amount (BDT paisa-equivalent) as a currency string, e.g. 450000 -> "৳4,500" */
export function formatCents(cents: number): string {
  return formatter.format(Math.round(cents) / 100);
}

/**
 * Same as formatCents, but spells out "BDT" instead of the ৳ glyph. Use this
 * wherever the currency symbol isn't reliably renderable — e.g. pdf-lib's
 * standard fonts can't encode ৳ at all, and it's easy to misread as a "6" in
 * some UI fonts at small sizes.
 */
export function formatCentsBDT(cents: number): string {
  const amount = Math.round(cents) / 100;
  return `BDT ${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function centsToUnits(cents: number): number {
  return Math.round(cents) / 100;
}

export function unitsToCents(units: number): number {
  return Math.round(units * 100);
}
