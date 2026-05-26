import "server-only";

import { z } from "zod";

import type { ProductResult } from "@/lib/products/types";

const SHOBI_DATABASE_URL = "https://smellycat-deep.github.io/shobi_inspiration/database_complete.json";
const SHOBI_ESTIMATED_PRICE = 28;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

let shobiCache: { loadedAt: number; perfumes: ShobiPerfume[] } | null = null;

const OptionalStringSchema = z.string().nullable().optional();
const OptionalStringArraySchema = z.array(z.string()).nullable().optional();
const OptionalNumberSchema = z.number().nullable().optional();

const ShobiRatingSchema = z.object({
  sillage: OptionalNumberSchema,
  longevity: OptionalNumberSchema,
  scent: OptionalNumberSchema,
}).partial().nullable().optional();

const ShobiPerfumeSchema = z.object({
  category: OptionalStringSchema,
  inspiredBy: z.coerce.string().min(1),
  code: z.coerce.string().min(1),
  description: OptionalStringSchema,
  scentType: OptionalStringSchema,
  olfactoryFamily: OptionalStringSchema,
  notes: z.object({
    top: OptionalStringArraySchema,
    heart: OptionalStringArraySchema,
    base: OptionalStringArraySchema,
  }).partial().nullable().optional(),
  mainAccords: OptionalStringArraySchema,
  occasions: OptionalStringArraySchema,
  seasons: OptionalStringArraySchema,
  genderAffinity: OptionalStringSchema,
  userRatings: ShobiRatingSchema,
  reviewCount: OptionalNumberSchema,
  link: OptionalStringSchema,
}).passthrough();

const ShobiBrandSchema = z.object({
  brandInfo: z.object({
    name: z.string().min(1),
    description: OptionalStringSchema,
  }),
  perfumes: z.array(ShobiPerfumeSchema),
}).passthrough();

type ShobiPerfume = z.infer<typeof ShobiPerfumeSchema> & { brand: string };

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(edp|edt|eau|de|parfum|toilette|cologne|spray|pour|homme|perfume|fragrance)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textScore(needle: string, haystack: string): number {
  const a = normalize(needle);
  const b = normalize(haystack);
  if (!a || !b) return 0;
  if (a === b) return 100;
  if (b.includes(a) || a.includes(b)) return 92;

  const terms = a.split(" ").filter((term) => term.length > 2);
  if (terms.length === 0) return 0;
  const hits = terms.filter((term) => b.includes(term)).length;
  return Math.round((hits / terms.length) * 82);
}

async function fetchShobiPerfumes(): Promise<ShobiPerfume[]> {
  if (shobiCache && Date.now() - shobiCache.loadedAt < CACHE_TTL_MS) {
    return shobiCache.perfumes;
  }

  try {
    const response = await fetch(SHOBI_DATABASE_URL, {
      cache: "no-store",
    });
    if (!response.ok) return [];

    const raw = await response.json();
    const parsed = z.array(ShobiBrandSchema).safeParse(raw);
    if (!parsed.success) {
      console.warn("[Shobi] catalog validation failed", parsed.error.issues.slice(0, 3));
      return [];
    }

    const perfumes = parsed.data.flatMap((brandEntry) =>
      brandEntry.perfumes.map((perfume) => ({
        ...perfume,
        brand: brandEntry.brandInfo.name,
      }))
    );
    shobiCache = { loadedAt: Date.now(), perfumes };
    return perfumes;
  } catch {
    return [];
  }
}

function shobiUrl(code: string): string {
  return `https://leparfum.com.gr/en/module/iqitsearch/searchiqit?s=${encodeURIComponent(code)}`;
}

function shobiPerfumeToProduct(perfume: ShobiPerfume): ProductResult {
  const ratings = perfume.userRatings ?? {};
  const accords = (perfume.mainAccords ?? []).slice(0, 6);
  const notes = [
    ...(perfume.notes?.top ?? []),
    ...(perfume.notes?.heart ?? []),
    ...(perfume.notes?.base ?? []),
  ].slice(0, 10);

  return {
    id: `shobi-${normalize(perfume.code).replace(/\s+/g, "-")}`,
    title: `Shobi inspiration: ${perfume.brand} ${perfume.inspiredBy}`,
    brand: "Shobi",
    retailer: "Shobi / Le Parfum",
    price: SHOBI_ESTIMATED_PRICE,
    currency: "USD",
    productUrl: shobiUrl(perfume.code),
    imageUrl: `https://placehold.co/600x800/png?text=${encodeURIComponent(perfume.code)}`,
    category: "fragrance",
    colors: [],
    sizes: ["30ml", "50ml", "100ml"],
    description: [
      perfume.description,
      accords.length > 0 ? `Main accords: ${accords.join(", ")}.` : "",
      notes.length > 0 ? `Notes include ${notes.join(", ")}.` : "",
    ].filter(Boolean).join(" "),
    listedMaterials: [],
    inferredMaterials: [],
    normalizedMaterials: [],
    materialConfidence: 0,
    materialConfidenceLabel: "low",
    softnessScore: 0,
    stretchScore: 0,
    breathabilityScore: 0,
    opacityScore: 0,
    durabilityScore: ratings.longevity ? Math.min(100, Math.round(ratings.longevity * 10)) : 60,
    careInstructions: [],
    reviewSummary: `Shobi code ${perfume.code}; inspired by ${perfume.brand} ${perfume.inspiredBy}; scent rating ${ratings.scent ?? "unknown"}/10; longevity ${ratings.longevity ?? "unknown"}/10; sillage ${ratings.sillage ?? "unknown"}/10; accords ${accords.join(", ") || "unknown"}.`,
    source: "manual",
    createdAt: "2026-05-25T00:00:00.000Z",
  };
}

export async function searchShobiInspirations(
  sourceName: string,
  maxPrice?: number
): Promise<ProductResult[]> {
  if (SHOBI_ESTIMATED_PRICE > (maxPrice ?? Number.POSITIVE_INFINITY)) return [];

  const perfumes = await fetchShobiPerfumes();
  return perfumes
    .map((perfume) => ({
      perfume,
      score: Math.max(
        textScore(sourceName, `${perfume.brand} ${perfume.inspiredBy}`),
        textScore(sourceName, perfume.inspiredBy),
        textScore(sourceName, `${perfume.code} ${perfume.description ?? ""} ${(perfume.mainAccords ?? []).join(" ")}`)
      ),
    }))
    .filter(({ score }) => score >= 52)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ perfume }) => shobiPerfumeToProduct(perfume));
}
