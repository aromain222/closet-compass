import type { MaterialBlendItem, ProductResult } from "@/lib/products/types";

const QUALITY_WEIGHTS: Record<string, number> = {
  cashmere: 1,
  alpaca: 0.88,
  silk: 0.95,
  linen: 0.9,
  ramie: 0.84,
  "organic cotton": 0.86,
  cotton: 0.8,
  wool: 0.82,
  lyocell: 0.78,
  modal: 0.76,
  cupro: 0.74,
  viscose: 0.62,
  rayon: 0.58,
  acetate: 0.52,
  "recycled polyester": 0.5,
  nylon: 0.46,
  polyester: 0.42,
  acrylic: 0.28,
  elastane: 0.5,
  spandex: 0.5
};

export interface MaterialSimilarityResult {
  score: number;
  explanation: string;
  sharedFibers: string[];
  sourceOnlyFibers: string[];
  candidateOnlyFibers: string[];
  attributeDeltas: {
    softness: number;
    stretch: number;
    breathability: number;
    opacity: number;
    durability: number;
  };
}

function blendMap(blend: MaterialBlendItem[]): Map<string, number> {
  const evenShare = blend.length ? 100 / blend.length : 0;
  const raw = new Map(blend.map((item) => [item.fiber, item.percentage ?? evenShare]));
  const total = Array.from(raw.values()).reduce((sum, value) => sum + value, 0);

  if (total <= 100 || total === 0) {
    return raw;
  }

  // Garments often list body and lining separately. Scaling keeps similarity math in a 0-100 range.
  return new Map(Array.from(raw.entries()).map(([fiber, value]) => [fiber, (value / total) * 100]));
}

function blendLabel(blend: MaterialBlendItem[]): string {
  if (blend.length === 0) return "unknown materials";
  return blend.map((item) => `${item.percentage ?? "unknown"}% ${item.fiber}`).join(", ");
}

export function generateMaterialExplanation(
  source: ProductResult,
  candidate: ProductResult,
  result?: MaterialSimilarityResult
): string {
  const shared = result?.sharedFibers ?? source.normalizedMaterials
    .map((item) => item.fiber)
    .filter((fiber) => candidate.normalizedMaterials.some((candidateItem) => candidateItem.fiber === fiber));

  const confidenceNote =
    candidate.materialConfidenceLabel === "high"
      ? "The candidate composition is explicitly listed."
      : candidate.materialConfidenceLabel === "medium"
        ? "The candidate material read is inferred from product copy."
        : "The candidate material read is low confidence and mostly style-based.";

  const sharedText = shared.length > 0 ? `Shared fibers include ${shared.join(", ")}.` : "There is little direct fiber overlap.";
  return `${sharedText} Source blend: ${blendLabel(source.normalizedMaterials)}. Candidate blend: ${blendLabel(candidate.normalizedMaterials)}. ${confidenceNote}`;
}

export function scoreMaterialSimilarity(source: ProductResult, candidate: ProductResult): MaterialSimilarityResult {
  const sourceBlend = blendMap(source.normalizedMaterials);
  const candidateBlend = blendMap(candidate.normalizedMaterials);
  const fibers = new Set([...sourceBlend.keys(), ...candidateBlend.keys()]);

  if (fibers.size === 0) {
    return {
      score: 25,
      explanation: "Neither product exposes enough material data for a reliable fiber comparison.",
      sharedFibers: [],
      sourceOnlyFibers: [],
      candidateOnlyFibers: [],
      attributeDeltas: {
        softness: Math.abs(source.softnessScore - candidate.softnessScore),
        stretch: Math.abs(source.stretchScore - candidate.stretchScore),
        breathability: Math.abs(source.breathabilityScore - candidate.breathabilityScore),
        opacity: Math.abs(source.opacityScore - candidate.opacityScore),
        durability: Math.abs(source.durabilityScore - candidate.durabilityScore)
      }
    };
  }

  let distance = 0;
  for (const fiber of fibers) {
    distance += Math.abs((sourceBlend.get(fiber) ?? 0) - (candidateBlend.get(fiber) ?? 0));
  }

  const fiberOverlap = [...sourceBlend.keys()].filter((fiber) => candidateBlend.has(fiber));
  const sourceOnlyFibers = [...sourceBlend.keys()].filter((fiber) => !candidateBlend.has(fiber));
  const candidateOnlyFibers = [...candidateBlend.keys()].filter((fiber) => !sourceBlend.has(fiber));
  const similarity = Math.max(0, 100 - distance / 2);
  const attributeDeltas = {
    softness: Math.abs(source.softnessScore - candidate.softnessScore),
    stretch: Math.abs(source.stretchScore - candidate.stretchScore),
    breathability: Math.abs(source.breathabilityScore - candidate.breathabilityScore),
    opacity: Math.abs(source.opacityScore - candidate.opacityScore),
    durability: Math.abs(source.durabilityScore - candidate.durabilityScore)
  };
  const attributeAlignment =
    100 -
    (attributeDeltas.softness +
      attributeDeltas.stretch +
      attributeDeltas.breathability +
      attributeDeltas.opacity +
      attributeDeltas.durability) /
      5;

  const confidenceMultiplier =
    candidate.materialConfidenceLabel === "high" ? 1 : candidate.materialConfidenceLabel === "medium" ? 0.92 : 0.75;
  const score = Math.round(Math.max(0, Math.min(100, (similarity * 0.75 + attributeAlignment * 0.25) * confidenceMultiplier)));
  const result: MaterialSimilarityResult = {
    score,
    sharedFibers: fiberOverlap,
    sourceOnlyFibers,
    candidateOnlyFibers,
    attributeDeltas,
    explanation: ""
  };

  return {
    ...result,
    explanation: generateMaterialExplanation(source, candidate, result)
  };
}

export function scoreMaterialQuality(product: ProductResult): number {
  if (product.normalizedMaterials.length === 0) return 35;
  const evenShare = 100 / product.normalizedMaterials.length;
  const weighted = product.normalizedMaterials.reduce((sum, item) => {
    const quality = QUALITY_WEIGHTS[item.fiber] ?? 0.45;
    return sum + quality * (item.percentage ?? evenShare);
  }, 0);
  return Math.round(Math.min(100, weighted));
}
