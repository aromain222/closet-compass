import type { ProductResult } from "@/lib/products/types";

export interface ProductGroup {
  key: string;
  label: string;
  sublabel: string;
  badgeVariant: "blush" | "mauve" | "lavender" | "taupe" | "success";
  products: ProductResult[];
}

function qualityScore(p: ProductResult): number {
  return (p.softnessScore + p.breathabilityScore + p.opacityScore + p.durabilityScore) / 4;
}

function materialScore(p: ProductResult): number {
  return p.materialConfidence * 100;
}

export function groupProducts(products: ProductResult[]): ProductGroup[] {
  if (products.length === 0) return [];

  // With very few results, keep it simple
  if (products.length <= 3) {
    return [
      {
        key: "best",
        label: "Best Match",
        sublabel: "Top results for your search",
        badgeVariant: "blush",
        products,
      },
    ];
  }

  const assigned = new Set<string>();

  function pick(
    sorted: ProductResult[],
    max: number,
    minConfidence = 0
  ): ProductResult[] {
    return sorted
      .filter((p) => !assigned.has(p.id) && p.materialConfidence >= minConfidence)
      .slice(0, max);
  }

  function assign(picked: ProductResult[]) {
    picked.forEach((p) => assigned.add(p.id));
    return picked;
  }

  // Best Match — top 3 from backend order (already ranked)
  const bestMatch = assign(pick(products, 3));

  // Best Material Match — highest verified material confidence not yet assigned
  const byMaterial = [...products].sort((a, b) => materialScore(b) - materialScore(a));
  const materialPicks = assign(pick(byMaterial, 2, 0.7));

  // Best Value — good quality + lowest price
  const byValuePrice = [...products]
    .filter((p) => p.materialConfidence >= 0.6)
    .sort((a, b) => a.price - b.price);
  const valuePicks = assign(pick(byValuePrice, 2));

  // Splurge Pick — highest quality score + highest price
  const byQualityPrice = [...products]
    .filter((p) => qualityScore(p) >= 60)
    .sort((a, b) => b.price - a.price || qualityScore(b) - qualityScore(a));
  const splurgePicks = assign(pick(byQualityPrice, 1));

  // Budget Pick — lowest price with any reasonable confidence
  const byPrice = [...products].sort((a, b) => a.price - b.price);
  const budgetPicks = assign(pick(byPrice, 1, 0.4));

  const groups: ProductGroup[] = [];

  if (bestMatch.length > 0)
    groups.push({ key: "best", label: "Best Match", sublabel: "Top results for your search", badgeVariant: "blush", products: bestMatch });
  if (materialPicks.length > 0)
    groups.push({ key: "material", label: "Best Material Match", sublabel: "Highest verified fabric quality", badgeVariant: "lavender", products: materialPicks });
  if (valuePicks.length > 0)
    groups.push({ key: "value", label: "Best Value", sublabel: "Quality fabric at a lower price", badgeVariant: "success", products: valuePicks });
  if (splurgePicks.length > 0)
    groups.push({ key: "splurge", label: "Splurge Pick", sublabel: "Premium quality, worth every penny", badgeVariant: "mauve", products: splurgePicks });
  if (budgetPicks.length > 0)
    groups.push({ key: "budget", label: "Budget Pick", sublabel: "Most affordable option", badgeVariant: "taupe", products: budgetPicks });

  return groups;
}
