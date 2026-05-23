import Anthropic from "@anthropic-ai/sdk";
import type { MaterialBlendItem, MaterialConfidenceLabel, ProductResult } from "@/lib/products/types";

interface EnrichedMaterials {
  fibers: MaterialBlendItem[];
  softnessScore: number;
  breathabilityScore: number;
  opacityScore: number;
  durabilityScore: number;
  stretchScore: number;
  careInstructions: string[];
  materialConfidence: number;
  materialConfidenceLabel: MaterialConfidenceLabel;
}

const SYSTEM_PROMPT = `You are a fabric and textile expert. Given a clothing product title and description, extract material composition and quality attributes. Return ONLY valid JSON, no explanation.`;

function buildUserPrompt(product: ProductResult): string {
  const text = [product.title, product.description].filter(Boolean).join("\n");
  return `Product: ${text}

Return JSON:
{
  "fibers": [{"fiber": "cotton", "percentage": 95}, {"fiber": "elastane", "percentage": 5}],
  "softnessScore": 0-100,
  "breathabilityScore": 0-100,
  "opacityScore": 0-100,
  "durabilityScore": 0-100,
  "stretchScore": 0-100,
  "careInstructions": ["machine wash cold"],
  "materialConfidence": 0.0-1.0
}

Rules:
- softnessScore: silk/cashmere/modal=85-95, cotton=60-75, linen=55-65, polyester=40-55, acrylic=30-45
- breathabilityScore: linen/cotton=80-90, silk=75-85, modal=70-80, polyester=30-50, nylon=25-45
- opacityScore: denim/wool=85-95, cotton=60-80, silk=40-65, sheer/chiffon=15-35
- durabilityScore: denim/nylon=85-95, cotton=65-75, silk=45-60, linen=55-70, viscose=40-55
- stretchScore: elastane/spandex blends=70-95, knits=50-70, woven non-stretch=5-20
- materialConfidence: 0.9 if exact percentages found, 0.6 if fibers named without %, 0.2 if inferred only
- If no material info at all: return all scores as 0 and confidence 0.1`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseEnrichmentResponse(raw: string): EnrichedMaterials | null {
  try {
    const json = JSON.parse(raw.replace(/```json\n?|```/g, "").trim());
    const fibers: MaterialBlendItem[] = (json.fibers ?? []).map((f: { fiber: string; percentage: number | null }) => ({
      fiber: String(f.fiber).toLowerCase(),
      percentage: typeof f.percentage === "number" ? f.percentage : null,
    }));

    const confidence: number = Math.min(1, Math.max(0, Number(json.materialConfidence ?? 0.1)));
    const label: MaterialConfidenceLabel =
      confidence >= 0.75 ? "high" : confidence >= 0.45 ? "medium" : "low";

    return {
      fibers,
      softnessScore: Math.round(Math.min(100, Math.max(0, Number(json.softnessScore ?? 0)))),
      breathabilityScore: Math.round(Math.min(100, Math.max(0, Number(json.breathabilityScore ?? 0)))),
      opacityScore: Math.round(Math.min(100, Math.max(0, Number(json.opacityScore ?? 0)))),
      durabilityScore: Math.round(Math.min(100, Math.max(0, Number(json.durabilityScore ?? 0)))),
      stretchScore: Math.round(Math.min(100, Math.max(0, Number(json.stretchScore ?? 0)))),
      careInstructions: (json.careInstructions ?? []).map(String),
      materialConfidence: confidence,
      materialConfidenceLabel: label,
    };
  } catch {
    return null;
  }
}

async function enrichOne(client: Anthropic, product: ProductResult): Promise<ProductResult> {
  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(product) }],
    });

    const raw = msg.content[0]?.type === "text" ? msg.content[0].text : "";
    const enriched = parseEnrichmentResponse(raw);
    if (!enriched) return product;

    return {
      ...product,
      normalizedMaterials: enriched.fibers,
      listedMaterials: enriched.fibers.map((f) => f.fiber),
      inferredMaterials: enriched.fibers.map((f) => f.fiber),
      softnessScore: enriched.softnessScore,
      breathabilityScore: enriched.breathabilityScore,
      opacityScore: enriched.opacityScore,
      durabilityScore: enriched.durabilityScore,
      stretchScore: enriched.stretchScore,
      careInstructions: enriched.careInstructions.length > 0
        ? enriched.careInstructions
        : product.careInstructions,
      materialConfidence: enriched.materialConfidence,
      materialConfidenceLabel: enriched.materialConfidenceLabel,
    };
  } catch {
    return product;
  }
}

export async function enrichProducts(
  products: ProductResult[],
  apiKey: string
): Promise<ProductResult[]> {
  const client = new Anthropic({ apiKey });
  // Run in parallel, max 8 concurrent to stay within rate limits
  const chunks: ProductResult[][] = [];
  for (let i = 0; i < products.length; i += 8) {
    chunks.push(products.slice(i, i + 8));
  }
  const results: ProductResult[] = [];
  for (const chunk of chunks) {
    const enriched = await Promise.all(chunk.map((p) => enrichOne(client, p)));
    results.push(...enriched);
  }
  return results;
}
