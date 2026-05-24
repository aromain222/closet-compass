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

    const { comparisons, category } = await runDupeAgent({
      sourceProduct,
      maxPrice: input.maxPrice,
      preferredMaterials: input.preferredMaterials,
      avoidMaterials: input.avoidMaterials,
      limit: input.limit,
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

    const n = typedComparisons.length;
    const summaryByCategory: Record<string, string> = {
      fragrance: n > 0
        ? `Found ${n} cheaper fragrance alternative${n === 1 ? "" : "s"} — ranked by price savings.`
        : "No cheaper fragrance alternatives found. Try a different budget range.",
      jewelry: n > 0
        ? `Found ${n} style-matched alternative${n === 1 ? "" : "s"} — ranked by visual similarity and savings. Material not factored.`
        : "No cheaper alternatives found — try a different style or budget.",
      bag: n > 0
        ? `Found ${n} bag alternative${n === 1 ? "" : "s"} — ranked by style match and material quality.`
        : "No cheaper bag alternatives found. Try adjusting the max price.",
      clothing: n > 0
        ? `Ranked ${n} cheaper alternative${n === 1 ? "" : "s"} with material match weighted most heavily.`
        : "No cheaper alternatives found — this may already be a budget-friendly pick.",
    };

    return NextResponse.json({
      sourceProduct,
      alternatives: typedComparisons,
      agentSummary: summaryByCategory[category] ?? summaryByCategory.clothing,
    });
  } catch (error) {
    return jsonError(error);
  }
}
