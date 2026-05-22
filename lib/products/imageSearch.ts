import type { ImageSearchAnalysis } from "@/lib/products/types";

const CATEGORY_TERMS = ["dress", "skirt", "cardigan", "sweater", "trouser", "pants", "shirt", "activewear"];
const COLOR_TERMS = ["black", "white", "ivory", "grey", "camel", "navy", "green", "sage", "rose", "champagne"];
const MATERIAL_TERMS = ["silk", "linen", "cotton", "cashmere", "wool", "modal", "lyocell", "nylon", "spandex", "polyester"];

export function analyzeMockImageSearch(input: {
  query?: string;
  imageUrl?: string;
  imageBase64?: string;
}): ImageSearchAnalysis {
  const text = `${input.query ?? ""} ${input.imageUrl ?? ""}`.toLowerCase();
  const category = CATEGORY_TERMS.find((term) => text.includes(term));
  const colors = COLOR_TERMS.filter((term) => text.includes(term));
  const materialHints = MATERIAL_TERMS.filter((term) => text.includes(term));
  const silhouette = /bias|slip|midi/.test(text)
    ? "bias or slip silhouette"
    : /wide|relaxed/.test(text)
      ? "relaxed silhouette"
      : /cropped|cardigan/.test(text)
        ? "cropped knit silhouette"
        : undefined;
  const inferredQuery = [colors[0], materialHints[0], silhouette, category]
    .filter(Boolean)
    .join(" ")
    .trim() || input.query?.trim() || "fashion item with clear material details";

  return {
    mode: "mock",
    inferredQuery,
    visualSignals: {
      category,
      colors,
      silhouette,
      materialHints
    },
    confidence: input.query ? "medium" : "low",
    note:
      "Mock image search uses filename/text hints until a real image embedding or visual search provider is connected."
  };
}
