"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Camera, Search as SearchIcon, Sparkles } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import { ImageUpload } from "@/components/search/ImageUpload";
import { SearchResultCard } from "@/components/search/SearchResultCard";
import { SearchFilters, EMPTY_FILTERS, activeFilterCount } from "@/components/search/SearchFilters";
import type { FilterState } from "@/components/search/SearchFilters";
import { SearchResultsSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { ProductModal } from "@/components/product/ProductModal";
import { api } from "@/lib/api/client";
import { useUser } from "@/lib/context/user";
import { groupProducts } from "@/lib/utils/groupProducts";
import type { ProductGroup } from "@/lib/utils/groupProducts";
import type { ProductResult, ProductSearchResponse } from "@/lib/products/types";

const EXAMPLE_SEARCHES = [
  "soft black leggings, not see-through, under $70",
  "linen wide-leg trousers for summer",
  "cashmere cardigan in neutral tones",
  "silk slip midi skirt, under $180",
];

/* ──────────────────────────────────────────── */
/*  Group section                               */
/* ──────────────────────────────────────────── */

const groupBadgeColors: Record<string, string> = {
  best: "bg-blush/20 text-blush-dark border-blush/30",
  material: "bg-lavender/20 text-lavender-dark border-lavender/30",
  value: "bg-success-soft/20 text-green-700 border-success-soft/40",
  splurge: "bg-mauve/20 text-mauve-dark border-mauve/30",
  budget: "bg-taupe/20 text-warm-mid border-taupe/30",
};

function GroupSection({
  group,
  wishlisted,
  tracked,
  onSelect,
  onWishlist,
  onTrack,
  onFindDupes,
}: {
  group: ProductGroup;
  wishlisted: Set<string>;
  tracked: Set<string>;
  onSelect: (p: ProductResult) => void;
  onWishlist: (p: ProductResult) => void;
  onTrack: (p: ProductResult) => void;
  onFindDupes: (p: ProductResult) => void;
}) {
  return (
    <section>
      {/* Group header */}
      <div className="flex items-center gap-3 mb-4">
        <span className={`text-[11px] font-semibold uppercase tracking-[0.12em] px-3 py-1 rounded-full border ${groupBadgeColors[group.key] ?? "bg-petal text-muted border-border-soft"}`}>
          {group.label}
        </span>
        <p className="text-xs text-muted">{group.sublabel}</p>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {group.products.map((product) => (
          <SearchResultCard
            key={product.id}
            product={product}
            group={group}
            wishlisted={wishlisted.has(product.id)}
            tracked={tracked.has(product.id)}
            onSelect={onSelect}
            onWishlist={onWishlist}
            onTrack={onTrack}
            onFindDupes={onFindDupes}
          />
        ))}
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────── */
/*  First-use state                             */
/* ──────────────────────────────────────────── */

function FirstUseState({ onSearch }: { onSearch: (q: string) => void }) {
  return (
    <div className="py-10 space-y-6">
      <div className="flex flex-col items-center text-center gap-3">
        <div className="w-14 h-14 rounded-full bg-petal flex items-center justify-center">
          <Sparkles size={22} className="text-blush-dark" strokeWidth={1.5} />
        </div>
        <div>
          <p className="font-display text-xl font-light text-warm-dark">What are you searching for?</p>
          <p className="text-sm text-muted mt-1 max-w-sm text-balance">
            Describe the fabric, style, price — we rank results by material quality, not just visuals.
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs text-muted uppercase tracking-wider font-medium text-center mb-3">Try these searches</p>
        <div className="flex flex-col gap-2 max-w-md mx-auto">
          {EXAMPLE_SEARCHES.map((s) => (
            <button
              key={s}
              className="text-left text-sm text-warm-mid bg-card border border-soft rounded-xl px-4 py-2.5 hover:border-mauve hover:text-warm-dark transition-colors"
              onClick={() => onSearch(s)}
            >
              &ldquo;{s}&rdquo;
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────── */
/*  Main content (needs Suspense for           */
/*  useSearchParams)                            */
/* ──────────────────────────────────────────── */

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userId } = useUser();

  const query = searchParams.get("q") ?? "";
  const modeParam = searchParams.get("mode") ?? "text";

  const [imageMode, setImageMode] = useState(modeParam === "image");
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [pendingFilters, setPendingFilters] = useState<FilterState>(EMPTY_FILTERS);

  const [results, setResults] = useState<ProductSearchResponse | null>(null);
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentNote, setAgentNote] = useState<string | null>(null);

  const [selected, setSelected] = useState<ProductResult | null>(null);
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());
  const [tracked, setTracked] = useState<Set<string>>(new Set());

  // Keep a stable ref to the latest filters for the effect
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const runSearch = useCallback(async (q: string, f: FilterState = filtersRef.current) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.search({
        query: q,
        maxPrice: f.maxPrice ? Number(f.maxPrice) : undefined,
        preferredMaterials: f.preferredMaterials.length ? f.preferredMaterials : undefined,
        avoidMaterials: f.avoidMaterials.length ? f.avoidMaterials : undefined,
        occasion: f.occasion || undefined,
        stylePreferences: f.stylePreferences.length ? f.stylePreferences : undefined,
      });
      setResults(res);
      setGroups(groupProducts(res.products));
      setAgentNote(res.agentSummary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (query && !imageMode) runSearch(query, EMPTY_FILTERS);
  }, [query, imageMode, runSearch]);

  async function handleImageUpload(base64: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.searchImage({
        imageBase64: base64,
        maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
        preferredMaterials: filters.preferredMaterials.length ? filters.preferredMaterials : undefined,
        avoidMaterials: filters.avoidMaterials.length ? filters.avoidMaterials : undefined,
      });
      setResults(res);
      setGroups(groupProducts(res.products));
      setAgentNote(
        res.imageSearch?.inferredQuery
          ? `Analyzed as: "${res.imageSearch.inferredQuery}"`
          : "Image analyzed — showing similar items"
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Image search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(q: string) {
    setFilters(EMPTY_FILTERS);
    setPendingFilters(EMPTY_FILTERS);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  function applyFilters() {
    setFilters(pendingFilters);
    if (query) runSearch(query, pendingFilters);
  }

  function clearFilters() {
    setPendingFilters(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    if (query) runSearch(query, EMPTY_FILTERS);
  }

  async function handleWishlist(product: ProductResult) {
    try {
      await api.addToWishlist({ userId, product, priority: "medium" });
      setWishlisted((prev) => new Set(prev).add(product.id));
    } catch {
      // best effort
    }
  }

  async function handleTrack(product: ProductResult) {
    try {
      await api.trackProduct({ userId, product });
      setTracked((prev) => new Set(prev).add(product.id));
    } catch {
      // best effort
    }
  }

  function handleFindDupes(product: ProductResult) {
    router.push(`/dupes?productId=${product.id}`);
    setSelected(null);
  }

  const filterCount = activeFilterCount(filters);
  const totalResults = results?.products.length ?? 0;

  return (
    <div className="min-h-screen bg-cream px-4 py-8 max-w-3xl mx-auto">

      {/* ── Mode toggle ── */}
      <div className="flex items-center gap-2 mb-5">
        <button
          className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border transition-colors ${
            !imageMode
              ? "bg-warm-dark text-cream border-warm-dark"
              : "border-border-soft text-muted hover:text-warm-dark"
          }`}
          onClick={() => setImageMode(false)}
        >
          <SearchIcon size={13} /> Text
        </button>
        <button
          className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border transition-colors ${
            imageMode
              ? "bg-warm-dark text-cream border-warm-dark"
              : "border-border-soft text-muted hover:text-warm-dark"
          }`}
          onClick={() => setImageMode(true)}
        >
          <Camera size={13} /> Screenshot
        </button>
      </div>

      {/* ── Search input + filters ── */}
      <div className="space-y-3 mb-8">
        {imageMode ? (
          <ImageUpload onUpload={handleImageUpload} loading={loading} />
        ) : (
          <SearchBar onSearch={handleSearch} loading={loading} initialValue={query} />
        )}

        <SearchFilters
          filters={pendingFilters}
          onChange={setPendingFilters}
          onApply={applyFilters}
          onClear={clearFilters}
        />
      </div>

      {/* ── Loading ── */}
      {loading && <SearchResultsSkeleton count={3} />}

      {/* ── Error ── */}
      {!loading && error && (
        <div className="rounded-2xl bg-card border border-soft p-8 text-center space-y-3">
          <p className="text-sm text-red-500">{error}</p>
          <Button variant="secondary" size="sm" onClick={() => query && runSearch(query)}>
            Try again
          </Button>
        </div>
      )}

      {/* ── No results ── */}
      {!loading && !error && results && results.products.length === 0 && (
        <EmptyState
          icon={SearchIcon}
          title="No results found"
          description={
            filterCount > 0
              ? "Try removing some filters, or adjust your material preferences."
              : "Try a more general description, or a different material or style."
          }
          action={
            filterCount > 0
              ? { label: "Clear filters", onClick: clearFilters }
              : { label: "Try a new search", onClick: () => { setResults(null); router.push("/search"); } }
          }
        />
      )}

      {/* ── First-use / empty ── */}
      {!loading && !error && !results && (
        <FirstUseState onSearch={handleSearch} />
      )}

      {/* ── Results ── */}
      {!loading && !error && results && results.products.length > 0 && (
        <div className="space-y-10">
          {/* Result meta */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warm-mid">
                <span className="font-semibold text-warm-dark">{totalResults}</span> result{totalResults !== 1 ? "s" : ""}
                {query && <span className="text-muted"> for &ldquo;{query}&rdquo;</span>}
                {filterCount > 0 && <span className="text-muted"> · {filterCount} filter{filterCount !== 1 ? "s" : ""} active</span>}
              </p>
              {agentNote && (
                <p className="text-xs text-muted italic mt-0.5 max-w-xl">{agentNote}</p>
              )}
            </div>
            {results && (
              <button
                className="text-xs text-muted hover:text-warm-dark transition-colors"
                onClick={() => {
                  setResults(null);
                  setGroups([]);
                  router.push("/search");
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Grouped results */}
          <div className="space-y-10">
            {groups.map((group) => (
              <GroupSection
                key={group.key}
                group={group}
                wishlisted={wishlisted}
                tracked={tracked}
                onSelect={setSelected}
                onWishlist={handleWishlist}
                onTrack={handleTrack}
                onFindDupes={handleFindDupes}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Product detail modal ── */}
      <ProductModal
        product={selected}
        onClose={() => setSelected(null)}
        onWishlist={(p) => { handleWishlist(p); }}
        onFindDupes={handleFindDupes}
        onTrack={handleTrack}
        wishlisted={selected ? wishlisted.has(selected.id) : false}
        tracked={selected ? tracked.has(selected.id) : false}
        userId={userId}
      />
    </div>
  );
}

/* ──────────────────────────────────────────── */

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cream px-4 py-8 max-w-3xl mx-auto">
          <SearchResultsSkeleton count={3} />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
