import type { DupeComparison, ProductResult } from "@/lib/products/types";
import { createDupeComparison } from "@/lib/dupes/dupeScore";
import { detectDupeCategory, type DupeCategory } from "@/lib/dupes/categoryDetect";
import { getProductSearchProvider, searchFragranceCommunityDupes, searchCategoryDupes, enrichSourceProductMaterials } from "@/lib/products/searchProvider";

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

// Serper Shopping sets brand = retailer domain, not the actual product brand.
// Check both the brand field AND the title to catch same-brand results.
function isSameBrand(candidate: ProductResult, sourceBrand: string, category: DupeCategory): boolean {
  const b = candidate.brand.toLowerCase();
  const titleLower = candidate.title.toLowerCase();
  if (b === sourceBrand) return true;

  const sourceFirstWord = sourceBrand.split(" ")[0];
  if (sourceFirstWord.length >= 4) {
    if (b.startsWith(sourceFirstWord)) return true;
    // Title check needed for fragrance where brand field = retailer domain
    if (titleLower.startsWith(sourceFirstWord)) return true;
  }
  return false;
}

// Reject sample vials and travel sizes — they're not real alternatives
const SAMPLE_RE = /\b(vial|sample|decant|tester|1\.7\s*ml|1\s*ml|2\s*ml|3\s*ml|travel\s*size|mini\s*spray)\b/i;

function isFragranceSample(candidate: ProductResult): boolean {
  return SAMPLE_RE.test(candidate.title);
}

export async function runDupeAgent(input: DupeAgentInput): Promise<{ comparisons: DupeComparison[]; category: DupeCategory; sourceProduct: ProductResult }> {
  const category = detectDupeCategory(input.sourceProduct.title);

  // Enrich source product with web-fetched fabric specs if shopping API returned no material data
  const sourceProduct = await enrichSourceProductMaterials(input.sourceProduct);

  let candidates: ProductResult[];
  if (category === "fragrance") {
    candidates = await searchFragranceCommunityDupes(sourceProduct.title, input.maxPrice);
  } else {
    const provider = getProductSearchProvider();
    const query = buildDupeQuery(sourceProduct, category);
    const sourceFibers = sourceProduct.normalizedMaterials.map((m) => m.fiber)
      .concat(sourceProduct.listedMaterials)
      .filter((f) => f.length >= 3);
    const preferred = [...new Set([...(input.preferredMaterials ?? []), ...sourceFibers])];
    const maxPrice = input.maxPrice ?? sourceProduct.price - 1;

    const [shoppingResults, communityResults] = await Promise.all([
      provider.search({
        query,
        maxPrice,
        preferredMaterials: preferred.length > 0 ? preferred : undefined,
        avoidMaterials: input.avoidMaterials,
      }),
      searchCategoryDupes(sourceProduct.title, category as "clothing" | "bag" | "jewelry", maxPrice),
    ]);

    // Merge: community picks first, shopping fills remaining slots
    const seen = new Set<string>();
    candidates = [];
    for (const p of [...communityResults, ...shoppingResults]) {
      if (!seen.has(p.id)) { seen.add(p.id); candidates.push(p); }
    }
  }

  const sourceBrand = sourceProduct.brand.toLowerCase();
  const sourceRetailer = sourceProduct.retailer.toLowerCase();

  const comparisons = candidates
    .filter((c) => c.id !== sourceProduct.id)
    .filter((c) => c.price > 0 && c.price < sourceProduct.price)
    .filter((c) => !isSameBrand(c, sourceBrand, category))
    .filter((c) => c.retailer.toLowerCase() !== sourceRetailer)
    .filter((c) => category !== "fragrance" || !isFragranceSample(c))
    .map((c) => createDupeComparison(sourceProduct, c, category))
    .sort((a, b) => b.score.finalDupeScore - a.score.finalDupeScore)
    .slice(0, input.limit ?? 8);

  return { comparisons, category, sourceProduct };
}
