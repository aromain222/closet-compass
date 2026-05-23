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
  // Extract meaningful keywords from the title (skip short/common words)
  const stopWords = new Set(["the", "and", "for", "with", "from", "that", "this", "are", "was"]);
  const keywords = source.title
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w))
    .slice(0, 3)
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

  return candidates
    .filter((candidate) => candidate.id !== input.sourceProduct.id)
    .filter((candidate) => candidate.price > 0 && candidate.price < input.sourceProduct.price)
    .map((candidate) => createDupeComparison(input.sourceProduct, candidate))
    .sort((a, b) => b.score.finalDupeScore - a.score.finalDupeScore)
    .slice(0, input.limit ?? 8);
}
