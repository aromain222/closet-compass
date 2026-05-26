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

// Higher = less tarnish. Scans title + description for material signals.
function scoreJewelryTarnishResistance(product: ProductResult): number {
  const text = `${product.title} ${product.description}`.toLowerCase();
  if (/\b(solid\s*gold|14k|18k|24k|platinum|palladium)\b/.test(text)) return 95;
  if (/\btitanium\b/.test(text)) return 90;
  if (/\bstainless\s*steel\b/.test(text)) return 85;
  if (/\b(sterling|925|solid\s*silver)\b/.test(text)) return 70;
  if (/\bgold[- ]?filled\b/.test(text)) return 65;
  if (/\b(gold[- ]?plat|vermeil)\b/.test(text)) return 45;
  if (/\b(silver[- ]?plat)\b/.test(text)) return 38;
  if (/\b(brass|copper|alloy|zinc)\b/.test(text)) return 25;
  return 50; // unknown — neutral
}

function scoreBrandReviewQuality(candidate: ProductResult): number {
  return Math.round(scoreMaterialQuality(candidate) * 0.6 + (candidate.reviewSummary ? 82 : 55) * 0.4);
}

function parseFragranceIntelligence(candidate: ProductResult): {
  fidelity?: number;
  persistenceHours?: number;
  projection?: number;
  scentRating?: number;
  longevityRating?: number;
  sillageRating?: number;
  middleEasternSheetMatch?: boolean;
} {
  const summary = candidate.reviewSummary ?? "";
  const fidelity = summary.match(/(\d+(?:\.\d+)?)%\s+fidelity/i)?.[1];
  const persistenceHours = summary.match(/(\d+(?:\.\d+)?)h\s+persistence/i)?.[1];
  const projection = summary.match(/projection\s+(\d+(?:\.\d+)?)\/10/i)?.[1];
  const scentRating = summary.match(/scent rating\s+(\d+(?:\.\d+)?)\/10/i)?.[1];
  const longevityRating = summary.match(/longevity\s+(\d+(?:\.\d+)?)\/10/i)?.[1];
  const sillageRating = summary.match(/sillage\s+(\d+(?:\.\d+)?)\/10/i)?.[1];

  return {
    fidelity: fidelity ? Number(fidelity) : undefined,
    persistenceHours: persistenceHours ? Number(persistenceHours) : undefined,
    projection: projection ? Number(projection) : undefined,
    scentRating: scentRating ? Number(scentRating) : undefined,
    longevityRating: longevityRating ? Number(longevityRating) : undefined,
    sillageRating: sillageRating ? Number(sillageRating) : undefined,
    middleEasternSheetMatch: /ME brand sheet match to/i.test(summary),
  };
}

function scoreFragranceQuality(candidate: ProductResult): number {
  const signals = parseFragranceIntelligence(candidate);

  if (signals.scentRating) {
    const scentScore = Math.round(signals.scentRating * 10);
    const longevityScore = signals.longevityRating ? Math.round(signals.longevityRating * 10) : 60;
    const sillageScore = signals.sillageRating ? Math.round(signals.sillageRating * 10) : 60;
    return Math.min(100, Math.round(scentScore * 0.5 + longevityScore * 0.3 + sillageScore * 0.2));
  }

  if (signals.middleEasternSheetMatch) return 78;

  if (!signals.fidelity) return scoreBrandReviewQuality(candidate);

  const persistenceScore = signals.persistenceHours
    ? Math.min(100, Math.round(signals.persistenceHours * 10))
    : 60;
  const projectionScore = signals.projection
    ? Math.min(100, Math.round(signals.projection * 10))
    : 60;

  return Math.round(signals.fidelity * 0.55 + persistenceScore * 0.3 + projectionScore * 0.15);
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
    if (input.materialSimilarity >= 90 && input.priceSavings >= 35 && input.candidateReviewQuality >= 80) {
      return "strong_dupe";
    }
    if (input.materialSimilarity > 0 && input.materialSimilarity < 78) return "avoid";
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
    const signals = parseFragranceIntelligence(alternativeProduct);
    if (signals.fidelity) {
      const persistence = signals.persistenceHours ? `${signals.persistenceHours}h persistence` : "unverified longevity";
      const projection = signals.projection ? `${signals.projection}/10 projection` : "unverified projection";
      const label =
        recommendation === "strong_dupe"
          ? "a strong fragrance dupe"
          : recommendation === "avoid"
            ? "a weak fragrance dupe despite the lower price"
            : "a fragrance alternative to consider";

      return `${alternativeProduct.title} is ${label} for ${sourceProduct.title}: curated intelligence lists ${signals.fidelity}% fidelity, ${persistence}, and ${projection}, while saving ${input.priceSavings}%.`;
    }

    if (signals.scentRating) {
      const longevity = signals.longevityRating ? `${signals.longevityRating}/10 longevity` : "unverified longevity";
      const sillage = signals.sillageRating ? `${signals.sillageRating}/10 sillage` : "unverified sillage";
      return `${alternativeProduct.title} is a Shobi catalog inspiration for ${sourceProduct.title}: the catalog lists ${signals.scentRating}/10 scent quality, ${longevity}, and ${sillage}, while saving ${input.priceSavings}%.`;
    }

    if (signals.middleEasternSheetMatch) {
      return `${alternativeProduct.title} is a Middle Eastern fragrance dupe from the shared sheet for ${sourceProduct.title}, saving ${input.priceSavings}%. ${alternativeProduct.reviewSummary ?? ""}`.trim();
    }

    const review = alternativeProduct.reviewSummary ? ` ${alternativeProduct.reviewSummary}.` : "";
    return `${alternativeProduct.title} is an affordable fragrance alternative that saves ${input.priceSavings}% vs. ${sourceProduct.title}.${review}`;
  }

  if (category === "jewelry") {
    const review = alternativeProduct.reviewSummary ? ` Reviews: ${alternativeProduct.reviewSummary}.` : "";
    return `Similar style, ${input.priceSavings}% cheaper. ${input.materialExplanation}${review}`;
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
  jewelry:  [0.35,    0.30,   0.00, 0.28, 0.05, 0.02], // material = tarnish resistance
  bag:      [0.25,    0.30,   0.05, 0.30, 0.05, 0.05],
  fragrance:[0.55,    0.00,   0.00, 0.25, 0.15, 0.05],
};

export function calculateDupeScore(
  sourceProduct: ProductResult,
  alternativeProduct: ProductResult,
  category: DupeCategory = "clothing"
): DupeScoreBreakdown {
  const material = scoreMaterialSimilarity(sourceProduct, alternativeProduct);
  const fragranceSignals = category === "fragrance"
    ? parseFragranceIntelligence(alternativeProduct)
    : {};
  const tarnishScore = category === "jewelry" ? scoreJewelryTarnishResistance(alternativeProduct) : 0;
  const materialSimilarity = category === "jewelry"
    ? tarnishScore
    : category === "fragrance" && fragranceSignals.fidelity
    ? fragranceSignals.fidelity
    : category === "fragrance" && fragranceSignals.scentRating
      ? Math.min(88, Math.round(fragranceSignals.scentRating * 10))
    : category === "fragrance" && fragranceSignals.middleEasternSheetMatch
      ? 82
    : material.score;
  const materialExplanation = category === "jewelry"
    ? tarnishScore >= 80
      ? "Tarnish resistance: high — stainless steel, titanium, or solid gold construction."
      : tarnishScore >= 60
        ? "Tarnish resistance: moderate — sterling silver or gold-filled."
        : tarnishScore >= 40
          ? "Tarnish resistance: low — plated metal that may tarnish over time."
          : "Tarnish resistance: poor — brass, copper, or alloy base."
    : category === "fragrance" && fragranceSignals.fidelity
    ? `Fragrance match is based on curated scent fidelity: ${fragranceSignals.fidelity}% similarity, ${fragranceSignals.persistenceHours ?? "unknown"}h persistence, and ${fragranceSignals.projection ?? "unknown"}/10 projection.`
    : category === "fragrance" && fragranceSignals.scentRating
      ? `Fragrance match is based on Shobi inspiration catalog ratings: ${fragranceSignals.scentRating}/10 scent quality, ${fragranceSignals.longevityRating ?? "unknown"}/10 longevity, and ${fragranceSignals.sillageRating ?? "unknown"}/10 sillage.`
    : category === "fragrance" && fragranceSignals.middleEasternSheetMatch
      ? "Fragrance match is based on a shared sheet listing this Middle Eastern brand fragrance as a dupe for the source scent."
    : material.explanation;
  const visualSimilarity = scoreVisualPlaceholder(sourceProduct, alternativeProduct);
  const fitSimilarity = scoreFitSimilarity(sourceProduct, alternativeProduct);
  const priceSavings = scorePriceSavings(sourceProduct, alternativeProduct);
  const brandReviewQuality = category === "fragrance"
    ? scoreFragranceQuality(alternativeProduct)
    : scoreBrandReviewQuality(alternativeProduct);
  const sourceMaterialQuality = scoreMaterialQuality(sourceProduct);
  const candidateMaterialQuality = scoreMaterialQuality(alternativeProduct);
  const confidence = category === "fragrance" && fragranceSignals.fidelity
    ? Math.min(100, Math.round(50 + fragranceSignals.fidelity * 0.5))
    : category === "fragrance" && fragranceSignals.scentRating
      ? Math.min(88, Math.round(45 + fragranceSignals.scentRating * 5))
    : category === "fragrance" && fragranceSignals.middleEasternSheetMatch
      ? 78
    : Math.round(((sourceProduct.materialConfidence + alternativeProduct.materialConfidence) / 2) * 100);
  const recommendation = generateDupeLabel({
    visualSimilarity,
    materialSimilarity,
    priceSavings,
    sourceMaterialQuality,
    candidateMaterialQuality,
    candidateDurability: alternativeProduct.durabilityScore,
    sourceDurability: sourceProduct.durabilityScore,
    candidateReviewQuality: brandReviewQuality,
    candidateMaterialConfidenceLabel: alternativeProduct.materialConfidenceLabel,
    category,
  });
  const risks = buildRisks(sourceProduct, alternativeProduct, materialSimilarity, category);

  const [wMat, wVis, wFit, wPrice, wReview, wConf] = CATEGORY_WEIGHTS[category];
  const finalDupeScore = Math.round(
    materialSimilarity * wMat +
      visualSimilarity * wVis +
      fitSimilarity * wFit +
      priceSavings * wPrice +
      brandReviewQuality * wReview +
      confidence * wConf
  );
  const explanation = generateDupeExplanation({
    sourceProduct,
    alternativeProduct,
    materialSimilarity,
    fitSimilarity,
    priceSavings,
    recommendation,
    materialExplanation,
    risks,
    category,
  });

  return {
    visualSimilarity,
    materialSimilarity,
    fitSimilarity,
    priceSavings,
    brandReviewQuality,
    confidence,
    finalDupeScore,
    recommendation,
    materialExplanation,
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
