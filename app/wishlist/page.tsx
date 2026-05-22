"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Heart, RefreshCw } from "lucide-react";
import { WishlistCard } from "@/components/wishlist/WishlistCard";
import { ProductModal } from "@/components/product/ProductModal";
import { PageSpinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { useUser } from "@/lib/context/user";
import type { ProductResult, WishlistItem } from "@/lib/products/types";

export default function WishlistPage() {
  const { userId } = useUser();
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ProductResult | null>(null);

  const loadWishlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getWishlist(userId);
      setItems(res.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadWishlist(); }, [loadWishlist]);

  async function handleRemove(item: WishlistItem) {
    try {
      await api.removeFromWishlist({ userId, productId: item.product.id });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch {
      // best effort
    }
  }

  async function handleWishlist(product: ProductResult) {
    try {
      await api.addToWishlist({ userId, product, priority: "medium" });
    } catch {
      // best effort
    }
  }

  function handleFindDupes(product: ProductResult) {
    router.push(`/dupes?productId=${product.id}`);
    setSelected(null);
  }

  async function handleTrack(product: ProductResult) {
    try {
      await api.trackProduct({ userId, product });
    } catch {
      // best effort
    }
  }

  const totalValue = items.reduce((sum, i) => sum + i.product.price, 0);

  return (
    <div className="min-h-screen bg-cream px-4 py-8 max-w-2xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-warm-dark mb-1">Wishlist</h1>
          {items.length > 0 && (
            <p className="text-sm text-muted">
              {items.length} item{items.length !== 1 ? "s" : ""} · ${totalValue.toFixed(0)} total
            </p>
          )}
        </div>
        {!loading && (
          <Button variant="ghost" size="sm" onClick={loadWishlist}>
            <RefreshCw size={13} />
          </Button>
        )}
      </div>

      {loading && <PageSpinner />}

      {!loading && error && (
        <div className="text-center py-12">
          <p className="text-sm text-red-500 mb-3">{error}</p>
          <Button variant="secondary" size="sm" onClick={loadWishlist}>Try again</Button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save items while searching or browsing dupes."
          action={{ label: "Start shopping", onClick: () => router.push("/") }}
        />
      )}

      {!loading && !error && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <WishlistCard
              key={item.id}
              item={item}
              onRemove={handleRemove}
              onSelect={(i) => setSelected(i.product)}
            />
          ))}
        </div>
      )}

      <ProductModal
        product={selected}
        onClose={() => setSelected(null)}
        onWishlist={handleWishlist}
        onFindDupes={handleFindDupes}
        onTrack={handleTrack}
        wishlisted
      />
    </div>
  );
}
