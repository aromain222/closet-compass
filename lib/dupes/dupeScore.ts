import type {
  DupeComparison,
  DupeRecommendationLabel,
  DupeScoreBreakdown,
  ProductResult
} from "@/lib/products/types";
import { scoreMaterialQuality, scoreMaterialSimilarity } from "@/lib/materials/materialScore";
import type { DupeCategory } from "./categoryDetect";

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
  category?: DupeCategory;
}): DupeRecommendationLabel {
  const category = input.category ?? "clothing";

  if (category === "fragrance") {
    if (input.priceSavings >= 40) return "strong_dupe";
    if (input.priceSavings >= 20) return "consider";
    return "consider";
  }

  if (category === "jewelry") {
    if (input.priceSavings >= 35 && input.visualSimilarity >= 40) return "strong_dupe";
    if (input.priceSavings >= 15) return "consider";
    return "consider";
  }

  if (category === "bag") {
    const materialQualityGap = input.sourceMaterialQuality - input.candidateMaterialQuality;
    if (materialQualityGap >= 20) return "worth_the_splurge";
    if (input.priceSavings >= 30 && input.visualSimilarity >= 40) return "strong_dupe";
    if (input.priceSavings >= 15) return "consider";
    return "consider";
  }

  // clothing: material-weighted logic
  const materialQualityGap = input.sourceMaterialQuality - input.candidateMaterialQuality;
  const durabilityGap = input.sourceDurability - input.candidateDurability;
  const hasMaterialData = input.materialSimilarity > 0 || input.sourceMaterialQuality > 0;

  if (hasMaterialData) {
    if (materialQualityGap >= 18 || durabilityGap >= 18) return "worth_the_splurge";
    if (input.materialSimilarity < 50 && materialQualityGap >= 14) return "avoid";
    if (input.materialSimilarity >= 78 && input.priceSavings >= 25 && input.candidateReviewQuality >= 65) return "strong_dupe";
  }

  if (input.priceSavings >= 40 && input.visualSimilarity >= 50) return "strong_dupe";
  if (input.priceSavings >= 20) return "consider";
  return "consider";
}

function buildRisks(source: ProductResult, candidate: ProductResult, materialSimilarity: number, category?: DupeCategory): string[] {
  if (category === "fragrance" || category === "jewelry") return [];

  const all = [
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
    category !== "bag" && candidate.materialConfidenceLabel !== "high"
      ? `Confidence risk: candidate material confidence is ${candidate.materialConfidenceLabel}.`
      : null,
  ].filter((risk): risk is string => Boolean(risk));

  // For bags, only durability and material risks are relevant
  if (category === "bag") {
    return all.filter((r) => r.startsWith("Durability") || r.startsWith("Material"));
  }
  return all;
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
  category?: DupeCategory;
}): string {
  const { sourceProduct, alternativeProduct, recommendation } = input;
  const category = input.category ?? "clothing";

  if (category === "fragrance") {
    const review = alternativeProduct.reviewSummary ? ` ${alternativeProduct.reviewSummary}.` : "";
    return `${alternativeProduct.title} is an affordable fragrance alternative that saves ${input.priceSavings}% vs. ${sourceProduct.title}.${review}`;
  }

  if (category === "jewelry") {
    const review = alternativeProduct.reviewSummary ? ` Reviews: ${alternativeProduct.reviewSummary}.` : "";
    return `Similar style, ${input.priceSavings}% cheaper — sourced from ${alternativeProduct.retailer}.${review}`;
  }

  const intro =
    recommendation === "strong_dupe"
      ? "This is a strong dupe"
      : recommendation === "worth_the_splurge"
        ? "The original may be worth the splurge"
        : recommendation === "avoid"
          ? "Avoid treating this as a true dupe"
          : "This is a conditional dupe";

  if (category === "bag") {
    const review = alternativeProduct.reviewSummary ? `Reviews: ${alternativeProduct.reviewSummary}` : "";
    const riskText = input.risks.length > 0 ? `Main risk: ${input.risks[0]}` : "No major material penalties identified.";
    return `${intro} for ${sourceProduct.title}: ${alternativeProduct.title} saves ${input.priceSavings}%. ${input.materialExplanation} ${review} ${riskText}`.trim();
  }

  const reviewText = alternativeProduct.reviewSummary
    ? `Reviews: ${alternativeProduct.reviewSummary}`
    : "Reviews are not available yet, so quality confidence is lower.";
  const riskText =
    input.risks.length > 0
      ? `Main risk: ${input.risks[0]}`
      : "No major material penalties identified.";

  return `${intro} for ${sourceProduct.title}: ${alternativeProduct.title} saves ${input.priceSavings}% and has a ${input.materialSimilarity}/100 material match. ${input.materialExplanation} Fit similarity is ${input.fitSimilarity}/100 based on category and size overlap. ${reviewText} ${riskText}`;
}

const CATEGORY_WEIGHTS: Record<DupeCategory, [number, number, number, number, number, number]> = {
  //                    material  visual  fit   price review confidence
  clothing: [0.55,    0.10,   0.10, 0.15, 0.05, 0.05],
  jewelry:  [0.00,    0.55,   0.00, 0.35, 0.05, 0.05],
  bag:      [0.25,    0.30,   0.05, 0.30, 0.05, 0.05],
  fragrance:[0.00,    0.00,   0.00, 0.65, 0.25, 0.10],
};

export function calculateDupeScore(
  sourceProduct: ProductResult,
  alternativeProduct: ProductResult,
  category: DupeCategory = "clothing"
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
    candidateMaterialConfidenceLabel: alternativeProduct.materialConfidenceLabel,
    category,
  });
  const risks = buildRisks(sourceProduct, alternativeProduct, material.score, category);

  const [wMat, wVis, wFit, wPrice, wReview, wConf] = CATEGORY_WEIGHTS[category];
  const finalDupeScore = Math.round(
    material.score * wMat +
      visualSimilarity * wVis +
      fitSimilarity * wFit +
      priceSavings * wPrice +
      brandReviewQuality * wReview +
      confidence * wConf
  );
  const explanation = generateDupeExplanation({
    sourceProduct,
    alternativeProduct,
    materialSimilarity: material.score,
    fitSimilarity,
    priceSavings,
    recommendation,
    materialExplanation: material.explanation,
    risks,
    category,
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
  alternativeProduct: ProductResult,
  category: DupeCategory = "clothing"
): DupeComparison {
  return {
    sourceProduct,
    alternativeProduct,
    score: calculateDupeScore(sourceProduct, alternativeProduct, category),
    createdAt: new Date().toISOString()
  };
}
