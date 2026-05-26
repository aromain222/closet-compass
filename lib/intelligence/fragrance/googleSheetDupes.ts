import "server-only";

import type { ProductResult } from "@/lib/products/types";

const GOOGLE_SHEET_ID = "129rfB5TjnwhgJBiBuo5W0n1nXDhCC-Zmi8j9UcFXR68";
const GOOGLE_SHEET_GID = "0";
const GOOGLE_SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=${GOOGLE_SHEET_GID}`;
const CACHE_TTL_MS = 60 * 60 * 1000;

interface SheetDupeEntry {
  clone: string;
  brand: string;
  original: string;
  fidelity?: number;
  persistenceHours?: number;
  projection?: number;
  price?: number;
  notes?: string;
}

let sheetCache: { loadedAt: number; entries: SheetDupeEntry[] } | null = null;

const BRAND_PRICE_ESTIMATES: Record<string, number> = {
  Afnan: 45,
  Armaf: 42,
  Rayhaan: 38,
  Lattafa: 35,
  "Maison Alhambra": 32,
  "French Avenue": 50,
  Ajmal: 42,
  "Fragrance World": 45,
  "Al Haramain": 55,
  Rasasi: 42,
  Dossier: 49,
  Oakcha: 50,
  Zara: 35,
  Shobi: 28,
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(edp|edt|eau|de|parfum|toilette|cologne|spray|pour|homme|style|vibe|twist|clone|dupe|inspired)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textScore(needle: string, haystack: string): number {
  const a = normalize(needle);
  const b = normalize(haystack);
  if (!a || !b) return 0;
  if (a === b) return 100;
  if (b.includes(a) || a.includes(b)) return 90;

  const terms = a.split(" ").filter((term) => term.length > 2);
  if (terms.length === 0) return 0;
  const hits = terms.filter((term) => b.includes(term)).length;
  return Math.round((hits / terms.length) * 80);
}

function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    const next = csv[i + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.trim().length > 0)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value.trim().length > 0)) rows.push(row);
  return rows;
}

function headerKey(value: string): string {
  return normalize(value).replace(/\s+/g, "");
}

function firstPresent(row: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value?.trim()) return value.trim();
  }
  return "";
}

function parseNumber(value: string): number | undefined {
  const match = value.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : undefined;
}

function parseHours(value: string): number | undefined {
  return parseNumber(value);
}

function normalizeFidelity(value: string): number | undefined {
  const parsed = parseNumber(value);
  if (!parsed) return undefined;
  return parsed <= 1 ? Math.round(parsed * 100) : Math.min(100, parsed);
}

function rowsToEntries(rows: string[][]): SheetDupeEntry[] {
  const [headerRow, ...dataRows] = rows;
  if (!headerRow) return [];

  const headers = headerRow.map(headerKey);
  return dataRows
    .map((cells): SheetDupeEntry | null => {
      const row = Object.fromEntries(headers.map((header, index) => [header, cells[index]?.trim() ?? ""]));
      const clone = firstPresent(row, ["clone", "dupe", "alternative", "perfume", "name", "fragrance"]);
      const brand = firstPresent(row, ["brand", "clonebrand", "dupebrand", "house"]);
      const original = firstPresent(row, ["original", "inspiredby", "inspiration", "source", "designer", "og"]);
      const fidelity = normalizeFidelity(firstPresent(row, ["fidelity", "match", "similarity", "accuracy"]));
      const persistenceHours = parseHours(firstPresent(row, ["persistence", "longevity", "lasting", "hours"]));
      const projection = parseNumber(firstPresent(row, ["projection", "sillage", "performance"]));
      const price = parseNumber(firstPresent(row, ["price", "cost", "estimatedprice"]));
      const notes = firstPresent(row, ["notes", "comments", "description", "take"]);

      if (!clone || !brand || !original) return null;
      return { clone, brand, original, fidelity, persistenceHours, projection, price, notes };
    })
    .filter((entry): entry is SheetDupeEntry => Boolean(entry));
}

async function fetchSheetEntries(): Promise<SheetDupeEntry[]> {
  if (sheetCache && Date.now() - sheetCache.loadedAt < CACHE_TTL_MS) {
    return sheetCache.entries;
  }

  try {
    const response = await fetch(GOOGLE_SHEET_CSV_URL, { cache: "no-store" });
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || !contentType.includes("text/csv")) {
      console.warn("[GoogleSheetDupes] Sheet is not publicly CSV-exportable yet.");
      return [];
    }

    const csv = await response.text();
    const entries = rowsToEntries(parseCsv(csv));
    sheetCache = { loadedAt: Date.now(), entries };
    return entries;
  } catch {
    return [];
  }
}

function estimatedPrice(entry: SheetDupeEntry): number {
  return entry.price ?? BRAND_PRICE_ESTIMATES[entry.brand] ?? 45;
}

function sheetEntryToProduct(entry: SheetDupeEntry): ProductResult {
  const fidelity = entry.fidelity ?? 80;
  const persistenceHours = entry.persistenceHours ?? 7;
  const projection = entry.projection ?? 7;
  const price = estimatedPrice(entry);

  return {
    id: `sheet-dupe-${normalize(`${entry.brand}-${entry.clone}`).replace(/\s+/g, "-")}`,
    title: `${entry.brand} ${entry.clone}`,
    brand: entry.brand,
    retailer: "Google Sheets dupe intelligence",
    price,
    currency: "USD",
    productUrl: `https://www.google.com/search?q=${encodeURIComponent(`${entry.brand} ${entry.clone} fragrance`)}`,
    imageUrl: `https://placehold.co/600x800/png?text=${encodeURIComponent(entry.clone)}`,
    category: "fragrance",
    colors: [],
    sizes: ["full bottle"],
    description: [
      `${entry.clone} is listed in the shared dupe sheet as an alternative to ${entry.original}.`,
      entry.notes,
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
    durabilityScore: Math.min(100, Math.round(persistenceHours * 10)),
    careInstructions: [],
    reviewSummary: `${fidelity}% fidelity to ${entry.original}; ${persistenceHours}h persistence; projection ${projection}/10.${entry.notes ? ` Sheet note: ${entry.notes}` : ""}`,
    source: "manual",
    createdAt: "2026-05-25T00:00:00.000Z",
  };
}

export async function searchGoogleSheetFragranceDupes(
  sourceName: string,
  maxPrice?: number
): Promise<ProductResult[]> {
  const entries = await fetchSheetEntries();
  return entries
    .map((entry) => ({
      entry,
      score: Math.max(
        textScore(sourceName, entry.original),
        textScore(sourceName, `${entry.brand} ${entry.clone}`),
        textScore(sourceName, entry.notes ?? "")
      ),
    }))
    .filter(({ entry, score }) => score >= 45 && estimatedPrice(entry) <= (maxPrice ?? Number.POSITIVE_INFINITY))
    .sort((a, b) => b.score - a.score || (b.entry.fidelity ?? 0) - (a.entry.fidelity ?? 0))
    .slice(0, 12)
    .map(({ entry }) => sheetEntryToProduct(entry));
}
