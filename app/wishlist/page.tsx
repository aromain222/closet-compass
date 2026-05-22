"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Heart, RefreshCw, TrendingDown } from "lucide-react";
import { WishlistCard } from "@/components/wishlist/WishlistCard";
import { PriceHistoryChart } from "@/components/wishlist/PriceHistoryChart";
import { ProductModal } from "@/components/product/ProductModal";
import { EmptyState } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { useUser } from "@/lib/context/user";
import type { PriceHistoryPoint, ProductResult, WishlistItem } from "@/lib/products/types";

/* ── Tab types ── */

type Tab = "all" | "tracked" | "sale";

function tabLabel(tab: Tab) {
  return tab === "all" ? "All" : tab === "tracked" ? "Tracked" : "On sale";
}

function filterItems(items: WishlistItem[], tab: Tab): WishlistItem[] {
  switch (tab) {
    case "tracked": return items.filter((i) => i.targetPrice != null);
    case "sale": return items.filter(
      (i) => i.product.originalPrice && i.product.price < i.product.originalPrice
    );
    default: return items;
  }
}

function sortItems(items: WishlistItem[]): WishlistItem[] {
  const rank = (i: WishlistItem) => {
    const onSale = i.product.originalPrice && i.product.price < i.product.originalPrice ? 0 : 1;
    const p = i.priority === "high" ? 0 : i.priority === "medium" ? 1 : 2;
    return onSale * 10 + p;
  };
  return [...items].sort((a, b) => rank(a) - rank(b));
}

/* ── Price history panel ── */

interface HistoryPanelProps {
  productId: string;
  targetPrice?: number | null;
  userId: string;
}

function PriceHistoryPanel({ productId, targetPrice, userId }: HistoryPanelProps) {
  const [history, setHistory] = useState<PriceHistoryPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.getPriceHistory(productId, userId)
      .then((res) => {
        setHistory(res.priceHistory);
        const latest = res.priceHistory.at(-1);
        if (latest) setLastChecked(latest.observedAt);
      })
      .catch(() => setError("Could not load price history."))
      .finally(() => setLoading(false));
  }, [productId, userId]);

  return (
    <div className="mx-0 mb-1 rounded-xl border border-soft bg-petal/40 p-4 space-y-3">
      <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Price history</p>

      {loading && (
        <div className="h-14 rounded-lg bg-petal animate-pulse" />
      )}

      {!loading && error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {!loading && !error && history && history.length === 0 && (
        <p className="text-xs text-muted italic">No price drops yet. We&rsquo;ll keep watching.</p>
      )}

      {!loading && !error && history && history.length > 0 && (
        <PriceHistoryChart history={history} targetPrice={targetPrice} />
      )}

      {lastChecked && (
        <p className="text-[10px] text-muted">
          Last checked {new Date(lastChecked).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      )}
    </div>
  );
}

/* ── Main page ── */

export default function WishlistPage() {
  const { userId } = useUser();
  const router = useRouter();

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [selected, setSelected] = useState<ProductResult | null>(null);
  const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set());
  const [historyOpenId, setHistoryOpenId] = useState<string | null>(null);

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
      if (historyOpenId === item.product.id) setHistoryOpenId(null);
    } catch {
      // best effort
    }
  }

  async function handleTrack(item: WishlistItem) {
    try {
      await api.trackProduct({ userId, product: item.product });
      setTrackedIds((prev) => new Set(prev).add(item.product.id));
      setHistoryOpenId(item.product.id);
    } catch {
      // best effort
    }
  }

  function handleToggleHistory(item: WishlistItem) {
    setHistoryOpenId((prev) => (prev === item.product.id ? null : item.product.id));
  }

  function handleFindDupes(item: WishlistItem) {
    router.push(`/dupes?productId=${item.product.id}`);
  }

  async function handleWishlist(product: ProductResult) {
    try {
      await api.addToWishlist({ userId, product, priority: "medium" });
    } catch {
      // best effort
    }
  }

  async function handleTrackFromModal(product: ProductResult) {
    try {
      await api.trackProduct({ userId, product });
      setTrackedIds((prev) => new Set(prev).add(product.id));
    } catch {
      // best effort
    }
  }

  const tabCounts: Record<Tab, number> = {
    all: items.length,
    tracked: items.filter((i) => i.targetPrice != null || trackedIds.has(i.product.id)).length,
    sale: items.filter((i) => i.product.originalPrice && i.product.price < i.product.originalPrice).length,
  };

  const totalValue = items.reduce((sum, i) => sum + i.product.price, 0);
  const onSaleCount = tabCounts.sale;

  const displayed = sortItems(filterItems(items, tab));

  return (
    <div className="min-h-screen bg-cream px-4 py-8 max-w-2xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-light text-warm-dark mb-1">Wishlist</h1>
          {items.length > 0 && (
            <div className="flex items-center gap-3 text-sm text-muted">
              <span>{items.length} item{items.length !== 1 ? "s" : ""}</span>
              <span>·</span>
              <span>${totalValue.toFixed(0)} total</span>
              {onSaleCount > 0 && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-green-700 font-medium">
                    <TrendingDown size={12} /> {onSaleCount} on sale
                  </span>
                </>
              )}
            </div>
          )}
        </div>
        {!loading && (
          <Button variant="ghost" size="sm" onClick={loadWishlist}>
            <RefreshCw size={13} />
          </Button>
        )}
      </div>

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-petal animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div className="rounded-2xl bg-card border border-soft p-8 text-center space-y-3">
          <p className="text-sm text-red-500">{error}</p>
          <Button variant="secondary" size="sm" onClick={loadWishlist}>Try again</Button>
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && !error && items.length === 0 && (
        <EmptyState
          icon={Heart}
          title="Nothing saved yet"
          description="Save pieces you love and I'll watch the price for you."
          action={{ label: "Start shopping", onClick: () => router.push("/") }}
        />
      )}

      {/* ── Content ── */}
      {!loading && !error && items.length > 0 && (
        <div className="space-y-6">
          {/* Tab bar */}
          <div className="flex gap-1 bg-petal rounded-full p-1 w-fit">
            {(["all", "tracked", "sale"] as Tab[]).map((t) => (
              <button
                key={t}
                className={`relative text-sm font-medium px-4 py-1.5 rounded-full transition-all ${
                  tab === t
                    ? "bg-card text-warm-dark shadow-sm"
                    : "text-muted hover:text-warm-dark"
                }`}
                onClick={() => setTab(t)}
              >
                {tabLabel(t)}
                {tabCounts[t] > 0 && (
                  <span className={`ml-1.5 text-[10px] font-bold ${
                    tab === t ? "text-mauve-dark" : "text-muted"
                  }`}>
                    {tabCounts[t]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Per-tab empty */}
          {displayed.length === 0 && tab === "tracked" && (
            <EmptyState
              icon={TrendingDown}
              title="No price drops yet"
              description="Track items to monitor their price. We&rsquo;ll show history here."
            />
          )}
          {displayed.length === 0 && tab === "sale" && (
            <EmptyState
              icon={TrendingDown}
              title="Nothing on sale right now"
              description="We&rsquo;ll highlight price drops as they happen."
            />
          )}

          {/* Item list */}
          {displayed.length > 0 && (
            <div className="space-y-3">
              {displayed.map((item) => {
                const isTracked = trackedIds.has(item.product.id) || item.targetPrice != null;
                const historyOpen = historyOpenId === item.product.id;
                return (
                  <div key={item.id} className="space-y-1">
                    <WishlistCard
                      item={item}
                      tracked={isTracked}
                      historyOpen={historyOpen}
                      onSelect={(i) => setSelected(i.product)}
                      onRemove={handleRemove}
                      onFindDupes={handleFindDupes}
                      onTrack={handleTrack}
                      onToggleHistory={handleToggleHistory}
                    />
                    {historyOpen && (
                      <PriceHistoryPanel
                        productId={item.product.id}
                        targetPrice={item.targetPrice}
                        userId={userId}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Product modal ── */}
      <ProductModal
        product={selected}
        onClose={() => setSelected(null)}
        onWishlist={handleWishlist}
        onFindDupes={(p) => { router.push(`/dupes?productId=${p.id}`); setSelected(null); }}
        onTrack={handleTrackFromModal}
        wishlisted={selected ? items.some((i) => i.product.id === selected.id) : false}
        tracked={selected ? trackedIds.has(selected.id) : false}
        userId={userId}
      />
    </div>
  );
}
