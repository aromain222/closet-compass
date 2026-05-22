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

export async function runDupeAgent(input: DupeAgentInput): Promise<DupeComparison[]> {
  const provider = getProductSearchProvider();
  const candidates = await provider.search({
    query: input.sourceProduct.category,
    maxPrice: input.maxPrice ?? input.sourceProduct.price - 1,
    preferredMaterials: input.preferredMaterials,
    avoidMaterials: input.avoidMaterials
  });

  return candidates
    .filter((candidate) => candidate.id !== input.sourceProduct.id)
    .filter((candidate) => candidate.price < input.sourceProduct.price)
    .map((candidate) => createDupeComparison(input.sourceProduct, candidate))
    .sort((a, b) => b.score.finalDupeScore - a.score.finalDupeScore)
    .slice(0, input.limit ?? 8);
}
