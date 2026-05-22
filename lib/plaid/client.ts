import "server-only";

import { Configuration, CountryCode, PlaidApi, PlaidEnvironments, Products } from "plaid";

import { ApiError } from "@/lib/utils/errors";
import { getServerEnv } from "@/lib/utils/env";

export function hasPlaidCredentials(): boolean {
  const env = getServerEnv();
  return Boolean(env.plaidClientId && env.plaidSecret);
}

export function getPlaidClient(): PlaidApi | null {
  const env = getServerEnv();
  if (!env.plaidClientId || !env.plaidSecret) {
    return null;
  }

  const basePath =
    env.plaidEnv === "production"
      ? PlaidEnvironments.production
      : env.plaidEnv === "development"
        ? PlaidEnvironments.development
        : PlaidEnvironments.sandbox;

  return new PlaidApi(
    new Configuration({
      basePath,
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": env.plaidClientId,
          "PLAID-SECRET": env.plaidSecret
        }
      }
    })
  );
}

export function getLinkTokenRequest(userId: string) {
  return {
    user: {
      client_user_id: userId
    },
    client_name: "Material Muse",
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: "en"
  };
}

export function toSafePlaidError(error: unknown): ApiError {
  const candidate = error as {
    response?: {
      data?: {
        error_code?: string;
        error_message?: string;
      };
    };
  };

  const plaidError = candidate.response?.data;
  return new ApiError(
    502,
    "plaid_error",
    plaidError?.error_message || plaidError?.error_code || "Plaid request failed."
  );
}
