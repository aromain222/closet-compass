import type { DupeComparison, ProductResult } from "@/lib/products/types";
import { createDupeComparison } from "@/lib/dupes/dupeScore";
import { getProductSearchProvider } from "@/lib/products/searchProvider";

interface DupeAgentInput {
  sourceProduct: ProductResult;
  maxPrice?: number;
  preferredMaterials?: string[];
  avoidMaterials?: string[];
  limit?: number;
}

function buildDupeQuery(source: ProductResult): string {
  // Use category + key style words from title, excluding brand/retailer names
  // so dupes come from different brands
  const brandWords = new Set(
    [...source.brand.toLowerCase().split(/\s+/), ...source.retailer.toLowerCase().split(/\s+/)]
  );
  const stopWords = new Set(["the", "and", "for", "with", "from", "that", "this", "are", "was", "mens", "womens", "women", "men"]);
  const keywords = source.title
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stopWords.has(w) && !brandWords.has(w))
    .slice(0, 4)
    .join(" ");
  return keywords || source.category;
}

export async function runDupeAgent(input: DupeAgentInput): Promise<DupeComparison[]> {
  const provider = getProductSearchProvider();
  const query = buildDupeQuery(input.sourceProduct);
  const candidates = await provider.search({
    query,
    maxPrice: input.maxPrice ?? input.sourceProduct.price - 1,
    preferredMaterials: input.preferredMaterials,
    avoidMaterials: input.avoidMaterials,
  });

  const sourceBrand = input.sourceProduct.brand.toLowerCase();
  const sourceRetailer = input.sourceProduct.retailer.toLowerCase();

  return candidates
    .filter((candidate) => candidate.id !== input.sourceProduct.id)
    .filter((candidate) => candidate.price > 0 && candidate.price < input.sourceProduct.price)
    .filter((candidate) => {
      const b = candidate.brand.toLowerCase();
      const r = candidate.retailer.toLowerCase();
      return b !== sourceBrand && r !== sourceRetailer;
    })
    .map((candidate) => createDupeComparison(input.sourceProduct, candidate))
    .sort((a, b) => b.score.finalDupeScore - a.score.finalDupeScore)
    .slice(0, input.limit ?? 8);
}
