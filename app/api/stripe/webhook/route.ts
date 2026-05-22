import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getStripeClient } from "@/lib/stripe/client";
import {
  getCustomerId,
  getFirstPriceId,
  getSubscriptionId,
  normalizeStripeSubscriptionStatus,
  upsertSubscriptionStatus
} from "@/lib/stripe/subscriptions";
import { getServerEnv } from "@/lib/utils/env";
import { ApiError, jsonError } from "@/lib/utils/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const stripe = getStripeClient();
    const env = getServerEnv();
    const rawBody = await request.text();

    if (!stripe) {
      return NextResponse.json({
        received: true,
        mode: "mock",
        note: "Stripe is not configured. Webhook acknowledged for local test-mode development only."
      });
    }

    let event: Stripe.Event;

    if (env.stripeWebhookSecret) {
      const signature = request.headers.get("stripe-signature");
      if (!signature) {
        throw new ApiError(400, "missing_stripe_signature", "Missing Stripe webhook signature.");
      }

      // Stripe requires the raw request body for signature verification.
      event = stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
    } else {
      // Local-only fallback so backend smoke tests can post fixture events without a whsec_* value.
      // Configure STRIPE_WEBHOOK_SECRET before exposing this route beyond local test-mode development.
      event = JSON.parse(rawBody) as Stripe.Event;
    }

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionEvent(
          event.type,
          event.data.object as Stripe.Subscription
        );
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return jsonError(error);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id || session.metadata?.userId || null;
  await upsertSubscriptionStatus({
    userId,
    stripeCustomerId: getCustomerId(session.customer),
    stripeSubscriptionId: getSubscriptionId(session.subscription),
    stripePriceId: null,
    status: session.payment_status === "paid" ? "active" : "unknown",
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    source: "checkout.session.completed"
  });
}

async function handleSubscriptionEvent(
  eventType: "customer.subscription.updated" | "customer.subscription.deleted",
  subscription: Stripe.Subscription
) {
  await upsertSubscriptionStatus({
    userId: subscription.metadata?.userId || null,
    stripeCustomerId: getCustomerId(subscription.customer),
    stripeSubscriptionId: subscription.id,
    stripePriceId: getFirstPriceId(subscription),
    status: normalizeStripeSubscriptionStatus(subscription.status),
    currentPeriodEnd: subscription.items.data[0]?.current_period_end ?? null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    source: eventType
  });
}
