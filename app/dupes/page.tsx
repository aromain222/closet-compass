"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { Shuffle, Search as SearchIcon, Link2, Heart, ExternalLink } from "lucide-react";
import { DupeCard } from "@/components/product/DupeCard";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductModal } from "@/components/product/ProductModal";
import { SearchResultsSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api/client";
import { useUser } from "@/lib/context/user";
import type { DupeComparison, ProductResult, WishlistItem } from "@/lib/products/types";

type Step = "idle" | "results" | "searching" | "dupes" | "error";
type IdleTab = "search" | "wishlist";

/* ──────────────────────────────────────────── */
/*  Source product header                       */
/* ──────────────────────────────────────────── */

function SourceHeader({
  product,
  onReset,
}: {
  product: ProductResult;
  onReset: () => void;
}) {
  const fibers =
    product.normalizedMaterials.length > 0
      ? product.normalizedMaterials
      : product.listedMaterials.map((f) => ({ fiber: f, percentage: null }));

  return (
    <div className="bg-petal rounded-2xl border border-soft p-4 flex gap-4 items-start">
      {product.imageUrl && (
        <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-card shrink-0">
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="64px"
            className="object-cover"
            unoptimized
          />
        </div>
      )}
      <div className="flex-1 min-w-0 space-y-2">
        <div>
          <p className="text-[11px] text-muted uppercase tracking-[0.12em] font-medium">
            Finding dupes for
          </p>
          <p className="text-sm font-medium text-warm-dark leading-snug">{product.title}</p>
          <p className="text-xs text-muted">
            {product.brand} · ${product.price}
          </p>
        </div>
        {fibers.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {fibers.slice(0, 4).map((m, i) => (
              <Badge key={i} variant="lavender">
                {m.percentage != null && (
                  <span className="text-muted text-[10px] mr-0.5">{m.percentage}%</span>
                )}
                {m.fiber}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <button
        className="text-xs text-muted hover:text-warm-dark transition-colors shrink-0"
        onClick={onReset}
      >
        New search
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────── */
/*  Wishlist product compact card              */
/* ──────────────────────────────────────────── */

function WishlistRow({
  item,
  onSelect,
}: {
  item: WishlistItem;
  onSelect: (p: ProductResult) => void;
}) {
  const { product } = item;
  return (
    <button
      className="w-full flex items-center gap-3 bg-card border border-soft rounded-xl px-3 py-2.5 hover:border-mauve hover:bg-petal/40 transition-all text-left"
      onClick={() => onSelect(product)}
    >
      {product.imageUrl && (
        <div className="relative w-10 h-12 rounded-lg overflow-hidden bg-petal shrink-0">
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="40px"
            className="object-cover"
            unoptimized
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted uppercase tracking-wider font-medium">{product.brand}</p>
        <p className="text-sm text-warm-dark font-medium leading-snug line-clamp-1">{product.title}</p>
        <p className="text-xs text-muted">${product.price}</p>
      </div>
      <span className="text-xs text-mauve-dark font-medium shrink-0">Find dupe →</span>
    </button>
  );
}

/* ──────────────────────────────────────────── */
/*  Main content                               */
/* ──────────────────────────────────────────── */

function DupesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userId } = useUser();

  const productId = searchParams.get("productId");

  const [step, setStep] = useState<Step>(productId ? "searching" : "idle");
  const [idleTab, setIdleTab] = useState<IdleTab>("search");
  const [inputValue, setInputValue] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [searchResults, setSearchResults] = useState<ProductResult[]>([]);
  const [sourceProduct, setSourceProduct] = useState<ProductResult | null>(null);
  const [dupes, setDupes] = useState<DupeComparison[]>([]);
  const [agentSummary, setAgentSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ProductResult | null>(null);
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());

  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  /* Load wishlist once */
  useEffect(() => {
    setWishlistLoading(true);
    api.getWishlist(userId)
      .then((res) => setWishlistItems(res.items))
      .catch(() => {})
      .finally(() => setWishlistLoading(false));
  }, [userId]);

  /* Boot from ?productId= */
  useEffect(() => {
    if (productId) findDupesById(productId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  /* ── Dupe lookup helpers ── */

  async function findDupesById(id: string) {
    setStep("searching");
    setError(null);
    try {
      const res = await api.findDupes({ productId: id, maxPrice: maxPrice ? Number(maxPrice) : undefined });
      setSourceProduct(res.sourceProduct);
      setDupes(res.alternatives);
      setAgentSummary(res.agentSummary);
      setStep("dupes");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to find dupes");
      setStep("error");
    }
  }

  const findDupesForProduct = useCallback(async (product: ProductResult) => {
    setSourceProduct(product);
    setStep("searching");
    setError(null);
    try {
      const res = await api.findDupes({ sourceProduct: product, maxPrice: maxPrice ? Number(maxPrice) : undefined });
      setDupes(res.alternatives);
      setAgentSummary(res.agentSummary);
      setStep("dupes");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to find dupes");
      setStep("error");
    }
  }, [maxPrice]);

  async function handleSearchSubmit() {
    const q = inputValue.trim();
    if (!q) return;
    // URL: strip protocol/path to extract search hint
    const query = q.startsWith("http")
      ? q.replace(/^https?:\/\//, "").replace(/\?.*$/, "").replace(/\//g, " ").trim()
      : q;
    setStep("searching");
    setError(null);
    try {
      const res = await api.search({ query, maxPrice: maxPrice ? Number(maxPrice) : undefined });
      setSearchResults(res.products);
      setStep("results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setStep("error");
    }
  }

  async function handleWishlist(product: ProductResult) {
    try {
      await api.addToWishlist({ userId, product, priority: "medium" });
      setWishlisted((prev) => new Set(prev).add(product.id));
    } catch {
      // best effort
    }
  }

  function reset() {
    setStep("idle");
    setSourceProduct(null);
    setDupes([]);
    setSearchResults([]);
    setError(null);
    router.replace("/dupes");
  }

  /* ── Render ── */

  return (
    <div className="min-h-screen bg-cream px-4 py-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-light text-warm-dark mb-1">Find a dupe</h1>
        <p className="text-sm text-muted max-w-sm text-balance">
          Cheaper alternatives ranked by material quality — not just looks. We&rsquo;ll be honest when the original is worth it.
        </p>
      </div>

      {/* ── Idle: search / wishlist ── */}
      {step === "idle" && (
        <div className="space-y-6">
          {/* Tab toggle */}
          <div className="flex gap-1 bg-petal rounded-full p-1 w-fit">
            {(["search", "wishlist"] as IdleTab[]).map((tab) => (
              <button
                key={tab}
                className={`text-sm font-medium px-4 py-1.5 rounded-full transition-all capitalize ${
                  idleTab === tab
                    ? "bg-card text-warm-dark shadow-sm"
                    : "text-muted hover:text-warm-dark"
                }`}
                onClick={() => setIdleTab(tab)}
              >
                {tab === "wishlist" ? "From wishlist" : "Search"}
              </button>
            ))}
          </div>

          {/* Search tab */}
          {idleTab === "search" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-warm-mid uppercase tracking-wider">
                  Describe the item or paste a link
                </label>
                <div className="relative">
                  <Link2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    placeholder="e.g. silk slip midi skirt — or paste a product URL"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-soft bg-card text-sm text-warm-dark placeholder:text-muted/50 focus:outline-none focus:border-mauve transition-colors"
                  />
                </div>
                <p className="text-xs text-muted">
                  Paste a product URL or describe what you&rsquo;re looking for
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-warm-mid uppercase tracking-wider">
                  Max dupe price (optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    placeholder="e.g. 80"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full pl-7 pr-4 py-3 rounded-xl border border-soft bg-card text-sm text-warm-dark placeholder:text-muted/50 focus:outline-none focus:border-mauve transition-colors"
                  />
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={handleSearchSubmit}
                disabled={!inputValue.trim()}
              >
                <SearchIcon size={14} /> Find alternatives
              </Button>
            </div>
          )}

          {/* Wishlist tab */}
          {idleTab === "wishlist" && (
            <div className="space-y-3">
              {wishlistLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-xl bg-petal animate-pulse" />
                  ))}
                </div>
              ) : wishlistItems.length === 0 ? (
                <EmptyState
                  icon={Heart}
                  title="Nothing saved yet"
                  description="Save items from search results, then come back to find dupes."
                  action={{ label: "Browse products", onClick: () => router.push("/search") }}
                />
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted uppercase tracking-wider font-medium">
                    {wishlistItems.length} saved item{wishlistItems.length !== 1 ? "s" : ""}
                  </p>
                  {wishlistItems.map((item) => (
                    <WishlistRow key={item.id} item={item} onSelect={findDupesForProduct} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Pick from search results ── */}
      {step === "results" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">
              <span className="font-medium text-warm-dark">{searchResults.length}</span> item{searchResults.length !== 1 ? "s" : ""} found — pick one to find dupes
            </p>
            <Button variant="ghost" size="sm" onClick={reset}>Back</Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {searchResults.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={findDupesForProduct}
                compact
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Searching skeleton ── */}
      {step === "searching" && (
        <div className="space-y-4">
          <div className="h-24 rounded-2xl bg-petal animate-pulse" />
          <SearchResultsSkeleton count={3} />
        </div>
      )}

      {/* ── Error ── */}
      {step === "error" && (
        <div className="rounded-2xl bg-card border border-soft p-8 text-center space-y-3">
          <p className="text-sm text-red-500">{error}</p>
          <Button variant="secondary" size="sm" onClick={reset}>Try again</Button>
        </div>
      )}

      {/* ── Dupe results ── */}
      {step === "dupes" && sourceProduct && (
        <div className="space-y-6">
          <SourceHeader product={sourceProduct} onReset={reset} />

          {agentSummary && (
            <p className="text-xs text-muted italic border-l-2 border-blush/40 pl-3">{agentSummary}</p>
          )}

          {dupes.length === 0 ? (
            <EmptyState
              icon={SearchIcon}
              title="No dupes found"
              description="Try raising the max price or search for a different item."
              action={{ label: "Search again", onClick: reset }}
            />
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-muted uppercase tracking-wider font-medium">
                {dupes.length} alternative{dupes.length !== 1 ? "s" : ""} — ranked by material match
              </p>
              {dupes.map((comparison) => (
                <DupeCard
                  key={comparison.alternativeProduct.id}
                  comparison={comparison}
                  onSelect={(c) => setSelected(c.alternativeProduct)}
                  onWishlist={(c) => handleWishlist(c.alternativeProduct)}
                  wishlisted={wishlisted.has(comparison.alternativeProduct.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <ProductModal
        product={selected}
        onClose={() => setSelected(null)}
        onWishlist={(p) => { handleWishlist(p); }}
        wishlisted={selected ? wishlisted.has(selected.id) : false}
        userId={userId}
      />
    </div>
  );
}

/* ──────────────────────────────────────────── */

export default function DupesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 border-mauve border-t-transparent animate-spin" />
        </div>
      }
    >
      <DupesContent />
    </Suspense>
  );
}
