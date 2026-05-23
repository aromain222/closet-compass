import "server-only";

export interface ServerEnv {
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
  shoppingProvider: "mock" | "serpapi" | "searchapi" | "retailer" | "amazon";
  serpApiKey?: string;
  searchApiKey?: string;
  rapidApiKey?: string;
  plaidClientId?: string;
  plaidSecret?: string;
  plaidEnv: "sandbox" | "development" | "production";
  plaidTokenEncryptionKey?: string;
  defaultShoppingBudgetLimit: number;
  stripeSecretKey?: string;
  stripePriceId?: string;
  stripeWebhookSecret?: string;
  stripeSuccessUrl?: string;
  stripeCancelUrl?: string;
}

export function getServerEnv(): ServerEnv {
  const provider = process.env.SHOPPING_PROVIDER;
  const plaidEnv = process.env.PLAID_ENV;

  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    shoppingProvider:
      provider === "serpapi" || provider === "searchapi" || provider === "retailer" || provider === "amazon"
        ? provider
        : "mock",
    serpApiKey: process.env.SERPAPI_API_KEY,
    searchApiKey: process.env.SEARCHAPI_API_KEY,
    rapidApiKey: process.env.RAPIDAPI_KEY,
    plaidClientId: process.env.PLAID_CLIENT_ID,
    plaidSecret: process.env.PLAID_SECRET,
    plaidEnv:
      plaidEnv === "development" || plaidEnv === "production" ? plaidEnv : "sandbox",
    plaidTokenEncryptionKey: process.env.PLAID_TOKEN_ENCRYPTION_KEY,
    defaultShoppingBudgetLimit: Number(process.env.DEFAULT_SHOPPING_BUDGET_LIMIT ?? 400),
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripePriceId: process.env.STRIPE_PRICE_ID,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    stripeSuccessUrl: process.env.STRIPE_SUCCESS_URL,
    stripeCancelUrl: process.env.STRIPE_CANCEL_URL
  };
}

export function hasSupabaseServerConfig(): boolean {
  const env = getServerEnv();
  return Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
}
