import type { MaterialBlendItem, MaterialConfidenceLabel, NormalizedFiber } from "@/lib/products/types";

const FIBER_ALIASES: Record<string, NormalizedFiber> = {
  cotton: "cotton",
  "organic cotton": "organic cotton",
  linen: "linen",
  flax: "linen",
  silk: "silk",
  wool: "wool",
  "merino wool": "wool",
  cashmere: "cashmere",
  alpaca: "alpaca",
  modal: "modal",
  tencel: "lyocell",
  lyocell: "lyocell",
  cupro: "cupro",
  acetate: "acetate",
  ramie: "ramie",
  viscose: "viscose",
  rayon: "rayon",
  polyester: "polyester",
  "recycled polyester": "recycled polyester",
  nylon: "nylon",
  polyamide: "nylon",
  elastane: "elastane",
  spandex: "spandex",
  acrylic: "acrylic",
  leather: "leather",
  suede: "suede"
};

function sortedAliases(): Array<[string, NormalizedFiber]> {
  return Object.entries(FIBER_ALIASES).sort((a, b) => b[0].length - a[0].length);
}

function cleanMaterialText(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b(shell|body|lining|liner|trim|contrast|fabric|materials?|composition|outer)\b/g, " ")
    .replace(/[^a-z\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeFiberName(value: string): NormalizedFiber {
  const normalized = cleanMaterialText(value);

  for (const [alias, fiber] of sortedAliases()) {
    if (normalized.includes(alias)) {
      return fiber;
    }
  }

  return normalized || "unknown";
}

function extractFibersFromUnstructuredText(value: string): MaterialBlendItem[] {
  const normalized = cleanMaterialText(value);
  const found = new Set<NormalizedFiber>();

  for (const [alias, fiber] of sortedAliases()) {
    if (normalized.includes(alias)) {
      found.add(fiber);
    }
  }

  return Array.from(found).map((fiber) => ({ fiber, percentage: null }));
}

export function extractMaterialPercentagesFromText(rawText: string): MaterialBlendItem[] {
  const explicitMatches = Array.from(
    rawText.matchAll(/(\d{1,3})(?:\.\d+)?\s*%\s*([a-zA-Z][a-zA-Z\s-]{1,40})/g)
  );

  if (explicitMatches.length > 0) {
    return dedupeBlend(
      explicitMatches
        .map((match) => ({
          fiber: normalizeFiberName(match[2]),
          percentage: Math.min(100, Number(match[1]))
        }))
        .filter((item) => item.fiber !== "unknown")
    );
  }

  const chunks = rawText
    .split(/[,;/+]| and /i)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return dedupeBlend(
    chunks
      .flatMap((chunk) => extractFibersFromUnstructuredText(chunk))
      .filter((item) => item.fiber !== "unknown")
  );
}

export function normalizeMaterialBlend(rawText: string): MaterialBlendItem[] {
  return extractMaterialPercentagesFromText(rawText);
}

export function dedupeBlend(blend: MaterialBlendItem[]): MaterialBlendItem[] {
  const byFiber = new Map<string, MaterialBlendItem>();

  for (const item of blend) {
    const existing = byFiber.get(item.fiber);
    if (!existing) {
      byFiber.set(item.fiber, item);
      continue;
    }

    byFiber.set(item.fiber, {
      fiber: item.fiber,
      percentage:
        existing.percentage === null && item.percentage === null
          ? null
          : (existing.percentage ?? 0) + (item.percentage ?? 0)
    });
  }

  return Array.from(byFiber.values()).sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0));
}

export function blendToPercentages(blend: MaterialBlendItem[]): Record<string, number> {
  return blend.reduce<Record<string, number>>((acc, item) => {
    if (item.percentage !== null) {
      acc[item.fiber] = item.percentage;
    }
    return acc;
  }, {});
}

export function getMaterialConfidenceLabel(rawListedMaterials: string[], inferredMaterials: string[]): MaterialConfidenceLabel {
  const listedText = rawListedMaterials.join(" ");
  if (/\d{1,3}(?:\.\d+)?\s*%/.test(listedText)) {
    return "high";
  }

  if (rawListedMaterials.length > 0 || inferredMaterials.length > 0) {
    return "medium";
  }

  return "low";
}
