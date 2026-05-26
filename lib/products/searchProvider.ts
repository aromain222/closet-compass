import type { ProductResult, ProductSearchInput } from "@/lib/products/types";
import { enrichProducts } from "@/lib/materials/enrichMaterials";
import {
  findCuratedFragranceClones,
  fragranceCloneToProduct,
} from "@/lib/intelligence/fragrance/cloneIntelligence";
import { searchShobiInspirations } from "@/lib/intelligence/fragrance/shobiInspiration";
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

function mergeUniqueProducts(products: ProductResult[]): ProductResult[] {
  const seen = new Set<string>();
  const merged: ProductResult[] = [];

  for (const product of products) {
    if (!seen.has(product.id)) {
      seen.add(product.id);
      merged.push(product);
    }
  }

  return merged;
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

/* ── Reddit community scraper ── */

const SUBREDDITS: Record<string, string[]> = {
  fragrance: ["fragrance", "fragranceclones", "maleolefaction", "CologneClones", "FemaleFragrance", "scentsamples", "DesiFragranceClones"],
  clothing:  ["femalefashionadvice", "malefashionadvice", "frugalmalefashion", "frugalfemalefashion", "findfashion", "fashionadvice", "RepLadies"],
  bag:       ["handbags", "RepLadies", "femalefashionadvice", "findfashion", "luxuryrepsforsale"],
  jewelry:   ["jewelry", "jewelrymaking", "femalefashionadvice", "findfashion", "moissanite"],
};

async function scrapeRedditSnippets(
  sourceName: string,
  subreddits: string[]
): Promise<Array<{ title?: string; snippet?: string }>> {
  const query = encodeURIComponent(`${sourceName} dupe alternative cheaper`);
  const snippets: Array<{ title?: string; snippet?: string }> = [];

  await Promise.allSettled(
    subreddits.map(async (sub) => {
      try {
        const url = `https://www.reddit.com/r/${sub}/search.json?q=${query}&sort=relevance&restrict_sr=1&limit=6&t=all`;
        const res = await fetch(url, {
          headers: { "User-Agent": "MaterialMuse/1.0 (fashion dupe finder)" },
          next: { revalidate: 3600 },
        });
        if (!res.ok) return;
        const json = await res.json();
        const posts: unknown[] = json?.data?.children ?? [];
        for (const child of posts) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const d = (child as any).data;
          if (!d) continue;
          snippets.push({
            title: `[r/${sub}] ${d.title ?? ""}`,
            snippet: d.selftext ? d.selftext.slice(0, 400) : d.title ?? "",
          });
        }
      } catch { /* subreddit unavailable — skip */ }
    })
  );

  return snippets;
}

/* ── Fragrance community dupe search ── */

// Middle Eastern + popular western dupe brands surfaced by community searches
const ME_BRANDS = "Lattafa, Rasasi, Afnan, Rayhaan, Armaf, Ajmal, Al Haramain, Swiss Arabian, Ard Al Zaafaran, Fragrance World, Arabian Oud, Asdaaf, Maison Alhambra, Zimaya, Surrati";
const WESTERN_DUPE_BRANDS = "Dossier, Oakcha, ALT. Fragrances, French Avenue, Jo Milano Paris, Twist Heritage, Club de Nuit, Inspired by Glamour, Zara, GENERIC Impression";

async function extractDupeNames(
  snippets: Array<{ title?: string; snippet?: string }>,
  sourceName: string,
  category: string,
  apiKey: string
): Promise<string[]> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey });
  const context = snippets.slice(0, 10).map((s) => `${s.title ?? ""}: ${s.snippet ?? ""}`).join("\n");
  const hint = category === "fragrance"
    ? `Prefer Middle Eastern brands (${ME_BRANDS}) and popular western dupe brands (${WESTERN_DUPE_BRANDS}) when they appear. Prioritize ME brands above all.`
    : `Focus on affordable alternatives with similar style and materials.`;
  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: `From these community posts about ${category} dupes for "${sourceName}", extract specific product names (brand + product name) recommended as dupes or cheaper alternatives. ${hint} Return a JSON array of strings, max 5 names. Return [] if none found.\n\n${context}`,
      }],
    });
    const text = msg.content[0]?.type === "text" ? msg.content[0].text : "";
    const match = text.match(/\[[\s\S]*?\]/);
    return match ? (JSON.parse(match[0]) as string[]) : [];
  } catch {
    return [];
  }
}

export async function searchFragranceCommunityDupes(
  sourceName: string,
  maxPrice: number | undefined
): Promise<ProductResult[]> {
  const env = getServerEnv();
  const curatedResults = findCuratedFragranceClones(sourceName, maxPrice).map(fragranceCloneToProduct);
  const shobiResults = await searchShobiInspirations(sourceName, maxPrice);
  const offlineResults = mergeUniqueProducts([...curatedResults, ...shobiResults]);
  if (offlineResults.length > 0) return offlineResults.slice(0, 10);
  if (!env.serperApiKey) return [];

  const webQuery = `best "${sourceName}" dupe clone alternative fragrance`;

  // Step 1: Web search + Reddit in parallel to find community-recommended dupe names
  let dupeNames: string[] = [];
  try {
    const [webRes, redditSnippets] = await Promise.all([
      fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: { "X-API-KEY": env.serperApiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ q: webQuery, gl: "us", num: 8 }),
      }),
      scrapeRedditSnippets(sourceName, SUBREDDITS.fragrance),
    ]);

    const organic: Array<{ title?: string; snippet?: string }> = webRes.ok
      ? ((await webRes.json()).organic ?? [])
      : [];

    const allSnippets = [...redditSnippets, ...organic];
    if (env.anthropicApiKey && allSnippets.length > 0) {
      dupeNames = await extractDupeNames(allSnippets, sourceName, "fragrance", env.anthropicApiKey);
    }
  } catch (err) {
    console.error("[Fragrance] community search error:", err);
  }

  // Fallback: broad dupe brand shopping search
  if (dupeNames.length === 0) {
    return searchSerper({ query: `Lattafa OR Rasasi OR Dossier OR Oakcha OR Armaf "${sourceName}" dupe`, maxPrice });
  }

  // Step 2: Search shopping for each community-recommended dupe
  const results: ProductResult[] = [];
  const seen = new Set<string>();
  for (const name of dupeNames.slice(0, 4)) {
    try {
      const hits = await searchSerper({ query: name, maxPrice });
      for (const h of hits) {
        if (!seen.has(h.id) && h.price > 0) { seen.add(h.id); results.push(h); }
      }
    } catch { /* skip */ }
  }
  return results.slice(0, 10);
}

export async function searchCategoryDupes(
  sourceName: string,
  category: "clothing" | "bag" | "jewelry",
  maxPrice: number | undefined
): Promise<ProductResult[]> {
  const env = getServerEnv();
  const subs = SUBREDDITS[category] ?? SUBREDDITS.clothing;
  const redditSnippets = await scrapeRedditSnippets(sourceName, subs);
  if (redditSnippets.length === 0 || !env.anthropicApiKey) return [];

  const dupeNames = await extractDupeNames(redditSnippets, sourceName, category, env.anthropicApiKey);
  if (dupeNames.length === 0) return [];

  const results: ProductResult[] = [];
  const seen = new Set<string>();
  for (const name of dupeNames.slice(0, 5)) {
    try {
      const hits = await searchSerper({ query: name, maxPrice });
      for (const h of hits) {
        if (!seen.has(h.id) && h.price > 0) { seen.add(h.id); results.push(h); }
      }
    } catch { /* skip */ }
  }
  return results.slice(0, 10);
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
