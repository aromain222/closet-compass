"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Camera, Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import { ImageUpload } from "@/components/search/ImageUpload";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductModal } from "@/components/product/ProductModal";
import { PageSpinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { useUser } from "@/lib/context/user";
import type { ProductResult, ProductSearchResponse } from "@/lib/products/types";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userId } = useUser();

  const query = searchParams.get("q") ?? "";
  const mode = searchParams.get("mode") ?? "text";

  const [imageMode, setImageMode] = useState(mode === "image");
  const [results, setResults] = useState<ProductSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ProductResult | null>(null);
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());
  const [agentNote, setAgentNote] = useState<string | null>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.search({ query: q });
      setResults(res);
      setAgentNote(res.agentSummary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (query && !imageMode) runSearch(query);
  }, [query, imageMode, runSearch]);

  async function handleImageUpload(base64: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.searchImage({ imageBase64: base64 });
      setResults(res);
      setAgentNote(`Image analyzed: ${res.imageSearch?.inferredQuery ?? "similar items found"}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Image search failed");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(q: string) {
    router.push(`/search?q=${encodeURIComponent(q)}`);
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
    } catch {
      // best effort
    }
  }

  function handleFindDupes(product: ProductResult) {
    router.push(`/dupes?productId=${product.id}`);
    setSelected(null);
  }

  return (
    <div className="min-h-screen bg-cream px-4 py-8 max-w-4xl mx-auto">
      {/* Mode toggle */}
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant={!imageMode ? "primary" : "ghost"}
          size="sm"
          onClick={() => setImageMode(false)}
        >
          <SearchIcon size={14} /> Text
        </Button>
        <Button
          variant={imageMode ? "primary" : "ghost"}
          size="sm"
          onClick={() => setImageMode(true)}
        >
          <Camera size={14} /> Screenshot
        </Button>
        {results && (
          <button
            className="ml-auto flex items-center gap-1.5 text-xs text-muted hover:text-warm-dark transition-colors"
            onClick={() => { setResults(null); setAgentNote(null); }}
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Search input */}
      {imageMode ? (
        <div className="mb-6">
          <ImageUpload onUpload={handleImageUpload} loading={loading} />
        </div>
      ) : (
        <div className="mb-6">
          <SearchBar onSearch={handleSearch} loading={loading} initialValue={query} />
        </div>
      )}

      {/* Agent note */}
      {agentNote && !loading && (
        <p className="text-xs text-muted italic mb-6 border-l-2 border-blush/40 pl-3">{agentNote}</p>
      )}

      {/* States */}
      {loading && <PageSpinner />}

      {!loading && error && (
        <div className="text-center py-12">
          <p className="text-sm text-red-500 mb-3">{error}</p>
          <Button variant="secondary" size="sm" onClick={() => query && runSearch(query)}>
            Try again
          </Button>
        </div>
      )}

      {!loading && !error && results && results.products.length === 0 && (
        <EmptyState
          icon={SlidersHorizontal}
          title="No results found"
          description="Try different keywords, or remove material filters."
          action={{ label: "Search something else", onClick: () => setResults(null) }}
        />
      )}

      {!loading && !error && !results && !imageMode && !query && (
        <EmptyState
          icon={SearchIcon}
          title="Start searching"
          description="Describe fabric, style, occasion, or price — and we'll find the best matches with material quality scores."
        />
      )}

      {/* Results grid */}
      {!loading && results && results.products.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted">
              {results.products.length} result{results.products.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {results.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={setSelected}
                onWishlist={handleWishlist}
                wishlisted={wishlisted.has(product.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Product modal */}
      <ProductModal
        product={selected}
        onClose={() => setSelected(null)}
        onWishlist={(p) => { handleWishlist(p); setSelected(null); }}
        onFindDupes={handleFindDupes}
        onTrack={handleTrack}
        wishlisted={selected ? wishlisted.has(selected.id) : false}
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="w-6 h-6 rounded-full border-2 border-mauve border-t-transparent animate-spin" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
