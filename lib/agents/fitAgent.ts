import type { ProductResult } from "@/lib/products/types";

export function summarizeFitSignal(product: ProductResult, sizePreferences?: Record<string, string>): string {
  const requestedSize = sizePreferences?.[product.category] ?? sizePreferences?.default;
  const sizeSignal = requestedSize
    ? product.sizes.includes(requestedSize)
      ? `Available in preferred size ${requestedSize}.`
      : `Preferred size ${requestedSize} is not listed.`
    : "No size preference supplied.";

  return `${sizeSignal} Category and stretch score suggest ${product.stretchScore >= 70 ? "forgiving" : "structured"} fit behavior.`;
}
