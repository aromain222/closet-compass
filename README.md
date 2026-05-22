# Material Muse Backend

Backend foundation for a fashion-first shopping and budgeting assistant built with Next.js 14 App Router, TypeScript, Supabase, and Zod.

Materials are modeled as first-class data: routes and agents extract fibers, normalize blends, score softness/stretch/breathability/opacity/durability, and explain material tradeoffs for search and dupe ranking.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment values:

```bash
cp .env.example .env.local
```

3. Create Supabase tables:

```bash
supabase db reset
```

Or run `supabase/schema.sql` in the Supabase SQL editor, then optionally run `supabase/seed.sql`.

4. Start the API server:

```bash
npm run dev
```

## API Routes

All routes validate input with Zod and return JSON designed for a frontend agent to consume.

- `POST /api/search`
  Expects `{ query, maxPrice?, preferredMaterials?, avoidMaterials?, occasion?, stylePreferences?, sizePreferences? }`.
  Returns `{ query, products, agentSummary, materialNotes, filtersApplied }`.

- `POST /api/search/image`
  Expects `{ imageUrl? | imageBase64?, query?, maxPrice?, preferredMaterials?, avoidMaterials? }`.
  Returns normal search output plus `imageSearch` with mock visual signals, inferred query, and confidence.

- `POST /api/dupe`
  Expects `{ productId? | sourceProduct?, maxPrice?, preferredMaterials?, avoidMaterials?, limit? }`.
  Returns `{ sourceProduct, alternatives, agentSummary }`, where each alternative includes material-heavy scoring and a recommendation label.

- `GET /api/products/[id]`
  Returns `{ product, materialProfile }`.

- `GET /api/products/save?userId=...`
  Returns `{ savedProducts }`.

- `POST /api/products/save`
  Expects `{ userId, product, notes? }`.
  Returns `{ savedProduct, materialProfile }`.

- `GET /api/products/track?productId=...&userId=...`
  Returns `{ productId, priceHistory, trackingSummary }`.

- `POST /api/products/track`
  Expects `{ userId, product, targetPrice?, notifyOnDrop? }`.
  Returns `{ tracked, pricePoint, trackingSummary }`.

- `GET /api/wishlist?userId=...`
  Returns `{ items }`.

- `POST /api/wishlist`
  Expects `{ userId, product, priority?, targetPrice? }`.
  Returns `{ item }`.

- `DELETE /api/wishlist`
  Expects `{ userId, wishlistItemId? | productId? }`.
  Returns `{ deleted }`.

- `POST /api/plaid/create-link-token`
  Expects `{ userId, redirectUri? }`.
  Returns `{ mode, linkToken, expiration, requestId? }`.

- `POST /api/plaid/exchange-token`
  Expects `{ userId, publicToken }`.
  Returns `{ mode, itemId, connected, note }`. Access tokens are encrypted server-side and never returned.

- `POST /api/plaid/transactions`
  Expects `{ userId, itemId?, cursor?, count?, startDate?, endDate? }`.
  Returns `{ mode, added, modified, removed, nextCursor, hasMore }` with shopping categories.

- `POST /api/spending/summary`
  Expects `{ userId, month?, budgetLimit?, periodStart?, periodEnd? }`.
  Returns `{ month, shoppingSpend, budgetLimit, budgetRemaining, topMerchants, categoryBreakdown, summaryText, budgetStatus }`.

- `POST /api/spending/recommendations`
  Expects `{ userId, month?, budgetLimit?, maxRecommendations? }`.
  Returns `{ spendingSummary, recommendations }`, combining wishlist products, material quality, price targets, and shopping budget status.

- `POST /api/stripe/create-checkout-session`
  Expects `{ userId?, customerEmail?, priceId?, successUrl?, cancelUrl? }`.
  Returns `{ mode, checkoutUrl, sessionId, priceId, userId, premiumLayer }`.

- `POST /api/stripe/webhook`
  Receives Stripe webhook events and updates `subscription_status`.

## Example Search

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "black slip skirt",
    "maxPrice": 120,
    "preferredMaterials": ["modal", "silk"],
    "avoidMaterials": ["acrylic"]
  }'
```

## Example Dupe Search

```bash
curl -X POST http://localhost:3000/api/dupe \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "mock-silk-slip-skirt",
    "maxPrice": 120,
    "limit": 5
  }'
```

## Provider Model

`lib/products/searchProvider.ts` exposes a provider interface. The current implementation routes every provider setting to `mockProvider`, so the app works without external shopping APIs. Future SerpApi, SearchAPI, Google Shopping, Amazon, or retailer-specific providers should implement the same `search` and `getById` methods.

## Database Notes

`supabase/schema.sql` includes RLS, indexes for user-scoped reads, material lookup, price history, and agent output history. API routes use the Supabase service role client only on the server. If Supabase env vars are missing, routes continue in mock mode without leaking secret configuration.

## Plaid Notes

Set `PLAID_CLIENT_ID`, `PLAID_SECRET`, and `PLAID_ENV=sandbox` for Plaid sandbox calls. `PLAID_TOKEN_ENCRYPTION_KEY` is used to encrypt access tokens before storage. Access tokens are never returned by API routes.

The spending summary intentionally avoids a fintech dashboard shape. It returns only the month, shopping spend, budget limit, remaining budget, top merchants, category breakdown, a short summary sentence, and `budgetStatus`.

## Stripe Notes

Stripe is test-mode ready but intentionally not central to Material Muse. It is an optional future premium layer for limits such as unlimited tracked products or advanced dupe searches.

Use a recurring test Price ID in `STRIPE_PRICE_ID`, a test secret key in `STRIPE_SECRET_KEY`, and a webhook signing secret in `STRIPE_WEBHOOK_SECRET`. The webhook listens for Checkout completion and subscription update/delete events, then writes compact subscription state to `subscription_status`.
