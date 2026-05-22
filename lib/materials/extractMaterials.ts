import type { MaterialProfile, ProductResult } from "@/lib/products/types";
import {
  blendToPercentages,
  getMaterialConfidenceLabel,
  normalizeMaterialBlend
} from "@/lib/materials/normalizeMaterials";

const SOFT_FIBERS = new Set(["cashmere", "modal", "lyocell", "silk", "viscose", "rayon"]);
const BREATHABLE_FIBERS = new Set(["linen", "cotton", "organic cotton", "silk", "wool", "lyocell"]);
const SYNTHETIC_FIBERS = new Set(["polyester", "recycled polyester", "nylon", "acrylic"]);
const STRETCH_FIBERS = new Set(["elastane", "spandex"]);

function levelFromScore(score: number): "low" | "medium" | "high" | "unknown" {
  if (score >= 70) return "high";
  if (score >= 35) return "medium";
  if (score > 0) return "low";
  return "unknown";
}

function inferFabricFeel(fibers: string[]): string {
  if (fibers.includes("cashmere")) return "plush, soft, warm handfeel";
  if (fibers.includes("silk")) return "smooth, fluid, cool-to-touch drape";
  if (fibers.includes("modal") || fibers.includes("lyocell")) return "soft, smooth, breathable drape";
  if (fibers.includes("linen")) return "crisp, airy, lightly textured feel";
  if (fibers.includes("cotton") || fibers.includes("organic cotton")) return "natural, breathable cotton handfeel";
  if (fibers.some((fiber) => SYNTHETIC_FIBERS.has(fiber))) return "smooth synthetic feel with lower natural breathability";
  return "material feel requires more product data";
}

export function buildMaterialProfile(product: ProductResult): MaterialProfile {
  const rawMaterialText = [...product.listedMaterials, ...product.inferredMaterials].join(", ");
  const normalizedBlend = normalizeMaterialBlend(rawMaterialText);
  const fibers = normalizedBlend.map((item) => item.fiber);
  const percentages = blendToPercentages(normalizedBlend);
  const naturalShare = normalizedBlend
    .filter((item) => BREATHABLE_FIBERS.has(item.fiber))
    .reduce((sum, item) => sum + (item.percentage ?? 12), 0);
  const stretchShare = normalizedBlend
    .filter((item) => STRETCH_FIBERS.has(item.fiber))
    .reduce((sum, item) => sum + (item.percentage ?? 8), 0);
  const syntheticShare = normalizedBlend
    .filter((item) => SYNTHETIC_FIBERS.has(item.fiber))
    .reduce((sum, item) => sum + (item.percentage ?? 15), 0);

  const tags = [
    naturalShare >= 50 ? "breathable-natural-fiber" : null,
    stretchShare > 0 ? "has-stretch" : null,
    syntheticShare >= 50 ? "synthetic-heavy" : null,
    fibers.some((fiber) => SOFT_FIBERS.has(fiber)) ? "soft-handfeel" : null,
    product.careInstructions.some((step) => /dry clean/i.test(step)) ? "delicate-care" : null
  ].filter((tag): tag is string => Boolean(tag));

  return {
    productId: product.id,
    rawMaterialText,
    fibers,
    blendPercentages: percentages,
    normalizedBlend,
    fabricFeel: inferFabricFeel(fibers),
    stretchLevel: levelFromScore(stretchShare * 10),
    weight: /coat|denim|wool|jacket/i.test(`${product.category} ${product.description}`)
      ? "heavy"
      : /linen|silk|camisole|tee|tank/i.test(`${product.category} ${product.description}`)
        ? "light"
        : "midweight",
    opacity: levelFromScore(product.opacityScore),
    breathability: levelFromScore(product.breathabilityScore),
    performanceTags: tags,
    confidence: product.materialConfidence,
    confidenceLabel: product.materialConfidenceLabel,
    explanation:
      normalizedBlend.length > 0
        ? `Material read is based on ${normalizedBlend.map((item) => `${item.percentage ?? "unknown"}% ${item.fiber}`).join(", ")}.`
        : "Material read is low confidence because the product has no parseable fiber data."
  };
}

export function extractMaterialsFromText(productId: string, rawMaterialText: string): MaterialProfile {
  const normalizedBlend = normalizeMaterialBlend(rawMaterialText);
  const fibers = normalizedBlend.map((item) => item.fiber);
  const blendPercentages = blendToPercentages(normalizedBlend);
  const confidence = normalizedBlend.length === 0 ? 0.15 : normalizedBlend.some((item) => item.percentage) ? 0.85 : 0.55;
  const confidenceLabel = getMaterialConfidenceLabel(
    /\d{1,3}(?:\.\d+)?\s*%/.test(rawMaterialText) ? [rawMaterialText] : [],
    normalizedBlend.length > 0 ? [rawMaterialText] : []
  );

  return {
    productId,
    rawMaterialText,
    fibers,
    blendPercentages,
    normalizedBlend,
    fabricFeel: inferFabricFeel(fibers),
    stretchLevel: fibers.some((fiber) => STRETCH_FIBERS.has(fiber)) ? "high" : "unknown",
    weight: "unknown",
    opacity: "unknown",
    breathability: fibers.some((fiber) => BREATHABLE_FIBERS.has(fiber)) ? "high" : "unknown",
    performanceTags: fibers.some((fiber) => SOFT_FIBERS.has(fiber)) ? ["soft-handfeel"] : [],
    confidence,
    confidenceLabel,
    explanation: "Parsed from raw material text. Product-level attributes can improve this profile later."
  };
}
