import type {
  DupeComparison,
  DupeRecommendationLabel,
  DupeScoreBreakdown,
  ProductResult
} from "@/lib/products/types";
import { scoreMaterialQuality, scoreMaterialSimilarity } from "@/lib/materials/materialScore";

function scoreVisualPlaceholder(source: ProductResult, candidate: ProductResult): number {
  const categoryMatch = source.category === candidate.category ? 45 : 20;
  const colorOverlap = source.colors.some((color) => candidate.colors.includes(color)) ? 25 : 8;
  const titleSimilarity = source.title
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => candidate.title.toLowerCase().includes(word) && word.length > 3).length;

  return Math.min(100, categoryMatch + colorOverlap + titleSimilarity * 7);
}

function scoreFitSimilarity(source: ProductResult, candidate: ProductResult): number {
  const sizeOverlap = source.sizes.filter((size) => candidate.sizes.includes(size)).length;
  const categoryScore = source.category === candidate.category ? 55 : 25;
  return Math.min(100, categoryScore + sizeOverlap * 8);
}

export function scorePriceSavings(source: ProductResult, candidate: ProductResult): number {
  if (source.price <= 0 || candidate.price >= source.price) return 0;
  return Math.round(Math.min(100, ((source.price - candidate.price) / source.price) * 100));
}

function scoreBrandReviewQuality(candidate: ProductResult): number {
  return Math.round(scoreMaterialQuality(candidate) * 0.6 + (candidate.reviewSummary ? 82 : 55) * 0.4);
}

function describeBlend(product: ProductResult): string {
  if (product.normalizedMaterials.length === 0) return "unknown material blend";
  return product.normalizedMaterials
    .map((item) => `${item.percentage ?? "unknown"}% ${item.fiber}`)
    .join(", ");
}

export function generateDupeLabel(input: {
  visualSimilarity: number;
  materialSimilarity: number;
  priceSavings: number;
  sourceMaterialQuality: number;
  candidateMaterialQuality: number;
  candidateDurability: number;
  sourceDurability: number;
  candidateReviewQuality: number;
  candidateMaterialConfidenceLabel: "high" | "medium" | "low";
}): DupeRecommendationLabel {
  const materialQualityGap = input.sourceMaterialQuality - input.candidateMaterialQuality;
  const durabilityGap = input.sourceDurability - input.candidateDurability;

  // Only hard-avoid when we have enough material data to know it's bad
  const hasMaterialData = input.materialSimilarity > 0 || input.sourceMaterialQuality > 0;

  if (hasMaterialData) {
    if (materialQualityGap >= 18 || durabilityGap >= 18) {
      return "worth_the_splurge";
    }
    if (input.materialSimilarity < 50 && materialQualityGap >= 14) {
      return "avoid";
    }
    if (input.materialSimilarity >= 78 && input.priceSavings >= 25 && input.candidateReviewQuality >= 65) {
      return "strong_dupe";
    }
  }

  // No material data — score on price savings and visual similarity
  if (input.priceSavings >= 40 && input.visualSimilarity >= 50) {
    return "strong_dupe";
  }
  if (input.priceSavings >= 20) {
    return "consider";
  }

  return "consider";
}

function buildRisks(source: ProductResult, candidate: ProductResult, materialSimilarity: number): string[] {
  return [
    candidate.opacityScore + 12 < source.opacityScore
      ? `Opacity risk: ${candidate.opacityScore}/100 versus ${source.opacityScore}/100 on the source item.`
      : null,
    candidate.breathabilityScore + 12 < source.breathabilityScore
      ? `Breathability risk: ${candidate.breathabilityScore}/100 versus ${source.breathabilityScore}/100.`
      : null,
    candidate.durabilityScore + 12 < source.durabilityScore
      ? `Durability risk: ${candidate.durabilityScore}/100 versus ${source.durabilityScore}/100.`
      : null,
    materialSimilarity < 60
      ? `Material risk: blend shifts from ${describeBlend(source)} to ${describeBlend(candidate)}.`
      : null,
    candidate.materialConfidenceLabel !== "high"
      ? `Confidence risk: candidate material confidence is ${candidate.materialConfidenceLabel}.`
      : null
  ].filter((risk): risk is string => Boolean(risk));
}

export function generateDupeExplanation(input: {
  sourceProduct: ProductResult;
  alternativeProduct: ProductResult;
  materialSimilarity: number;
  fitSimilarity: number;
  priceSavings: number;
  recommendation: DupeRecommendationLabel;
  materialExplanation: string;
  risks: string[];
}): string {
  const { sourceProduct, alternativeProduct, recommendation } = input;
  const intro =
    recommendation === "strong_dupe"
      ? "This is a strong dupe"
      : recommendation === "worth_the_splurge"
        ? "The original may be worth the splurge"
        : recommendation === "avoid"
          ? "Avoid treating this as a true dupe"
          : "This is a conditional dupe";

  const reviewText = alternativeProduct.reviewSummary
    ? `Reviews: ${alternativeProduct.reviewSummary}`
    : "Reviews are not available yet, so quality confidence is lower.";
  const riskText =
    input.risks.length > 0
      ? `Main risk: ${input.risks[0]}`
      : "No major material penalties identified.";

  return `${intro} for ${sourceProduct.title}: ${alternativeProduct.title} saves ${input.priceSavings}% and has a ${input.materialSimilarity}/100 material match. ${input.materialExplanation} Fit similarity is ${input.fitSimilarity}/100 based on category and size overlap. ${reviewText} ${riskText}`;
}

export function calculateDupeScore(
  sourceProduct: ProductResult,
  alternativeProduct: ProductResult
): DupeScoreBreakdown {
  const material = scoreMaterialSimilarity(sourceProduct, alternativeProduct);
  const visualSimilarity = scoreVisualPlaceholder(sourceProduct, alternativeProduct);
  const fitSimilarity = scoreFitSimilarity(sourceProduct, alternativeProduct);
  const priceSavings = scorePriceSavings(sourceProduct, alternativeProduct);
  const brandReviewQuality = scoreBrandReviewQuality(alternativeProduct);
  const sourceMaterialQuality = scoreMaterialQuality(sourceProduct);
  const candidateMaterialQuality = scoreMaterialQuality(alternativeProduct);
  const confidence = Math.round(
    ((sourceProduct.materialConfidence + alternativeProduct.materialConfidence) / 2) * 100
  );
  const recommendation = generateDupeLabel({
    visualSimilarity,
    materialSimilarity: material.score,
    priceSavings,
    sourceMaterialQuality,
    candidateMaterialQuality,
    candidateDurability: alternativeProduct.durabilityScore,
    sourceDurability: sourceProduct.durabilityScore,
    candidateReviewQuality: brandReviewQuality,
    candidateMaterialConfidenceLabel: alternativeProduct.materialConfidenceLabel
  });
  const risks = buildRisks(sourceProduct, alternativeProduct, material.score);

  const finalDupeScore = Math.round(
    material.score * 0.55 +
      visualSimilarity * 0.1 +
      fitSimilarity * 0.1 +
      priceSavings * 0.15 +
      brandReviewQuality * 0.05 +
      confidence * 0.05
  );
  const explanation = generateDupeExplanation({
    sourceProduct,
    alternativeProduct,
    materialSimilarity: material.score,
    fitSimilarity,
    priceSavings,
    recommendation,
    materialExplanation: material.explanation,
    risks
  });

  return {
    visualSimilarity,
    materialSimilarity: material.score,
    fitSimilarity,
    priceSavings,
    brandReviewQuality,
    confidence,
    finalDupeScore,
    recommendation,
    materialExplanation: material.explanation,
    explanation,
    risks
  };
}

export function createDupeComparison(
  sourceProduct: ProductResult,
  alternativeProduct: ProductResult
): DupeComparison {
  return {
    sourceProduct,
    alternativeProduct,
    score: calculateDupeScore(sourceProduct, alternativeProduct),
    createdAt: new Date().toISOString()
  };
}
