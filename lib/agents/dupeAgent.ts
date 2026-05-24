import type { DupeComparison, ProductResult } from "@/lib/products/types";
import { createDupeComparison } from "@/lib/dupes/dupeScore";
import { detectDupeCategory, type DupeCategory } from "@/lib/dupes/categoryDetect";
import { getProductSearchProvider, searchFragranceCommunityDupes } from "@/lib/products/searchProvider";

interface DupeAgentInput {
  sourceProduct: ProductResult;
  maxPrice?: number;
  preferredMaterials?: string[];
  avoidMaterials?: string[];
  limit?: number;
}

function extractMaterialTerms(source: ProductResult): string {
  const fibers = source.normalizedMaterials.length > 0
    ? source.normalizedMaterials.map((m) => m.fiber)
    : source.listedMaterials;
  // Skip generic/uninformative fibers that add noise to shopping queries
  const skip = new Set(["unknown", "other", "blend", "fabric", "material"]);
  return fibers
    .filter((f) => f.length >= 3 && !skip.has(f.toLowerCase()))
    .slice(0, 2)
    .join(" ");
}

function buildDupeQuery(source: ProductResult, category: DupeCategory): string {
  if (category === "fragrance") {
    const cleaned = source.title
      .replace(/\b(eau\s+de\s+(parfum|toilette|cologne)|edt|edp|spray|\d+\s*ml)\b/gi, "")
      .trim();
    return `${cleaned} dupe alternative`;
  }

  const brandWords = new Set([
    ...source.brand.toLowerCase().split(/\s+/),
    ...source.retailer.toLowerCase().split(/\s+/),
  ]);
  const stopWords = new Set([
    "the", "and", "for", "with", "from", "that", "this", "are", "was", "mens", "womens", "women", "men",
  ]);
  const keywords = source.title
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stopWords.has(w) && !brandWords.has(w))
    .slice(0, 3)
    .join(" ");

  const materials = extractMaterialTerms(source);
  const base = [keywords || source.title, materials].filter(Boolean).join(" ").trim();

  if (category === "jewelry") return base + " jewelry dupe";
  if (category === "bag") return base + " bag dupe alternative";
  return base;
}

function isSameBrand(candidateBrand: string, sourceBrand: string, category: DupeCategory): boolean {
  if (candidateBrand === sourceBrand) return true;
  // For fragrance, also block prefix matches: "Creed Men's" when source brand is "Creed Aventus"
  if (category === "fragrance") {
    const sourceFirstWord = sourceBrand.split(" ")[0];
    if (sourceFirstWord.length >= 4 && candidateBrand.startsWith(sourceFirstWord)) return true;
  }
  return false;
}

export async function runDupeAgent(input: DupeAgentInput): Promise<{ comparisons: DupeComparison[]; category: DupeCategory }> {
  const category = detectDupeCategory(input.sourceProduct.title);

  let candidates: ProductResult[];
  if (category === "fragrance") {
    // Community-aware search: web search → extract dupe names → shopping lookup
    candidates = await searchFragranceCommunityDupes(input.sourceProduct.title, input.maxPrice);
  } else {
    const provider = getProductSearchProvider();
    const query = buildDupeQuery(input.sourceProduct, category);
    // Merge caller's preferred materials with those inferred from the source product
    const sourceFibers = input.sourceProduct.normalizedMaterials.map((m) => m.fiber)
      .concat(input.sourceProduct.listedMaterials)
      .filter((f) => f.length >= 3);
    const preferred = [...new Set([...(input.preferredMaterials ?? []), ...sourceFibers])];

    candidates = await provider.search({
      query,
      maxPrice: input.maxPrice ?? input.sourceProduct.price - 1,
      preferredMaterials: preferred.length > 0 ? preferred : undefined,
      avoidMaterials: input.avoidMaterials,
    });
  }

  const sourceBrand = input.sourceProduct.brand.toLowerCase();
  const sourceRetailer = input.sourceProduct.retailer.toLowerCase();

  const comparisons = candidates
    .filter((c) => c.id !== input.sourceProduct.id)
    .filter((c) => c.price > 0 && c.price < input.sourceProduct.price)
    .filter((c) => !isSameBrand(c.brand.toLowerCase(), sourceBrand, category) && c.retailer.toLowerCase() !== sourceRetailer)
    .map((c) => createDupeComparison(input.sourceProduct, c, category))
    .sort((a, b) => b.score.finalDupeScore - a.score.finalDupeScore)
    .slice(0, input.limit ?? 8);

  return { comparisons, category };
}
