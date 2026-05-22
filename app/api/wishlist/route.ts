import { NextResponse } from "next/server";

import { WishlistCreateSchema, WishlistDeleteSchema } from "@/lib/agents/schemas";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { ApiError, jsonError, parseJsonBody } from "@/lib/utils/errors";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const userId = new URL(request.url).searchParams.get("userId");
    const parsed = WishlistCreateSchema.shape.userId.safeParse(userId);
    if (!parsed.success) {
      throw new ApiError(400, "validation_error", "A valid userId query parameter is required.");
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return NextResponse.json({ mode: "mock", items: [] });
    }

    const { data, error } = await supabase
      .from("wishlist_items")
      .select("*")
      .eq("user_id", parsed.data)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ items: data ?? [] });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = WishlistCreateSchema.parse(await parseJsonBody(request));
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return NextResponse.json(
        {
          mode: "mock",
          item: {
            id: crypto.randomUUID(),
            userId: input.userId,
            product: input.product,
            priority: input.priority,
            targetPrice: input.targetPrice,
            createdAt: new Date().toISOString()
          }
        },
        { status: 201 }
      );
    }

    const { data, error } = await supabase
      .from("wishlist_items")
      .upsert(
        {
          user_id: input.userId,
          external_product_id: input.product.id,
          product: input.product,
          priority: input.priority,
          target_price: input.targetPrice
        },
        { onConflict: "user_id,external_product_id" }
      )
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ item: data }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const input = WishlistDeleteSchema.parse(await parseJsonBody(request));
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return NextResponse.json({ mode: "mock", deleted: true });
    }

    let query = supabase.from("wishlist_items").delete().eq("user_id", input.userId);
    query = input.wishlistItemId
      ? query.eq("id", input.wishlistItemId)
      : query.eq("external_product_id", input.productId as string);

    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({ deleted: true });
  } catch (error) {
    return jsonError(error);
  }
}
