import { NextResponse } from "next/server";

import { PlaidExchangeSchema } from "@/lib/agents/schemas";
import { getPlaidClient, toSafePlaidError } from "@/lib/plaid/client";
import { encryptAccessToken } from "@/lib/plaid/tokens";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { jsonError, parseJsonBody } from "@/lib/utils/errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const input = PlaidExchangeSchema.parse(await parseJsonBody(request));
    const plaid = getPlaidClient();
    const supabase = getSupabaseServiceClient();

    if (!plaid) {
      const itemId = `mock-item-${input.userId.slice(0, 8)}`;
      if (supabase) {
        await supabase.from("plaid_items").upsert(
          {
            user_id: input.userId,
            plaid_item_id: itemId,
            institution_name: "Plaid Sandbox",
            access_token_encrypted: encryptAccessToken("access-sandbox-mock"),
            status: "mock"
          },
          { onConflict: "plaid_item_id" }
        );
      }

      return NextResponse.json({
        mode: "mock",
        itemId,
        connected: true,
        note: "Plaid credentials are not configured. Stored only a mock server-side item when Supabase is available."
      });
    }

    let itemId: string;
    let encryptedAccessToken: string;
    try {
      const response = await plaid.itemPublicTokenExchange({
        public_token: input.publicToken
      });
      itemId = response.data.item_id;
      encryptedAccessToken = encryptAccessToken(response.data.access_token);
    } catch (error) {
      throw toSafePlaidError(error);
    }

    if (supabase) {
      const { error } = await supabase.from("plaid_items").upsert(
        {
          user_id: input.userId,
          plaid_item_id: itemId,
          institution_name: "Plaid-linked institution",
          access_token_encrypted: encryptedAccessToken,
          status: "active"
        },
        { onConflict: "plaid_item_id" }
      );
      if (error) throw error;
    }

    return NextResponse.json({
      mode: "plaid",
      itemId,
      connected: true,
      note: "Public token exchanged. Access token is encrypted and kept server-side."
    });
  } catch (error) {
    return jsonError(error);
  }
}
