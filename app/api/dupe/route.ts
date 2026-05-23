import { NextResponse } from "next/server";

import { DupeComparisonSchema, DupeRequestSchema } from "@/lib/agents/schemas";
import { runDupeAgent } from "@/lib/agents/dupeAgent";
import { getProductSearchProvider } from "@/lib/products/searchProvider";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { ApiError, jsonError, parseJsonBody } from "@/lib/utils/errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const input = DupeRequestSchema.parse(await parseJsonBody(request));
    const provider = getProductSearchProvider();
    const sourceProduct = input.sourceProduct ?? (input.productId ? await provider.getById(input.productId) : null);

    if (!sourceProduct) {
      throw new ApiError(404, "product_not_found", "Could not find the source product.");
    }

    const comparisons = await runDupeAgent({
      sourceProduct,
      maxPrice: input.maxPrice,
      preferredMaterials: input.preferredMaterials,
      avoidMaterials: input.avoidMaterials,
      limit: input.limit
    });
    const typedComparisons = DupeComparisonSchema.array().parse(comparisons);

    const supabase = getSupabaseServiceClient();
    if (supabase && typedComparisons.length > 0) {
      await supabase.from("dupe_comparisons").insert(
        typedComparisons.map((comparison) => ({
          source_product_id: comparison.sourceProduct.id,
          alternative_product_id: comparison.alternativeProduct.id,
          source_product: comparison.sourceProduct,
          alternative_product: comparison.alternativeProduct,
          score: comparison.score,
          material_explanation: comparison.score.materialExplanation
        }))
      );
    }

    return NextResponse.json({
      sourceProduct,
      alternatives: typedComparisons,
      agentSummary:
        typedComparisons.length > 0
          ? `Ranked ${typedComparisons.length} cheaper alternative${typedComparisons.length === 1 ? "" : "s"} with material match weighted most heavily.`
          : "No cheaper alternatives found — this may already be a budget-friendly pick."
    });
  } catch (error) {
    return jsonError(error);
  }
}
