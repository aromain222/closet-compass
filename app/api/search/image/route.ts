import { NextResponse } from "next/server";

import { ImageSearchRequestSchema } from "@/lib/agents/schemas";
import { runSearchAgent } from "@/lib/agents/searchAgent";
import { analyzeMockImageSearch } from "@/lib/products/imageSearch";
import { jsonError, parseJsonBody } from "@/lib/utils/errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const input = ImageSearchRequestSchema.parse(await parseJsonBody(request));
    const imageSearch = analyzeMockImageSearch(input);

    const response = await runSearchAgent({
      query: imageSearch.inferredQuery,
      maxPrice: input.maxPrice,
      preferredMaterials: input.preferredMaterials,
      avoidMaterials: input.avoidMaterials
    });

    return NextResponse.json({
      ...response,
      imageSearch
    });
  } catch (error) {
    return jsonError(error);
  }
}
