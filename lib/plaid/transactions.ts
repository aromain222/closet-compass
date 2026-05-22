import "server-only";

import { categorizeShoppingMerchant, type ShoppingCategory } from "@/lib/plaid/merchantCategorization";

export type BudgetStatus = "under_budget" | "near_limit" | "over_budget";

export interface ShoppingTransaction {
  id: string;
  merchantName: string;
  amount: number;
  currency: string;
  date: string;
  plaidCategories: string[];
  shoppingCategory: ShoppingCategory;
  isShoppingRelated: boolean;
}

export interface SpendingSummaryResult {
  month: string;
  shoppingSpend: number;
  budgetLimit: number;
  budgetRemaining: number;
  topMerchants: Array<{ merchantName: string; spend: number; transactionCount: number }>;
  categoryBreakdown: Array<{ category: ShoppingCategory; spend: number; transactionCount: number }>;
  summaryText: string;
  budgetStatus: BudgetStatus;
}

type RawPlaidTransaction = {
  transaction_id?: string;
  name?: string;
  merchant_name?: string | null;
  amount?: number;
  iso_currency_code?: string | null;
  date?: string;
  category?: string[] | null;
};

export function normalizePlaidTransaction(transaction: RawPlaidTransaction): ShoppingTransaction {
  const merchantName = transaction.merchant_name || transaction.name || "Unknown merchant";
  const plaidCategories = transaction.category ?? [];
  const merchantCategory = categorizeShoppingMerchant(merchantName, plaidCategories);

  return {
    id: transaction.transaction_id || `mock-${merchantName}-${transaction.date || "unknown"}`,
    merchantName,
    amount: Math.max(0, Number(transaction.amount ?? 0)),
    currency: transaction.iso_currency_code || "USD",
    date: transaction.date || new Date().toISOString().slice(0, 10),
    plaidCategories,
    shoppingCategory: merchantCategory.shoppingCategory,
    isShoppingRelated: merchantCategory.isShoppingRelated
  };
}

export function getMockShoppingTransactions(month = currentMonth()): ShoppingTransaction[] {
  return [
    normalizePlaidTransaction({
      transaction_id: "mock-lululemon-1",
      merchant_name: "Lululemon",
      amount: 118,
      iso_currency_code: "USD",
      date: `${month}-04`,
      category: ["Shops", "Sporting Goods"]
    }),
    normalizePlaidTransaction({
      transaction_id: "mock-aritzia-1",
      merchant_name: "Aritzia",
      amount: 164,
      iso_currency_code: "USD",
      date: `${month}-11`,
      category: ["Shops", "Clothing"]
    }),
    normalizePlaidTransaction({
      transaction_id: "mock-sephora-1",
      merchant_name: "Sephora",
      amount: 42,
      iso_currency_code: "USD",
      date: `${month}-18`,
      category: ["Shops", "Beauty"]
    }),
    normalizePlaidTransaction({
      transaction_id: "mock-target-1",
      merchant_name: "Target",
      amount: 36,
      iso_currency_code: "USD",
      date: `${month}-22`,
      category: ["Shops", "Department Stores"]
    }),
    normalizePlaidTransaction({
      transaction_id: "mock-coffee-1",
      merchant_name: "Blue Bottle Coffee",
      amount: 6.5,
      iso_currency_code: "USD",
      date: `${month}-23`,
      category: ["Food and Drink", "Coffee Shop"]
    })
  ];
}

export function buildSpendingSummary(
  transactions: ShoppingTransaction[],
  budgetLimit: number,
  month = currentMonth()
): SpendingSummaryResult {
  const shoppingTransactions = transactions.filter((transaction) => transaction.isShoppingRelated);
  const shoppingSpend = roundCurrency(
    shoppingTransactions.reduce((sum, transaction) => sum + transaction.amount, 0)
  );
  const budgetRemaining = roundCurrency(budgetLimit - shoppingSpend);
  const budgetStatus = getBudgetStatus(shoppingSpend, budgetLimit);

  return {
    month,
    shoppingSpend,
    budgetLimit,
    budgetRemaining,
    topMerchants: topMerchants(shoppingTransactions),
    categoryBreakdown: categoryBreakdown(shoppingTransactions),
    summaryText: createSummaryText(shoppingSpend, budgetLimit, budgetStatus),
    budgetStatus
  };
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export function getBudgetStatus(spend: number, limit: number): BudgetStatus {
  if (limit <= 0) return spend > 0 ? "over_budget" : "under_budget";
  if (spend > limit) return "over_budget";
  if (spend >= limit * 0.8) return "near_limit";
  return "under_budget";
}

function topMerchants(transactions: ShoppingTransaction[]) {
  const byMerchant = new Map<string, { merchantName: string; spend: number; transactionCount: number }>();

  for (const transaction of transactions) {
    const current = byMerchant.get(transaction.merchantName) ?? {
      merchantName: transaction.merchantName,
      spend: 0,
      transactionCount: 0
    };
    current.spend = roundCurrency(current.spend + transaction.amount);
    current.transactionCount += 1;
    byMerchant.set(transaction.merchantName, current);
  }

  return Array.from(byMerchant.values()).sort((a, b) => b.spend - a.spend).slice(0, 5);
}

function categoryBreakdown(transactions: ShoppingTransaction[]) {
  const byCategory = new Map<ShoppingCategory, { category: ShoppingCategory; spend: number; transactionCount: number }>();

  for (const transaction of transactions) {
    const current = byCategory.get(transaction.shoppingCategory) ?? {
      category: transaction.shoppingCategory,
      spend: 0,
      transactionCount: 0
    };
    current.spend = roundCurrency(current.spend + transaction.amount);
    current.transactionCount += 1;
    byCategory.set(transaction.shoppingCategory, current);
  }

  return Array.from(byCategory.values()).sort((a, b) => b.spend - a.spend);
}

function createSummaryText(spend: number, limit: number, status: BudgetStatus): string {
  if (status === "over_budget") {
    return `You spent $${spend.toFixed(2)} on shopping this month, which is $${Math.abs(limit - spend).toFixed(2)} over your soft budget. Worth pausing before adding new pieces unless they fill a real wardrobe gap.`;
  }

  if (status === "near_limit") {
    return `You spent $${spend.toFixed(2)} on shopping this month and have $${Math.max(0, limit - spend).toFixed(2)} left. Keep wishlist picks focused on pieces you would wear often.`;
  }

  return `You spent $${spend.toFixed(2)} on shopping this month and have $${Math.max(0, limit - spend).toFixed(2)} left. There is room for a thoughtful purchase if the fabric and fit are right.`;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}
