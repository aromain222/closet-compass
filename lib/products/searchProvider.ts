import type { ProductResult, ProductSearchInput } from "@/lib/products/types";
import { enrichProducts } from "@/lib/materials/enrichMaterials";
import { getServerEnv } from "@/lib/utils/env";

export interface ProductSearchProvider {
  search(input: ProductSearchInput): Promise<ProductResult[]>;
  getById(id: string): Promise<ProductResult | null>;
}

/* ── shared helpers ── */

function parsePrice(raw: string | null | undefined): number {
  if (!raw) return 0;
  const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function inferBrand(title: string): string {
  const words = title.split(" ");
  return words.length >= 2 ? words.slice(0, 2).join(" ") : (words[0] ?? "Unknown");
}

function inferCategory(query: string): string {
  const q = query.toLowerCase();
  if (/\b(dress|gown|sundress)\b/.test(q)) return "dress";
  if (/\b(jean|denim|pant|trouser|legging|chino)\b/.test(q)) return "pants";
  if (/\b(shirt|blouse|top|tee|tank|polo)\b/.test(q)) return "tops";
  if (/\b(sweater|cardigan|pullover|knit|hoodie)\b/.test(q)) return "sweater";
  if (/\b(jacket|coat|blazer|vest|outerwear)\b/.test(q)) return "outerwear";
  if (/\b(skirt|mini|midi|maxi)\b/.test(q)) return "skirt";
  if (/\b(shoe|boot|sneaker|heel|sandal|loafer)\b/.test(q)) return "shoes";
  if (/\b(bag|purse|handbag|tote|clutch)\b/.test(q)) return "bags";
  return "clothing";
}

function extractMaterials(text: string): string[] {
  const matches = text.match(
    /\b(cotton|linen|silk|wool|cashmere|modal|lyocell|viscose|rayon|polyester|nylon|elastane|spandex|acrylic|leather|suede)\b/gi
  );
  return matches ? [...new Set(matches.map((m) => m.toLowerCase()))] : [];
}

function makeMaterialBlend(materials: string[]) {
  return materials.map((f) => ({ fiber: f, percentage: null }));
}

function confidenceLabel(materials: string[]): "low" | "medium" | "high" {
  if (materials.length === 0) return "low";
  return "low";
}

/* ── Amazon provider ── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAmazonProduct(p: any, query: string): ProductResult {
  const price = parsePrice(p.product_price ?? p.product_minimum_offer_price);
  const originalPrice = parsePrice(p.product_original_price);
  const materials = extractMaterials(p.product_title ?? "");
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
    imageUrl: p.product_photo ?? "",
    category: inferCategory(query),
    colors: [],
    sizes: [],
    description: p.product_title ?? "",
    listedMaterials: materials,
    inferredMaterials: materials,
    normalizedMaterials: makeMaterialBlend(materials),
    materialConfidence: materials.length > 0 ? 0.4 : 0.1,
    materialConfidenceLabel: confidenceLabel(materials),
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

async function searchAmazon(input: ProductSearchInput): Promise<ProductResult[]> {
  const env = getServerEnv();
  if (!env.rapidApiKey) return [];

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
    if (!res.ok) return [];
    const json = await res.json();
    const products: unknown[] = json?.data?.products ?? [];
    return products.slice(0, 8).map((p) => mapAmazonProduct(p, input.query));
  } catch {
    return [];
  }
}

async function getAmazonById(id: string): Promise<ProductResult | null> {
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
      ...extractMaterials(p.product_title ?? ""),
      ...extractMaterials(p.product_description ?? ""),
      ...extractMaterials((p.product_details ?? []).join(" ")),
    ];
    const unique = [...new Set(materials)];

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
      listedMaterials: unique,
      inferredMaterials: unique,
      normalizedMaterials: makeMaterialBlend(unique),
      materialConfidence: unique.length > 0 ? 0.5 : 0.15,
      materialConfidenceLabel: unique.length > 0 ? "medium" : "low",
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

/* ── Serper (Google Shopping) provider ── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSerperProduct(p: any, query: string): ProductResult {
  const price = parsePrice(p.price);
  const materials = extractMaterials(p.title ?? "");
  const id = `serper-${Buffer.from(p.link ?? p.title ?? "").toString("base64").slice(0, 24)}`;

  return {
    id,
    title: p.title ?? "Product",
    brand: p.source ?? inferBrand(p.title ?? ""),
    retailer: p.source ?? "Online Store",
    price,
    currency: "USD",
    productUrl: p.link ?? "",
    imageUrl: p.imageUrl ?? p.thumbnailUrl ?? p.image ?? "",
    category: inferCategory(query),
    colors: [],
    sizes: [],
    description: p.title ?? "",
    listedMaterials: materials,
    inferredMaterials: materials,
    normalizedMaterials: makeMaterialBlend(materials),
    materialConfidence: materials.length > 0 ? 0.4 : 0.1,
    materialConfidenceLabel: confidenceLabel(materials),
    softnessScore: 0,
    stretchScore: 0,
    breathabilityScore: 0,
    opacityScore: 0,
    durabilityScore: 0,
    careInstructions: [],
    reviewSummary: p.rating ? `Rated ${p.rating}/5 (${p.ratingCount ?? "?"} reviews)` : undefined,
    source: "serper",
    createdAt: new Date().toISOString(),
  };
}

async function searchSerper(input: ProductSearchInput): Promise<ProductResult[]> {
  const env = getServerEnv();
  if (!env.serperApiKey) return [];

  const body: Record<string, unknown> = { q: input.query, gl: "us", num: 10 };
  if (input.maxPrice) body.tbs = `p_ord:p,price:1,ppr_max:${Math.round(input.maxPrice)}`;

  try {
    const res = await fetch("https://google.serper.dev/shopping", {
      method: "POST",
      headers: {
        "X-API-KEY": env.serperApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      console.error(`[Serper] HTTP ${res.status} for query "${input.query}":`, await res.text().catch(() => ""));
      return [];
    }
    const json = await res.json();
    const products: unknown[] = json?.shopping ?? [];
    if (products.length === 0) console.warn(`[Serper] 0 results for "${input.query}"`);
    return products.slice(0, 10).map((p) => mapSerperProduct(p, input.query));
  } catch (err) {
    console.error("[Serper] fetch error:", err);
    return [];
  }
}

/* ── Combined provider ── */

async function searchCombined(input: ProductSearchInput): Promise<ProductResult[]> {
  const [serperResults, amazonResults] = await Promise.all([
    searchSerper(input),
    searchAmazon(input),
  ]);

  // Serper first (broader fashion coverage), Amazon fills remaining slots
  const seen = new Set<string>();
  const merged: ProductResult[] = [];

  for (const p of [...serperResults, ...amazonResults]) {
    if (!seen.has(p.id) && p.price > 0) {
      seen.add(p.id);
      merged.push(p);
    }
  }

  return merged.slice(0, 16);
}

async function getByIdCombined(id: string): Promise<ProductResult | null> {
  if (id.startsWith("amazon-")) return getAmazonById(id);
  // Serper products can't be re-fetched by ID — return null and let the modal use cached data
  return null;
}

/* ── Claude enrichment wrapper ── */

function withEnrichment(
  searchFn: (input: ProductSearchInput) => Promise<ProductResult[]>,
  anthropicApiKey: string
): (input: ProductSearchInput) => Promise<ProductResult[]> {
  return async (input) => {
    const products = await searchFn(input);
    if (products.length === 0) return products;
    return enrichProducts(products, anthropicApiKey);
  };
}

/* ── provider factory ── */

export function getProductSearchProvider(): ProductSearchProvider {
  const env = getServerEnv();

  let searchFn: (input: ProductSearchInput) => Promise<ProductResult[]>;
  let getById: (id: string) => Promise<ProductResult | null>;

  if (env.rapidApiKey && env.serperApiKey) {
    searchFn = searchCombined;
    getById = getByIdCombined;
  } else if (env.serperApiKey) {
    searchFn = searchSerper;
    getById = async () => null;
  } else if (env.rapidApiKey) {
    searchFn = searchAmazon;
    getById = getAmazonById;
  } else {
    return { search: async () => [], getById: async () => null };
  }

  if (env.anthropicApiKey) {
    searchFn = withEnrichment(searchFn, env.anthropicApiKey);
  }

  return { search: searchFn, getById };
}
