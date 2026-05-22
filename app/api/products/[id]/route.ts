import { NextResponse } from "next/server";

import { MaterialProfileSchema, ProductResultSchema } from "@/lib/agents/schemas";
import { buildMaterialProfile } from "@/lib/materials/extractMaterials";
import { getProductSearchProvider } from "@/lib/products/searchProvider";
import { ApiError, jsonError } from "@/lib/utils/errors";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const provider = getProductSearchProvider();
    const product = await provider.getById(params.id);

    if (!product) {
      throw new ApiError(404, "product_not_found", "Could not find that product.");
    }

    return NextResponse.json({
      product: ProductResultSchema.parse(product),
      materialProfile: MaterialProfileSchema.parse(buildMaterialProfile(product))
    });
  } catch (error) {
    return jsonError(error);
  }
}
