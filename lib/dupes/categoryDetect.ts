export type DupeCategory = "clothing" | "jewelry" | "bag" | "fragrance";

const FRAGRANCE_KEYWORDS_RE = /\b(perfumes?|fragrance|cologne|eau\s*de|edt|edp|scent|parfums?|mist|toilette|shobi)\b/i;

// Well-known fragrance house names — when these appear alone (no bag/jewelry/clothing context) treat as fragrance
// Luxury houses + ME clone brands + popular western dupe brands
const FRAGRANCE_BRANDS_RE = /\b(abercrombie|abercrombie\s*&\s*fitch|acqua\s*di\s*parma|chanel|dior|ysl|saint\s*laurent|gucci|prada|tom\s*ford|jo\s*malone|maison\s*margiela|creed|byredo|le\s*labo|diptyque|narciso|valentino|givenchy|lancome|mugler|baccarat|black\s*opium|miss\s*dior|good\s*girl|chance|n[o°]?\s*5|parfums\s*de\s*marly|maison\s*francis|initio|xerjoff|kilian|penhaligon|roja|amouage|ex\s*nihilo|nishane|orto\s*parisi|vilhelm|etat\s*libre|alexandria\s*fragrances?|the\s*dua\s*brand|yom\s*(?:&|and|layl)?|lattafa|rasasi|afnan|rayhaan|armaf|ajmal|al\s*haramain|swiss\s*arabian|ard\s*al\s*zaafaran|fragrance\s*world|arabian\s*oud|asdaaf|maison\s*alhambra|zimaya|surrati|dossier|oakcha|french\s*avenue|jo\s*milano|twist\s*heritage|club\s*de\s*nuit|alt\.?\s*fragrances?)\b/i;

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
