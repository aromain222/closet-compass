"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { Shuffle, Search as SearchIcon, Link2, Heart, ExternalLink } from "lucide-react";
import { DupeCard } from "@/components/product/DupeCard";
import { ProductCard } from "@/components/product/ProductCard";
import { DupeComparisonModal } from "@/components/product/DupeComparisonModal";
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
  onViewDetails,
}: {
  product: ProductResult;
  onReset: () => void;
  onViewDetails?: () => void;
}) {
  const fibers =
    product.normalizedMaterials.length > 0
      ? product.normalizedMaterials
      : product.listedMaterials.map((f) => ({ fiber: f, percentage: null }));

  return (
    <div className="bg-petal rounded-2xl border border-soft p-4 flex gap-4 items-start">
      <button
        className="relative w-16 h-20 rounded-xl overflow-hidden bg-card shrink-0 hover:opacity-80 transition-opacity"
        onClick={onViewDetails}
        aria-label="View product details"
      >
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="64px"
            className="object-cover"
            unoptimized
          />
        )}
      </button>
      <div className="flex-1 min-w-0 space-y-2">
        <div>
          <p className="text-[11px] text-muted uppercase tracking-[0.12em] font-medium">
            Finding dupes for
          </p>
          <button
            className="text-left hover:underline decoration-muted/40"
            onClick={onViewDetails}
          >
            <p className="text-sm font-medium text-warm-dark leading-snug">{product.title}</p>
          </button>
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
      <div className="flex flex-col items-end gap-2 shrink-0">
        {onViewDetails && (
          <button
            className="text-xs text-mauve-dark font-medium hover:text-warm-dark transition-colors"
            onClick={onViewDetails}
          >
            View stats
          </button>
        )}
        <button
          className="text-xs text-muted hover:text-warm-dark transition-colors"
          onClick={onReset}
        >
          New search
        </button>
      </div>
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
/*  URL → search query extraction              */
/* ──────────────────────────────────────────── */

function extractProductName(url: string): string {
  const path = url.replace(/^https?:\/\/[^/]+/, "").replace(/\?.*$/, "").replace(/#.*$/, "");

  // Amazon: meaningful title lives before /dp/
  const amazonMatch = path.match(/\/([A-Za-z][\w-]{8,})\/dp\//);
  if (amazonMatch) {
    return amazonMatch[1]
      .replace(/-/g, " ")
      .replace(/\b(the|and|for|with|mens|womens|boys|girls|kids)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  // General: pick the longest meaningful hyphenated path segment
  const stopwords = /\b(the|and|for|with|from|mens|womens|boys|girls|kids|shop|sale|new|view|item|product|detail|page|default|index|pdp|plp|us|en)\b/gi;
  const segments = path
    .split("/")
    .map((s) => s.replace(/\.[a-z]{2,4}$/, "")) // strip extensions
    .filter((s) => {
      if (s.length < 5) return false;
      if (/^\d+$/.test(s)) return false;                   // pure numeric ID
      if (/^[0-9a-f]{8,}$/i.test(s)) return false;         // hex ID
      if (/^[A-Z]{1,4}\d{4,}/i.test(s)) return false;      // product codes like B08X1Y
      if (/^prod\d+/i.test(s)) return false;                // prod11720664
      if (/^p\d{5,}/i.test(s)) return false;                // p09843215
      return true;
    });

  const best = segments
    .map((s) => s
      .replace(/-([a-z]{0,3})?\d{5,}$/i, "")               // strip trailing ID fragments
      .replace(/[-_](size|colour|color|[smlx]+\d*|[0-9]+[a-z]{0,2})$/i, "") // strip size/color suffixes
    )
    .filter((s) => s.includes("-") && s.length > 6)
    .sort((a, b) => b.length - a.length)[0]
    ?? segments[segments.length - 1]
    ?? "";

  return best
    .replace(/-/g, " ")
    .replace(stopwords, "")
    .replace(/\s+/g, " ")
    .trim();
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
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<DupeComparison | null>(null);
  const [sourceSelected, setSourceSelected] = useState<ProductResult | null>(null);
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

  async function handleSearchSubmit(overrideQuery?: string) {
    const q = (overrideQuery ?? inputValue).trim();
    if (!q) return;
    if (overrideQuery) setInputValue(overrideQuery);
    const query = q.startsWith("http") ? extractProductName(q) : q;
    setStep("searching");
    setSearchError(null);
    setError(null);
    try {
      const res = await api.search({ query, maxPrice: maxPrice ? Number(maxPrice) : undefined });
      if (res.products.length === 0) {
        // Stay on idle — no results to pick from
        setStep("idle");
        setSearchError("Nothing matched. Try a broader description — like \"silk skirt\" or \"cashmere cardigan\".");
        return;
      }
      if (res.products.length === 1) {
        // Only one match — skip the pick step and go straight to dupes
        await findDupesForProduct(res.products[0]);
        return;
      }
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
    setSearchError(null);
    router.replace("/dupes");
  }

  /* ── Render ── */

  return (
    <div className="min-h-screen bg-cream px-4 py-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-light text-warm-dark mb-1">Find a dupe</h1>
        <p className="text-sm text-muted max-w-sm text-balance">
          Clothing, jewelry, bags, and fragrance — ranked by what actually matters for each category.
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
                    placeholder='e.g. "Chanel Chance perfume dupe" or "silk slip skirt"'
                    value={inputValue}
                    onChange={(e) => { setInputValue(e.target.value); setSearchError(null); }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-soft bg-card text-sm text-warm-dark placeholder:text-muted/50 focus:outline-none focus:border-mauve transition-colors"
                  />
                </div>

                {/* Inline search error */}
                {searchError && (
                  <p className="text-xs text-mauve-dark">{searchError}</p>
                )}

                {/* Quick examples */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["silk slip skirt", "Chanel Chance perfume", "gold chain necklace", "Celine bag dupe", "cashmere cardigan"].map((ex) => (
                    <button
                      key={ex}
                      className="text-xs text-warm-mid bg-petal border border-soft rounded-full px-3 py-1 hover:border-mauve hover:text-warm-dark transition-colors"
                      onClick={() => handleSearchSubmit(ex)}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
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
                onClick={() => handleSearchSubmit()}
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
                  description="Search for an item above, save it to your wishlist, then come back to find dupes."
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
          <SourceHeader
            product={sourceProduct}
            onReset={reset}
            onViewDetails={() => setSourceSelected(sourceProduct)}
          />

          {agentSummary && (
            <p className="text-xs text-muted italic border-l-2 border-blush/40 pl-3">{agentSummary}</p>
          )}

          {dupes.length === 0 ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-card border border-soft p-6 text-center space-y-3">
                <p className="text-sm font-medium text-warm-dark">No cheaper alternatives found</p>
                <p className="text-xs text-muted">
                  This might already be a budget-friendly option, or try raising the max price.
                </p>
                <div className="flex justify-center gap-2 flex-wrap pt-1">
                  <Button variant="secondary" size="sm" onClick={() => setSourceSelected(sourceProduct)}>
                    View product stats
                  </Button>
                  <Button variant="ghost" size="sm" onClick={reset}>
                    Search again
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-muted uppercase tracking-wider font-medium">
                {dupes.length} alternative{dupes.length !== 1 ? "s" : ""} — ranked by material match
              </p>
              {dupes.map((comparison) => (
                <DupeCard
                  key={comparison.alternativeProduct.id}
                  comparison={comparison}
                  onSelect={(c) => setSelected(c)}
                  onWishlist={(c) => handleWishlist(c.alternativeProduct)}
                  wishlisted={wishlisted.has(comparison.alternativeProduct.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <DupeComparisonModal
        comparison={selected}
        onClose={() => setSelected(null)}
        onWishlist={(c) => handleWishlist(c.alternativeProduct)}
        wishlisted={selected ? wishlisted.has(selected.alternativeProduct.id) : false}
      />

      <ProductModal
        product={sourceSelected}
        onClose={() => setSourceSelected(null)}
        onWishlist={(p) => handleWishlist(p)}
        wishlisted={sourceSelected ? wishlisted.has(sourceSelected.id) : false}
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
