import { NextResponse } from "next/server";

import { SearchRequestSchema } from "@/lib/agents/schemas";
import { runSearchAgent } from "@/lib/agents/searchAgent";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { jsonError, parseJsonBody } from "@/lib/utils/errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const input = SearchRequestSchema.parse(await parseJsonBody(request));
    const response = await runSearchAgent(input);

    const supabase = getSupabaseServiceClient();
    if (supabase) {
      // Persistence is best-effort so search remains usable during local setup.
      const { data } = await supabase
        .from("product_searches")
        .insert({
          query: input.query,
          filters: response.filtersApplied,
          agent_summary: response.agentSummary,
          material_notes: response.materialNotes
        })
        .select("id")
        .single();

      if (data?.id && response.products.length > 0) {
        await supabase.from("product_results").insert(
          response.products.map((product) => ({
            search_id: data.id,
            external_product_id: product.id,
            product
          }))
        );
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    return jsonError(error);
  }
}
