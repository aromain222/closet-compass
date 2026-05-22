import { NextResponse } from "next/server";

import { PriceTrackingQuerySchema, TrackProductRequestSchema } from "@/lib/agents/schemas";
import { createMockPriceHistory, summarizePriceTracking } from "@/lib/products/priceTracking";
import { getProductSearchProvider } from "@/lib/products/searchProvider";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { ApiError } from "@/lib/utils/errors";
import { jsonError, parseJsonBody } from "@/lib/utils/errors";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const input = PriceTrackingQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries())
    );
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      const product = await getProductSearchProvider().getById(input.productId);
      if (!product) {
        throw new ApiError(404, "product_not_found", "Could not find tracked product.");
      }
      const history = createMockPriceHistory(product);
      return NextResponse.json({
        mode: "mock",
        productId: input.productId,
        priceHistory: history,
        trackingSummary: summarizePriceTracking({ history })
      });
    }

    const { data: history, error } = await supabase
      .from("price_history")
      .select("*")
      .eq("external_product_id", input.productId)
      .order("observed_at", { ascending: true });
    if (error) throw error;

    let targetPrice: number | null = null;
    if (input.userId) {
      const { data } = await supabase
        .from("wishlist_items")
        .select("target_price")
        .eq("user_id", input.userId)
        .eq("external_product_id", input.productId)
        .maybeSingle();
      targetPrice = data?.target_price ? Number(data.target_price) : null;
    }

    const priceHistory = (history ?? []).map((point) => ({
      id: point.id,
      productId: point.external_product_id,
      retailer: point.retailer,
      price: Number(point.price),
      currency: point.currency,
      observedAt: point.observed_at
    }));

    return NextResponse.json({
      productId: input.productId,
      priceHistory,
      trackingSummary: summarizePriceTracking({ history: priceHistory, targetPrice })
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = TrackProductRequestSchema.parse(await parseJsonBody(request));
    const supabase = getSupabaseServiceClient();

    if (!supabase) {
      return NextResponse.json({
        mode: "mock",
        tracked: true,
        targetPrice: input.targetPrice ?? null,
        notifyOnDrop: input.notifyOnDrop,
        pricePoint: {
          id: crypto.randomUUID(),
          productId: input.product.id,
          retailer: input.product.retailer,
          price: input.product.price,
          currency: input.product.currency,
          observedAt: new Date().toISOString()
        },
        trackingSummary: summarizePriceTracking({
          history: createMockPriceHistory(input.product),
          targetPrice: input.targetPrice
        })
      });
    }

    const { error } = await supabase.from("wishlist_items").upsert(
      {
        user_id: input.userId,
        external_product_id: input.product.id,
        product: input.product,
        target_price: input.targetPrice,
        notify_on_drop: input.notifyOnDrop
      },
      { onConflict: "user_id,external_product_id" }
    );

    if (error) throw error;

    const { data: pricePoint, error: priceError } = await supabase
      .from("price_history")
      .insert({
        external_product_id: input.product.id,
        retailer: input.product.retailer,
        price: input.product.price,
        currency: input.product.currency
      })
      .select("*")
      .single();

    if (priceError) throw priceError;

    const priceHistory = [{
      id: pricePoint.id,
      productId: pricePoint.external_product_id,
      retailer: pricePoint.retailer,
      price: Number(pricePoint.price),
      currency: pricePoint.currency,
      observedAt: pricePoint.observed_at
    }];

    return NextResponse.json(
      {
        tracked: true,
        pricePoint,
        trackingSummary: summarizePriceTracking({
          history: priceHistory,
          targetPrice: input.targetPrice
        })
      },
      { status: 201 }
    );
  } catch (error) {
    return jsonError(error);
  }
}
