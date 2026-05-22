import { NextResponse } from "next/server";

import { buildMaterialProfile } from "@/lib/materials/extractMaterials";
import { SaveProductRequestSchema, SavedProductsQuerySchema } from "@/lib/agents/schemas";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { jsonError, parseJsonBody } from "@/lib/utils/errors";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const input = SavedProductsQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries())
    );
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return NextResponse.json({ mode: "mock", savedProducts: [] });
    }

    const { data, error } = await supabase
      .from("saved_products")
      .select("*")
      .eq("user_id", input.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;

    return NextResponse.json({ savedProducts: data ?? [] });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = SaveProductRequestSchema.parse(await parseJsonBody(request));
    const materialProfile = buildMaterialProfile(input.product);
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return NextResponse.json({
        mode: "mock",
        savedProduct: {
          id: crypto.randomUUID(),
          userId: input.userId,
          product: input.product,
          notes: input.notes,
          createdAt: new Date().toISOString()
        },
        materialProfile
      });
    }

    const { data, error } = await supabase
      .from("saved_products")
      .upsert(
        {
          user_id: input.userId,
          external_product_id: input.product.id,
          product: input.product,
          notes: input.notes
        },
        { onConflict: "user_id,external_product_id" }
      )
      .select("*")
      .single();

    if (error) throw error;

    await supabase.from("material_profiles").upsert(
      {
        product_id: input.product.id,
        raw_material_text: materialProfile.rawMaterialText,
        fibers: materialProfile.fibers,
        blend_percentages: materialProfile.blendPercentages,
        normalized_blend: materialProfile.normalizedBlend,
        fabric_feel: materialProfile.fabricFeel,
        stretch_level: materialProfile.stretchLevel,
        weight: materialProfile.weight,
        opacity: materialProfile.opacity,
        breathability: materialProfile.breathability,
        performance_tags: materialProfile.performanceTags,
        confidence: materialProfile.confidence,
        confidence_label: materialProfile.confidenceLabel,
        explanation: materialProfile.explanation
      },
      { onConflict: "product_id" }
    );

    return NextResponse.json({ savedProduct: data, materialProfile }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
