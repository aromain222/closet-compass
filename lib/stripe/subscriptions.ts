import "server-only";

import type Stripe from "stripe";

import { getSupabaseServiceClient } from "@/lib/supabase/server";

export type SubscriptionStatus =
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused"
  | "unknown";

interface UpsertSubscriptionStatusInput {
  userId?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  status: SubscriptionStatus;
  currentPeriodEnd?: number | null;
  cancelAtPeriodEnd?: boolean | null;
  source: "checkout.session.completed" | "customer.subscription.updated" | "customer.subscription.deleted";
}

export function normalizeStripeSubscriptionStatus(status?: string | null): SubscriptionStatus {
  switch (status) {
    case "incomplete":
    case "incomplete_expired":
    case "trialing":
    case "active":
    case "past_due":
    case "canceled":
    case "unpaid":
    case "paused":
      return status;
    default:
      return "unknown";
  }
}

export function getCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

export function getSubscriptionId(subscription: string | Stripe.Subscription | null): string | null {
  if (!subscription) return null;
  return typeof subscription === "string" ? subscription : subscription.id;
}

export function getFirstPriceId(subscription: Stripe.Subscription): string | null {
  return subscription.items.data[0]?.price.id ?? null;
}

export async function upsertSubscriptionStatus(input: UpsertSubscriptionStatusInput) {
  const supabase = getSupabaseServiceClient();
  if (!supabase || !input.stripeSubscriptionId) {
    return null;
  }

  const { data, error } = await supabase
    .from("subscription_status")
    .upsert(
      {
        user_id: input.userId ?? null,
        stripe_customer_id: input.stripeCustomerId,
        stripe_subscription_id: input.stripeSubscriptionId,
        stripe_price_id: input.stripePriceId,
        status: input.status,
        current_period_end: input.currentPeriodEnd
          ? new Date(input.currentPeriodEnd * 1000).toISOString()
          : null,
        cancel_at_period_end: input.cancelAtPeriodEnd ?? false,
        last_event_type: input.source
      },
      { onConflict: "stripe_subscription_id" }
    )
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
