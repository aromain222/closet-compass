import type { ProductResult, ProductSearchInput } from "@/lib/products/types";
import { searchMockProducts } from "@/lib/products/mockProvider";
import { getServerEnv } from "@/lib/utils/env";

export interface ProductSearchProvider {
  search(input: ProductSearchInput): Promise<ProductResult[]>;
  getById(id: string): Promise<ProductResult | null>;
}

/* ── helpers ── */

function parsePrice(raw: string | null | undefined): number {
  if (!raw) return 0;
  const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function inferBrand(title: string): string {
  // Amazon titles often start with brand: "Brand Name Product Description..."
  const words = title.split(" ");
  if (words.length >= 2) return words.slice(0, 2).join(" ");
  return words[0] ?? "Unknown";
}

function inferCategory(query: string): string {
  const q = query.toLowerCase();
  if (/\b(dress|gown|sundress)\b/.test(q)) return "dress";
  if (/\b(jean|denim|pant|trouser|legging|chino)\b/.test(q)) return "pants";
  if (/\b(shirt|blouse|top|tee|tank)\b/.test(q)) return "tops";
  if (/\b(sweater|cardigan|pullover|knit|hoodie)\b/.test(q)) return "sweater";
  if (/\b(jacket|coat|blazer|vest|outerwear)\b/.test(q)) return "outerwear";
  if (/\b(skirt|mini|midi|maxi)\b/.test(q)) return "skirt";
  if (/\b(shoe|boot|sneaker|heel|sandal|loafer)\b/.test(q)) return "shoes";
  if (/\b(bag|purse|handbag|tote|clutch)\b/.test(q)) return "bags";
  return "clothing";
}

function extractMaterialsFromTitle(title: string): string[] {
  const matches = title.match(
    /\b(cotton|linen|silk|wool|cashmere|modal|lyocell|viscose|rayon|polyester|nylon|elastane|spandex|acrylic|leather|suede)\b/gi
  );
  return matches ? [...new Set(matches.map((m) => m.toLowerCase()))] : [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAmazonProduct(p: any, query: string): ProductResult {
  const price = parsePrice(p.product_price);
  const originalPrice = parsePrice(p.product_original_price);
  const materials = extractMaterialsFromTitle(p.product_title ?? "");
  const asin: string = p.asin ?? p.product_asin ?? "";

  return {
    id: `amazon-${asin}`,
    title: p.product_title ?? "Amazon Product",
    brand: inferBrand(p.product_title ?? ""),
    retailer: "Amazon",
    price: price > 0 ? price : 0,
    originalPrice: originalPrice > price ? originalPrice : undefined,
    currency: "USD",
    productUrl: p.product_url ?? `https://www.amazon.com/dp/${asin}`,
    imageUrl: p.product_photo ?? p.thumbnail ?? "",
    category: inferCategory(query),
    colors: [],
    sizes: [],
    description: p.product_title ?? "",
    listedMaterials: materials,
    inferredMaterials: materials,
    normalizedMaterials: materials.map((f) => ({ fiber: f, percentage: null })),
    materialConfidence: materials.length > 0 ? 0.4 : 0.1,
    materialConfidenceLabel: materials.length > 0 ? "low" : "low",
    softnessScore: 0,
    stretchScore: 0,
    breathabilityScore: 0,
    opacityScore: 0,
    durabilityScore: 0,
    careInstructions: [],
    reviewSummary: p.sales_volume ? `${p.sales_volume} — rated ${p.product_star_rating ?? "?"}/5` : undefined,
    source: "amazon",
    createdAt: new Date().toISOString(),
  };
}

async function searchAmazonProducts(input: ProductSearchInput): Promise<ProductResult[]> {
  const env = getServerEnv();
  if (!env.rapidApiKey) return searchMockProducts(input);

  const params = new URLSearchParams({
    query: input.query,
    country: "US",
    sort_by: "RELEVANCE",
    product_condition: "NEW",
    page: "1",
  });
  if (input.maxPrice) params.set("max_price", String(Math.round(input.maxPrice)));

  try {
    const res = await fetch(
      `https://real-time-amazon-data.p.rapidapi.com/search?${params}`,
      {
        headers: {
          "X-RapidAPI-Key": env.rapidApiKey,
          "X-RapidAPI-Host": "real-time-amazon-data.p.rapidapi.com",
        },
        next: { revalidate: 300 },
      }
    );
    if (!res.ok) return searchMockProducts(input);
    const json = await res.json();
    const products: unknown[] = json?.data?.products ?? [];
    return products.slice(0, 12).map((p) => mapAmazonProduct(p, input.query));
  } catch {
    return searchMockProducts(input);
  }
}

async function getAmazonProductById(id: string): Promise<ProductResult | null> {
  const env = getServerEnv();
  const asin = id.replace(/^amazon-/, "");
  if (!asin || !env.rapidApiKey) return null;

  try {
    const res = await fetch(
      `https://real-time-amazon-data.p.rapidapi.com/product-details?asin=${asin}&country=US`,
      {
        headers: {
          "X-RapidAPI-Key": env.rapidApiKey,
          "X-RapidAPI-Host": "real-time-amazon-data.p.rapidapi.com",
        },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const p = json?.data;
    if (!p) return null;

    const materials = [
      ...extractMaterialsFromTitle(p.product_title ?? ""),
      ...extractMaterialsFromTitle(p.product_description ?? ""),
      ...extractMaterialsFromTitle((p.product_details ?? []).join(" ")),
    ];
    const uniqueMaterials = [...new Set(materials)];

    return {
      id,
      title: p.product_title ?? "Amazon Product",
      brand: p.product_by_line_info?.brand?.name ?? inferBrand(p.product_title ?? ""),
      retailer: "Amazon",
      price: parsePrice(p.product_price),
      originalPrice: parsePrice(p.product_original_price) || undefined,
      currency: "USD",
      productUrl: `https://www.amazon.com/dp/${asin}`,
      imageUrl: p.product_photos?.[0] ?? p.product_photo ?? "",
      category: inferCategory(p.product_title ?? ""),
      colors: p.product_variations?.color?.map((c: { value: string }) => c.value) ?? [],
      sizes: p.product_variations?.size?.map((s: { value: string }) => s.value) ?? [],
      description: p.product_description ?? p.product_title ?? "",
      listedMaterials: uniqueMaterials,
      inferredMaterials: uniqueMaterials,
      normalizedMaterials: uniqueMaterials.map((f) => ({ fiber: f, percentage: null })),
      materialConfidence: uniqueMaterials.length > 0 ? 0.5 : 0.15,
      materialConfidenceLabel: uniqueMaterials.length > 0 ? "medium" : "low",
      softnessScore: 0,
      stretchScore: 0,
      breathabilityScore: 0,
      opacityScore: 0,
      durabilityScore: 0,
      careInstructions: [],
      source: "amazon",
      createdAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/* ── provider factory ── */

export function getProductSearchProvider(): ProductSearchProvider {
  const env = getServerEnv();

  switch (env.shoppingProvider) {
    case "amazon":
      return {
        search: searchAmazonProducts,
        getById: getAmazonProductById,
      };
    case "mock":
    case "serpapi":
    case "searchapi":
    case "retailer":
    default:
      return {
        search: searchMockProducts,
        getById: async (id) => {
          const products = await searchMockProducts({ query: "" });
          return products.find((p) => p.id === id) ?? null;
        },
      };
  }
}
