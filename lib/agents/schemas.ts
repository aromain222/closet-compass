import { z } from "zod";

const MaterialBlendItemSchema = z.object({
  fiber: z.string(),
  percentage: z.number().min(0).max(100).nullable()
});

const UuidSchema = z.string().uuid();

export const MaterialConfidenceLabelSchema = z.enum(["high", "medium", "low"]);
export const DupeRecommendationLabelSchema = z.enum([
  "strong_dupe",
  "worth_the_splurge",
  "avoid",
  "consider"
]);

export const ProductResultSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  brand: z.string().min(1),
  retailer: z.string().min(1),
  price: z.number().nonnegative(),
  originalPrice: z.number().nonnegative().optional(),
  currency: z.string().min(3),
  productUrl: z.string().url(),
  imageUrl: z.string().url(),
  category: z.string().min(1),
  colors: z.array(z.string()),
  sizes: z.array(z.string()),
  description: z.string(),
  listedMaterials: z.array(z.string()),
  inferredMaterials: z.array(z.string()),
  normalizedMaterials: z.array(MaterialBlendItemSchema),
  materialConfidence: z.number().min(0).max(1),
  materialConfidenceLabel: MaterialConfidenceLabelSchema,
  softnessScore: z.number().min(0).max(100),
  stretchScore: z.number().min(0).max(100),
  breathabilityScore: z.number().min(0).max(100),
  opacityScore: z.number().min(0).max(100),
  durabilityScore: z.number().min(0).max(100),
  careInstructions: z.array(z.string()),
  reviewSummary: z.string().optional(),
  source: z.enum(["mock", "serpapi", "searchapi", "serper", "retailer", "amazon", "manual"]),
  createdAt: z.string()
});

export const MaterialProfileSchema = z.object({
  productId: z.string().min(1),
  rawMaterialText: z.string(),
  fibers: z.array(z.string()),
  blendPercentages: z.record(z.number().min(0).max(100)),
  normalizedBlend: z.array(MaterialBlendItemSchema),
  fabricFeel: z.string(),
  stretchLevel: z.enum(["low", "medium", "high", "unknown"]),
  weight: z.enum(["light", "midweight", "heavy", "unknown"]),
  opacity: z.enum(["low", "medium", "high", "unknown"]),
  breathability: z.enum(["low", "medium", "high", "unknown"]),
  performanceTags: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  confidenceLabel: MaterialConfidenceLabelSchema,
  explanation: z.string()
});

export const DupeScoreBreakdownSchema = z.object({
  visualSimilarity: z.number().min(0).max(100),
  materialSimilarity: z.number().min(0).max(100),
  fitSimilarity: z.number().min(0).max(100),
  priceSavings: z.number().min(0).max(100),
  brandReviewQuality: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  finalDupeScore: z.number().min(0).max(100),
  recommendation: DupeRecommendationLabelSchema,
  explanation: z.string().min(1),
  materialExplanation: z.string().min(1),
  risks: z.array(z.string())
});

export const DupeComparisonSchema = z.object({
  sourceProduct: ProductResultSchema,
  alternativeProduct: ProductResultSchema,
  score: DupeScoreBreakdownSchema,
  createdAt: z.string()
});

export const SearchRequestSchema = z.object({
  query: z.string().trim().min(1).max(240),
  maxPrice: z.number().positive().optional(),
  preferredMaterials: z.array(z.string().trim().min(1)).optional(),
  avoidMaterials: z.array(z.string().trim().min(1)).optional(),
  occasion: z.string().trim().max(120).optional(),
  stylePreferences: z.array(z.string().trim().min(1)).optional(),
  sizePreferences: z.record(z.string()).optional()
});

export const ImageSearchRequestSchema = z
  .object({
    imageUrl: z.string().url().optional(),
    imageBase64: z.string().min(32).optional(),
    query: z.string().trim().max(240).optional(),
    maxPrice: z.number().positive().optional(),
    preferredMaterials: z.array(z.string().trim().min(1)).optional(),
    avoidMaterials: z.array(z.string().trim().min(1)).optional()
  })
  .refine((value) => value.imageUrl || value.imageBase64, {
    message: "Provide imageUrl or imageBase64."
  });

export const DupeRequestSchema = z
  .object({
    productId: z.string().min(1).optional(),
    sourceProduct: ProductResultSchema.optional(),
    maxPrice: z.number().positive().optional(),
    preferredMaterials: z.array(z.string().trim().min(1)).optional(),
    avoidMaterials: z.array(z.string().trim().min(1)).optional(),
    limit: z.number().int().min(1).max(20).default(8),
  })
  .refine((value) => value.productId || value.sourceProduct, {
    message: "Provide productId or sourceProduct."
  });

export const SaveProductRequestSchema = z.object({
  userId: z.string().uuid(),
  product: ProductResultSchema,
  notes: z.string().max(1000).optional()
});

export const TrackProductRequestSchema = z.object({
  userId: z.string().uuid(),
  product: ProductResultSchema,
  targetPrice: z.number().positive().optional(),
  notifyOnDrop: z.boolean().default(true)
});

export const WishlistCreateSchema = z.object({
  userId: z.string().uuid(),
  product: ProductResultSchema,
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  targetPrice: z.number().positive().optional()
});

export const WishlistDeleteSchema = z
  .object({
    userId: z.string().uuid(),
    wishlistItemId: z.string().uuid().optional(),
    productId: z.string().min(1).optional()
  })
  .refine((value) => value.wishlistItemId || value.productId, {
    message: "Provide wishlistItemId or productId."
  });

export const PlaidUserSchema = z.object({
  userId: z.string().uuid(),
  redirectUri: z.string().url().optional()
});

export const PlaidExchangeSchema = z.object({
  userId: z.string().uuid(),
  publicToken: z.string().min(8)
});

export const PlaidTransactionsSchema = z.object({
  userId: z.string().uuid(),
  itemId: z.string().min(1).optional(),
  cursor: z.string().optional(),
  count: z.number().int().min(1).max(500).default(100),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional()
});

export const SpendingSummarySchema = z.object({
  userId: UuidSchema,
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  budgetLimit: z.number().nonnegative().optional(),
  periodStart: z.string().date().optional(),
  periodEnd: z.string().date().optional()
});

export const BudgetRecommendationRequestSchema = z.object({
  userId: UuidSchema,
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  budgetLimit: z.number().nonnegative().optional(),
  maxRecommendations: z.number().int().min(1).max(20).default(5)
});

export const PriceTrackingQuerySchema = z.object({
  userId: UuidSchema.optional(),
  productId: z.string().min(1)
});

export const SavedProductsQuerySchema = z.object({
  userId: UuidSchema
});

export const StripeCheckoutSchema = z.object({
  userId: z.string().uuid().optional(),
  customerEmail: z.string().email().optional(),
  priceId: z.string().min(1).optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional()
});

export type SearchRequest = z.infer<typeof SearchRequestSchema>;
