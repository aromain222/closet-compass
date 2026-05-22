import type { PriceHistoryPoint, ProductResult } from "@/lib/products/types";

export function createMockPriceHistory(product: ProductResult): PriceHistoryPoint[] {
  const now = new Date();
  const previous = new Date(now);
  previous.setDate(previous.getDate() - 14);
  const older = new Date(now);
  older.setDate(older.getDate() - 30);

  return [
    {
      id: `mock-price-${product.id}-older`,
      productId: product.id,
      retailer: product.retailer,
      price: product.originalPrice ?? Math.round(product.price * 1.18),
      currency: product.currency,
      observedAt: older.toISOString()
    },
    {
      id: `mock-price-${product.id}-previous`,
      productId: product.id,
      retailer: product.retailer,
      price: Math.round(product.price * 1.08 * 100) / 100,
      currency: product.currency,
      observedAt: previous.toISOString()
    },
    {
      id: `mock-price-${product.id}-current`,
      productId: product.id,
      retailer: product.retailer,
      price: product.price,
      currency: product.currency,
      observedAt: now.toISOString()
    }
  ];
}

export function summarizePriceTracking(input: {
  history: PriceHistoryPoint[];
  targetPrice?: number | null;
}) {
  const sorted = [...input.history].sort(
    (a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime()
  );
  const current = sorted.at(-1) ?? null;
  const first = sorted[0] ?? null;
  const priceChange = current && first ? Math.round((current.price - first.price) * 100) / 100 : 0;
  const targetMet = Boolean(current && input.targetPrice && current.price <= input.targetPrice);

  return {
    currentPrice: current?.price ?? null,
    currency: current?.currency ?? "USD",
    observedAt: current?.observedAt ?? null,
    priceChange,
    targetPrice: input.targetPrice ?? null,
    targetMet,
    summaryText: targetMet
      ? "This item is at or below your target price."
      : priceChange < 0
        ? "Price has moved down from the first tracked point, but target price is not met yet."
        : "No meaningful price drop is visible yet."
  };
}
