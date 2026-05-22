import { NextResponse } from "next/server";

import { SpendingSummarySchema } from "@/lib/agents/schemas";
import {
  buildSpendingSummary,
  getMockShoppingTransactions,
  normalizePlaidTransaction
} from "@/lib/plaid/transactions";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/utils/env";
import { jsonError, parseJsonBody } from "@/lib/utils/errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const input = SpendingSummarySchema.parse(await parseJsonBody(request));
    const env = getServerEnv();
    const month = input.month ?? new Date().toISOString().slice(0, 7);
    const periodStart = input.periodStart ?? `${month}-01`;
    const periodEnd = input.periodEnd ?? endOfMonth(month);
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return NextResponse.json(
        buildSpendingSummary(
          getMockShoppingTransactions(month),
          input.budgetLimit ?? env.defaultShoppingBudgetLimit,
          month
        )
      );
    }

    const budgetLimit = input.budgetLimit ?? (await getBudgetLimit(input.userId, env.defaultShoppingBudgetLimit));
    const { data, error } = await supabase
      .from("transactions")
      .select("plaid_transaction_id, merchant_name, amount, currency, category, transaction_date")
      .eq("user_id", input.userId)
      .gte("transaction_date", periodStart)
      .lte("transaction_date", periodEnd);

    if (error) throw error;

    const transactions = (data ?? []).map((row) =>
      normalizePlaidTransaction({
        transaction_id: row.plaid_transaction_id ?? undefined,
        merchant_name: row.merchant_name,
        amount: Number(row.amount),
        iso_currency_code: row.currency,
        date: row.transaction_date,
        category: row.category
      })
    );

    return NextResponse.json(buildSpendingSummary(transactions, budgetLimit, month));
  } catch (error) {
    return jsonError(error);
  }
}

async function getBudgetLimit(userId: string, fallback: number): Promise<number> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return fallback;

  const { data, error } = await supabase
    .from("shopping_budgets")
    .select("monthly_limit")
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) return fallback;
  return Number(data.monthly_limit);
}

function endOfMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10);
}
