import { scoreMaterialQuality } from "@/lib/materials/materialScore";
import type {
  BudgetShoppingRecommendation,
  ProductResult,
  SpendingSummary
} from "@/lib/products/types";

export function generateBudgetShoppingRecommendations(input: {
  wishlistProducts: Array<{ product: ProductResult; targetPrice?: number | null }>;
  spendingSummary: SpendingSummary;
  maxRecommendations?: number;
}): BudgetShoppingRecommendation[] {
  return input.wishlistProducts
    .map(({ product, targetPrice }) => {
      const materialScore = scoreMaterialQuality(product);
      const canAfford = product.price <= input.spendingSummary.budgetRemaining;
      const targetMet = targetPrice ? product.price <= targetPrice : false;

      if (input.spendingSummary.budgetStatus === "over_budget") {
        return {
          productId: product.id,
          title: product.title,
          brand: product.brand,
          retailer: product.retailer,
          price: product.price,
          targetPrice: targetPrice ?? undefined,
          recommendation: "skip_for_budget" as const,
          reason: "You are over your shopping budget, so this should stay on the wishlist unless it replaces another planned purchase.",
          materialScore,
          budgetStatus: input.spendingSummary.budgetStatus
        };
      }

      if (targetPrice && !targetMet) {
        return {
          productId: product.id,
          title: product.title,
          brand: product.brand,
          retailer: product.retailer,
          price: product.price,
          targetPrice,
          recommendation: "wait_for_drop" as const,
          reason: `Current price is above your $${targetPrice.toFixed(2)} target. Keep tracking for a better entry point.`,
          materialScore,
          budgetStatus: input.spendingSummary.budgetStatus
        };
      }

      if (canAfford && materialScore >= 72) {
        return {
          productId: product.id,
          title: product.title,
          brand: product.brand,
          retailer: product.retailer,
          price: product.price,
          targetPrice: targetPrice ?? undefined,
          recommendation: "buy_now" as const,
          reason: "This fits the remaining budget and has a strong material profile for the price.",
          materialScore,
          budgetStatus: input.spendingSummary.budgetStatus
        };
      }

      return {
        productId: product.id,
        title: product.title,
        brand: product.brand,
        retailer: product.retailer,
        price: product.price,
        targetPrice: targetPrice ?? undefined,
        recommendation: "review_materials" as const,
        reason: "Budget or material quality is not clearly compelling. Compare fabric, wear frequency, and target price before buying.",
        materialScore,
        budgetStatus: input.spendingSummary.budgetStatus
      };
    })
    .sort((a, b) => b.materialScore - a.materialScore)
    .slice(0, input.maxRecommendations ?? 5);
}
