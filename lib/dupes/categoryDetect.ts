export type DupeCategory = "clothing" | "jewelry" | "bag" | "fragrance";

const FRAGRANCE_RE = /\b(perfume|fragrance|cologne|eau\s*de|edt|edp|scent|parfum|mist|toilette)\b/i;
const BAG_RE = /\b(bag|purse|handbag|tote|clutch|crossbody|satchel|backpack|pouch|wallet)\b/i;
const JEWELRY_RE = /\b(necklace|bracelet|ring|earring|jewelry|jewellery|pendant|bangle|anklet|brooch|charm)\b/i;

export function detectDupeCategory(text: string): DupeCategory {
  if (FRAGRANCE_RE.test(text)) return "fragrance";
  if (BAG_RE.test(text)) return "bag";
  if (JEWELRY_RE.test(text)) return "jewelry";
  return "clothing";
}

export function categoryLabel(cat: DupeCategory): string {
  const labels: Record<DupeCategory, string> = {
    fragrance: "Fragrance",
    bag: "Bag",
    jewelry: "Jewelry",
    clothing: "Clothing",
  };
  return labels[cat];
}
