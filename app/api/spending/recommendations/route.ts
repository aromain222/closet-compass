import { NextResponse } from "next/server";

import { BudgetRecommendationRequestSchema } from "@/lib/agents/schemas";
import { generateBudgetShoppingRecommendations } from "@/lib/agents/budgetAgent";
import { buildSpendingSummary, getMockShoppingTransactions, normalizePlaidTransaction } from "@/lib/plaid/transactions";
import { MOCK_PRODUCTS } from "@/lib/products/mockProvider";
import type { ProductResult } from "@/lib/products/types";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/utils/env";
import { jsonError, parseJsonBody } from "@/lib/utils/errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const input = BudgetRecommendationRequestSchema.parse(await parseJsonBody(request));
    const env = getServerEnv();
    const month = input.month ?? new Date().toISOString().slice(0, 7);
    const budgetLimit = input.budgetLimit ?? env.defaultShoppingBudgetLimit;
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      const spendingSummary = buildSpendingSummary(getMockShoppingTransactions(month), budgetLimit, month);
      const wishlistProducts = MOCK_PRODUCTS.slice(0, 4).map((product) => ({
        product,
        targetPrice: product.originalPrice ? Math.round(product.price * 0.9) : null
      }));
      return NextResponse.json({
        mode: "mock",
        spendingSummary,
        recommendations: generateBudgetShoppingRecommendations({
          wishlistProducts,
          spendingSummary,
          maxRecommendations: input.maxRecommendations
        })
      });
    }

    const periodStart = `${month}-01`;
    const periodEnd = endOfMonth(month);
    const [{ data: wishlist, error: wishlistError }, { data: transactions, error: txError }] = await Promise.all([
      supabase
        .from("wishlist_items")
        .select("product, target_price")
        .eq("user_id", input.userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("transactions")
        .select("plaid_transaction_id, merchant_name, amount, currency, category, transaction_date")
        .eq("user_id", input.userId)
        .gte("transaction_date", periodStart)
        .lte("transaction_date", periodEnd)
    ]);
    if (wishlistError) throw wishlistError;
    if (txError) throw txError;

    const spendingSummary = buildSpendingSummary(
      (transactions ?? []).map((row) =>
        normalizePlaidTransaction({
          transaction_id: row.plaid_transaction_id ?? undefined,
          merchant_name: row.merchant_name,
          amount: Number(row.amount),
          iso_currency_code: row.currency,
          date: row.transaction_date,
          category: row.category
        })
      ),
      budgetLimit,
      month
    );
    const wishlistProducts = (wishlist ?? []).map((item) => ({
      product: item.product as ProductResult,
      targetPrice: item.target_price ? Number(item.target_price) : null
    }));

    return NextResponse.json({
      spendingSummary,
      recommendations: generateBudgetShoppingRecommendations({
        wishlistProducts,
        spendingSummary,
        maxRecommendations: input.maxRecommendations
      })
    });
  } catch (error) {
    return jsonError(error);
  }
}

function endOfMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10);
}
