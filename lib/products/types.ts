export type CurrencyCode = "USD" | "EUR" | "GBP" | string;

export type MaterialAttributeLevel = "low" | "medium" | "high" | "unknown";
export type MaterialConfidenceLabel = "high" | "medium" | "low";
export type DupeRecommendationLabel =
  | "strong_dupe"
  | "worth_the_splurge"
  | "avoid"
  | "consider";

export type NormalizedFiber =
  | "cotton"
  | "organic cotton"
  | "linen"
  | "silk"
  | "wool"
  | "cashmere"
  | "modal"
  | "lyocell"
  | "viscose"
  | "rayon"
  | "polyester"
  | "recycled polyester"
  | "nylon"
  | "elastane"
  | "spandex"
  | "acrylic"
  | "leather"
  | "suede"
  | "unknown"
  | string;

export interface MaterialBlendItem {
  fiber: NormalizedFiber;
  percentage: number | null;
}

export interface MaterialProfile {
  productId: string;
  rawMaterialText: string;
  fibers: NormalizedFiber[];
  blendPercentages: Record<string, number>;
  normalizedBlend: MaterialBlendItem[];
  fabricFeel: string;
  stretchLevel: MaterialAttributeLevel;
  weight: "light" | "midweight" | "heavy" | "unknown";
  opacity: MaterialAttributeLevel;
  breathability: MaterialAttributeLevel;
  performanceTags: string[];
  confidence: number;
  confidenceLabel: MaterialConfidenceLabel;
  explanation: string;
}

export interface ProductResult {
  id: string;
  title: string;
  brand: string;
  retailer: string;
  price: number;
  originalPrice?: number;
  currency: CurrencyCode;
  productUrl: string;
  imageUrl: string;
  category: string;
  colors: string[];
  sizes: string[];
  description: string;
  listedMaterials: string[];
  inferredMaterials: string[];
  normalizedMaterials: MaterialBlendItem[];
  materialConfidence: number;
  materialConfidenceLabel: MaterialConfidenceLabel;
  softnessScore: number;
  stretchScore: number;
  breathabilityScore: number;
  opacityScore: number;
  durabilityScore: number;
  careInstructions: string[];
  reviewSummary?: string;
  source: "mock" | "serpapi" | "searchapi" | "retailer" | "amazon" | "manual";
  createdAt: string;
}

export interface ProductSearchInput {
  query: string;
  maxPrice?: number;
  preferredMaterials?: string[];
  avoidMaterials?: string[];
  occasion?: string;
  stylePreferences?: string[];
  sizePreferences?: Record<string, string>;
}

export interface ProductSearchResponse {
  query: string;
  products: ProductResult[];
  agentSummary: string;
  materialNotes: string[];
  filtersApplied: Record<string, unknown>;
}

export interface DupeScoreBreakdown {
  visualSimilarity: number;
  materialSimilarity: number;
  fitSimilarity: number;
  priceSavings: number;
  brandReviewQuality: number;
  confidence: number;
  finalDupeScore: number;
  recommendation: DupeRecommendationLabel;
  explanation: string;
  materialExplanation: string;
  risks: string[];
}

export interface DupeComparison {
  sourceProduct: ProductResult;
  alternativeProduct: ProductResult;
  score: DupeScoreBreakdown;
  createdAt: string;
}

export interface SavedProduct {
  id: string;
  userId: string;
  product: ProductResult;
  notes?: string;
  createdAt: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  product: ProductResult;
  priority?: "low" | "medium" | "high";
  targetPrice?: number;
  createdAt: string;
}

export interface PriceHistoryPoint {
  id: string;
  productId: string;
  retailer: string;
  price: number;
  currency: CurrencyCode;
  observedAt: string;
}

export type BudgetStatus = "under_budget" | "near_limit" | "over_budget";

export interface SpendingSummary {
  month: string;
  shoppingSpend: number;
  budgetLimit: number;
  budgetRemaining: number;
  topMerchants: Array<{ merchantName: string; spend: number; transactionCount: number }>;
  categoryBreakdown: Array<{ category: string; spend: number; transactionCount: number }>;
  summaryText: string;
  budgetStatus: BudgetStatus;
}

export interface BudgetShoppingRecommendation {
  productId: string;
  title: string;
  brand: string;
  retailer: string;
  price: number;
  targetPrice?: number;
  recommendation: "buy_now" | "wait_for_drop" | "skip_for_budget" | "review_materials";
  reason: string;
  materialScore: number;
  budgetStatus: BudgetStatus;
}

export interface ImageSearchAnalysis {
  mode: "mock";
  inferredQuery: string;
  visualSignals: {
    category?: string;
    colors: string[];
    silhouette?: string;
    materialHints: string[];
  };
  confidence: "low" | "medium";
  note: string;
}
