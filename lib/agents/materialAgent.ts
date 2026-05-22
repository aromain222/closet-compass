import type { MaterialProfile, ProductResult } from "@/lib/products/types";
import { buildMaterialProfile } from "@/lib/materials/extractMaterials";

export function createMaterialProfiles(products: ProductResult[]): MaterialProfile[] {
  return products.map(buildMaterialProfile);
}

export function summarizeMaterialNotes(products: ProductResult[]): string[] {
  return products.slice(0, 5).map((product) => {
    const fibers = product.normalizedMaterials
      .map((item) => `${item.percentage ?? "unknown"}% ${item.fiber}`)
      .join(", ");
    return `${product.title}: ${fibers || "material unknown"}; softness ${product.softnessScore}/100, breathability ${product.breathabilityScore}/100.`;
  });
}
