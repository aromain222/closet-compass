export type DupeCategory = "clothing" | "jewelry" | "bag" | "fragrance";

const FRAGRANCE_KEYWORDS_RE = /\b(perfume|fragrance|cologne|eau\s*de|edt|edp|scent|parfum|mist|toilette)\b/i;

// Well-known fragrance house names — when these appear alone (no bag/jewelry/clothing context) treat as fragrance
const FRAGRANCE_BRANDS_RE = /\b(chanel|dior|ysl|saint\s*laurent|gucci|prada|tom\s*ford|jo\s*malone|maison\s*margiela|creed|byredo|le\s*labo|diptyque|narciso|valentino|givenchy|lancome|mugler|baccarat|black\s*opium|miss\s*dior|good\s*girl|chance|n[o°]?\s*5)\b/i;

const BAG_RE = /\b(bag|purse|handbag|tote|clutch|crossbody|satchel|backpack|pouch|wallet)\b/i;
const JEWELRY_RE = /\b(necklace|bracelet|ring|earring|jewelry|jewellery|pendant|bangle|anklet|brooch|charm)\b/i;
const CLOTHING_RE = /\b(dress|skirt|top|blouse|shirt|pant|jean|cardigan|sweater|jacket|coat|legging|shorts|blazer|trouser)\b/i;

export function detectDupeCategory(text: string): DupeCategory {
  if (FRAGRANCE_KEYWORDS_RE.test(text)) return "fragrance";
  if (BAG_RE.test(text)) return "bag";
  if (JEWELRY_RE.test(text)) return "jewelry";
  // Brand name with no clothing context → fragrance
  if (FRAGRANCE_BRANDS_RE.test(text) && !CLOTHING_RE.test(text) && !BAG_RE.test(text)) return "fragrance";
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
