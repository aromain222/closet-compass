import { NextResponse } from "next/server";

import { StripeCheckoutSchema } from "@/lib/agents/schemas";
import { getStripeClient } from "@/lib/stripe/client";
import { getServerEnv } from "@/lib/utils/env";
import { ApiError } from "@/lib/utils/errors";
import { jsonError, parseJsonBody } from "@/lib/utils/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = StripeCheckoutSchema.parse(await parseJsonBody(request));
    const env = getServerEnv();
    const stripe = getStripeClient();
    const priceId = input.priceId ?? env.stripePriceId;

    if (!stripe || !priceId) {
      return NextResponse.json({
        mode: "mock",
        checkoutUrl: `${input.successUrl ?? env.stripeSuccessUrl ?? "http://localhost:3000/success"}?session_id=mock_session`,
        sessionId: `cs_test_mock_${crypto.randomUUID()}`,
        priceId: priceId ?? "price_mock_material_muse",
        userId: input.userId ?? null,
        premiumLayer: "future_optional",
        note:
          "Stripe test-mode keys or a recurring Price ID are not configured. Returning a mock Checkout Session shape."
      });
    }

    if (!input.userId && !input.customerEmail) {
      throw new ApiError(400, "missing_customer_reference", "Provide userId or customerEmail for Checkout.");
    }

    // Test-mode ready: this creates a Stripe Billing subscription Checkout Session.
    // Material Muse can later use this optional premium layer for unlimited tracked products
    // or advanced dupe searches; payment state is intentionally separate from core search.
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      client_reference_id: input.userId,
      customer_email: input.customerEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url:
        input.successUrl ??
        env.stripeSuccessUrl ??
        "http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: input.cancelUrl ?? env.stripeCancelUrl ?? "http://localhost:3000/cancel",
      metadata: {
        app: "material_muse",
        premiumLayer: "future_optional",
        userId: input.userId ?? ""
      },
      subscription_data: {
        metadata: {
          app: "material_muse",
          premiumLayer: "future_optional",
          userId: input.userId ?? ""
        }
      }
    });

    return NextResponse.json({
      mode: "stripe_test_ready",
      checkoutUrl: session.url,
      sessionId: session.id,
      priceId,
      userId: input.userId ?? null,
      premiumLayer: "future_optional"
    });
  } catch (error) {
    return jsonError(error);
  }
}
