import { NextResponse } from "next/server";

import { PlaidUserSchema } from "@/lib/agents/schemas";
import { getLinkTokenRequest, getPlaidClient, toSafePlaidError } from "@/lib/plaid/client";
import { jsonError, parseJsonBody } from "@/lib/utils/errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const input = PlaidUserSchema.parse(await parseJsonBody(request));
    const plaid = getPlaidClient();

    if (!plaid) {
      return NextResponse.json({
        mode: "mock",
        linkToken: `link-sandbox-${input.userId.slice(0, 8)}`,
        expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        note: "Plaid credentials are not configured. Returning a sandbox-shaped mock Link token."
      });
    }

    try {
      const response = await plaid.linkTokenCreate({
        ...getLinkTokenRequest(input.userId),
        redirect_uri: input.redirectUri
      });

      return NextResponse.json({
        mode: "plaid",
        linkToken: response.data.link_token,
        expiration: response.data.expiration,
        requestId: response.data.request_id
      });
    } catch (error) {
      throw toSafePlaidError(error);
    }
  } catch (error) {
    return jsonError(error);
  }
}
