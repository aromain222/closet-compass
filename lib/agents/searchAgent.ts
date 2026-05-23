import type { ProductSearchInput, ProductSearchResponse } from "@/lib/products/types";
import { getProductSearchProvider } from "@/lib/products/searchProvider";
import { summarizeMaterialNotes } from "@/lib/agents/materialAgent";

export async function runSearchAgent(input: ProductSearchInput): Promise<ProductSearchResponse> {
  const provider = getProductSearchProvider();
  const products = await provider.search(input);
  const materialNotes = summarizeMaterialNotes(products);

  return {
    query: input.query,
    products,
    agentSummary:
      products.length > 0
        ? `Found ${products.length} product${products.length === 1 ? "" : "s"} with material data prioritized for softness, stretch, breathability, opacity, and care.`
        : "No matching products found — try a broader search term.",
    materialNotes,
    filtersApplied: {
      maxPrice: input.maxPrice ?? null,
      preferredMaterials: input.preferredMaterials ?? [],
      avoidMaterials: input.avoidMaterials ?? [],
      occasion: input.occasion ?? null,
      stylePreferences: input.stylePreferences ?? [],
      sizePreferences: input.sizePreferences ?? {}
    }
  };
}
