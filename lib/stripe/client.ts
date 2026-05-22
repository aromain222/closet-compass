import "server-only";

import Stripe from "stripe";

import { getServerEnv } from "@/lib/utils/env";

export const STRIPE_API_VERSION = "2026-04-22.dahlia";

export function getStripeClient(): Stripe | null {
  const env = getServerEnv();
  if (!env.stripeSecretKey) {
    return null;
  }

  // Test-mode ready: use sk_test_* locally and keep this isolated from core product flows.
  return new Stripe(env.stripeSecretKey, {
    apiVersion: STRIPE_API_VERSION
  });
}

export function hasStripeWebhookSecret(): boolean {
  return Boolean(getServerEnv().stripeWebhookSecret);
}
