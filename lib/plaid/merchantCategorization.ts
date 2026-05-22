export type ShoppingCategory =
  | "activewear"
  | "fashion"
  | "beauty"
  | "mixed"
  | "needs_review"
  | "non_shopping";

export interface MerchantCategoryResult {
  merchantName: string;
  shoppingCategory: ShoppingCategory;
  isShoppingRelated: boolean;
  confidence: "high" | "medium" | "low";
  reason: string;
}

const MERCHANT_RULES: Array<{
  pattern: RegExp;
  category: ShoppingCategory;
  reason: string;
}> = [
  { pattern: /lululemon/i, category: "activewear", reason: "Known activewear merchant." },
  { pattern: /aritzia/i, category: "fashion", reason: "Known fashion merchant." },
  { pattern: /\bzara\b/i, category: "fashion", reason: "Known fashion merchant." },
  { pattern: /\bh\s*&\s*m\b|\bhm\b/i, category: "fashion", reason: "Known fashion merchant." },
  { pattern: /abercrombie/i, category: "fashion", reason: "Known fashion merchant." },
  { pattern: /sephora/i, category: "beauty", reason: "Known beauty merchant." },
  { pattern: /amazon/i, category: "needs_review", reason: "Amazon purchases need review before treating them as wardrobe spend." },
  { pattern: /target/i, category: "mixed", reason: "Target can include clothing, beauty, home, or grocery spend." },
  { pattern: /nordstrom/i, category: "fashion", reason: "Known department store with strong fashion signal." }
];

export function categorizeShoppingMerchant(
  merchantName: string | null | undefined,
  plaidCategories: string[] = []
): MerchantCategoryResult {
  const name = merchantName?.trim() || "Unknown merchant";
  const rule = MERCHANT_RULES.find((candidate) => candidate.pattern.test(name));

  if (rule) {
    return {
      merchantName: name,
      shoppingCategory: rule.category,
      isShoppingRelated: rule.category !== "non_shopping",
      confidence: rule.category === "mixed" || rule.category === "needs_review" ? "medium" : "high",
      reason: rule.reason
    };
  }

  const categoryText = plaidCategories.join(" ").toLowerCase();
  if (/clothing|apparel|shoe|department store|sporting goods|beauty|cosmetic/.test(categoryText)) {
    return {
      merchantName: name,
      shoppingCategory: /beauty|cosmetic/.test(categoryText) ? "beauty" : "fashion",
      isShoppingRelated: true,
      confidence: "medium",
      reason: "Plaid category suggests shopping or wardrobe-adjacent spend."
    };
  }

  return {
    merchantName: name,
    shoppingCategory: "non_shopping",
    isShoppingRelated: false,
    confidence: "low",
    reason: "Merchant is not recognized as shopping-focused."
  };
}
