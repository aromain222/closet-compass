import { NextResponse } from "next/server";

import { PlaidTransactionsSchema } from "@/lib/agents/schemas";
import { getPlaidClient, toSafePlaidError } from "@/lib/plaid/client";
import { categorizeShoppingMerchant } from "@/lib/plaid/merchantCategorization";
import { decryptAccessToken } from "@/lib/plaid/tokens";
import {
  getMockShoppingTransactions,
  normalizePlaidTransaction
} from "@/lib/plaid/transactions";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { ApiError, jsonError, parseJsonBody } from "@/lib/utils/errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const input = PlaidTransactionsSchema.parse(await parseJsonBody(request));
    const plaid = getPlaidClient();
    const supabase = getSupabaseServiceClient();

    if (!plaid || !supabase) {
      const transactions = getMockShoppingTransactions();
      return NextResponse.json({
        mode: "mock",
        userId: input.userId,
        added: transactions,
        modified: [],
        removed: [],
        nextCursor: input.cursor ?? "mock-cursor",
        hasMore: false,
        note:
          !plaid && !supabase
            ? "Plaid and Supabase are not configured. Returning sandbox-shaped mock transactions."
            : !plaid
              ? "Plaid credentials are not configured. Returning sandbox-shaped mock transactions."
              : "Supabase is not configured, so synced transactions cannot be persisted."
      });
    }

    const itemQuery = supabase
      .from("plaid_items")
      .select("id, plaid_item_id, access_token_encrypted, transactions_cursor")
      .eq("user_id", input.userId)
      .order("created_at", { ascending: false })
      .limit(1);
    const { data: item, error: itemError } = input.itemId
      ? await itemQuery.eq("plaid_item_id", input.itemId).maybeSingle()
      : await itemQuery.maybeSingle();

    if (itemError) throw itemError;
    if (!item) {
      throw new ApiError(404, "plaid_item_not_found", "No Plaid item is connected for this user.");
    }

    const accessToken = decryptAccessToken(item.access_token_encrypted);
    const added = [];
    const modified = [];
    const removed = [];
    let cursor = input.cursor ?? item.transactions_cursor ?? undefined;
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await plaid.transactionsSync({
          access_token: accessToken,
          cursor,
          count: input.count
        });

        const addedPage = response.data.added.map(normalizePlaidTransaction);
        const modifiedPage = response.data.modified.map(normalizePlaidTransaction);
        const removedPage = response.data.removed.map((transaction) => ({
          id: transaction.transaction_id
        }));

        added.push(...addedPage);
        modified.push(...modifiedPage);
        removed.push(...removedPage);
        cursor = response.data.next_cursor;
        hasMore = response.data.has_more;
      } catch (error) {
        throw toSafePlaidError(error);
      }
    }

    const upsertRows = [...added, ...modified].map((transaction) => ({
      user_id: input.userId,
      plaid_item_id: item.id,
      plaid_transaction_id: transaction.id,
      merchant_name: transaction.merchantName,
      amount: transaction.amount,
      currency: transaction.currency,
      category: transaction.plaidCategories,
      shopping_category: transaction.shoppingCategory,
      transaction_date: transaction.date,
      raw: transaction
    }));

    if (upsertRows.length > 0) {
      const { error } = await supabase
        .from("transactions")
        .upsert(upsertRows, { onConflict: "plaid_transaction_id" });
      if (error) throw error;
    }

    if (removed.length > 0) {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .in(
          "plaid_transaction_id",
          removed.map((transaction) => transaction.id)
        );
      if (error) throw error;
    }

    await supabase
      .from("plaid_items")
      .update({ transactions_cursor: cursor })
      .eq("id", item.id);

    return NextResponse.json({
      mode: "plaid",
      userId: input.userId,
      itemId: item.plaid_item_id,
      added,
      modified,
      removed,
      nextCursor: cursor,
      hasMore: false,
      categoryPreview: [...added, ...modified].map((transaction) =>
        categorizeShoppingMerchant(transaction.merchantName, transaction.plaidCategories)
      )
    });
  } catch (error) {
    return jsonError(error);
  }
}
