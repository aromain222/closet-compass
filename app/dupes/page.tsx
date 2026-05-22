"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Shuffle, Search as SearchIcon } from "lucide-react";
import { DupeCard } from "@/components/product/DupeCard";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductModal } from "@/components/product/ProductModal";
import { SearchBar } from "@/components/search/SearchBar";
import { PageSpinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { useUser } from "@/lib/context/user";
import type { DupeComparison, ProductResult } from "@/lib/products/types";

type FlowState = "idle" | "searching" | "results" | "dupes" | "error";

function DupesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userId } = useUser();

  const productId = searchParams.get("productId");

  const [state, setState] = useState<FlowState>(productId ? "searching" : "idle");
  const [searchResults, setSearchResults] = useState<ProductResult[]>([]);
  const [sourceProduct, setSourceProduct] = useState<ProductResult | null>(null);
  const [dupes, setDupes] = useState<DupeComparison[]>([]);
  const [agentSummary, setAgentSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ProductResult | null>(null);
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());
  const [maxPrice, setMaxPrice] = useState<string>("");

  useEffect(() => {
    if (productId) findDupesById(productId);
  }, [productId]);

  async function findDupesById(id: string) {
    setState("searching");
    setError(null);
    try {
      const res = await api.findDupes({
        productId: id,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      });
      setSourceProduct(res.sourceProduct);
      setDupes(res.alternatives);
      setAgentSummary(res.agentSummary);
      setState("dupes");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to find dupes");
      setState("error");
    }
  }

  async function findDupesForProduct(product: ProductResult) {
    setSourceProduct(product);
    setState("searching");
    setError(null);
    try {
      const res = await api.findDupes({
        sourceProduct: product,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      });
      setDupes(res.alternatives);
      setAgentSummary(res.agentSummary);
      setState("dupes");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to find dupes");
      setState("error");
    }
  }

  async function handleSearch(query: string) {
    setState("searching");
    setError(null);
    try {
      const res = await api.search({ query });
      setSearchResults(res.products);
      setState("results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setState("error");
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
    setState("idle");
    setSourceProduct(null);
    setDupes([]);
    setSearchResults([]);
    setError(null);
    router.replace("/dupes");
  }

  return (
    <div className="min-h-screen bg-cream px-4 py-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-light text-warm-dark mb-1">Find a dupe</h1>
        <p className="text-sm text-muted">Find cheaper alternatives ranked by material quality, not just visual similarity.</p>
      </div>

      {/* Idle: search for a product first */}
      {state === "idle" && (
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium text-warm-mid mb-3">What item do you want a dupe for?</p>
            <SearchBar
              onSearch={handleSearch}
              placeholder="e.g. bias cut silk slip skirt…"
              size="sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder="Max price (optional)"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="flex-1 rounded-xl border border-soft bg-card px-4 py-2.5 text-sm text-warm-dark placeholder:text-muted/60 focus:outline-none focus:border-mauve transition-colors"
            />
          </div>
          <EmptyState
            icon={Shuffle}
            title="No dupe search yet"
            description="Search for an item above to find cheaper alternatives ranked by material quality."
          />
        </div>
      )}

      {/* Product search results */}
      {state === "results" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">{searchResults.length} items found — pick one to find dupes</p>
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

      {/* Loading */}
      {state === "searching" && <PageSpinner />}

      {/* Error */}
      {state === "error" && (
        <div className="text-center py-12">
          <p className="text-sm text-red-500 mb-3">{error}</p>
          <Button variant="secondary" size="sm" onClick={reset}>Try again</Button>
        </div>
      )}

      {/* Dupe results */}
      {state === "dupes" && sourceProduct && (
        <div className="space-y-6">
          {/* Source product */}
          <div className="bg-petal rounded-2xl p-4 flex gap-3 items-start">
            <div className="flex-1">
              <p className="text-xs text-muted uppercase tracking-wider font-medium mb-1">Shopping for a dupe of</p>
              <p className="text-sm font-medium text-warm-dark">{sourceProduct.title}</p>
              <p className="text-xs text-muted">{sourceProduct.brand} · ${sourceProduct.price}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={reset}>New search</Button>
          </div>

          {agentSummary && (
            <p className="text-xs text-muted italic border-l-2 border-blush/40 pl-3">{agentSummary}</p>
          )}

          {dupes.length === 0 ? (
            <EmptyState
              icon={SearchIcon}
              title="No dupes found"
              description="Try searching for a different item or raising the max price."
              action={{ label: "Search again", onClick: reset }}
            />
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted uppercase tracking-wider font-medium">
                {dupes.length} alternative{dupes.length !== 1 ? "s" : ""} ranked by quality match
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
        onWishlist={(p) => { handleWishlist(p); setSelected(null); }}
        wishlisted={selected ? wishlisted.has(selected.id) : false}
      />
    </div>
  );
}

export default function DupesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="w-6 h-6 rounded-full border-2 border-mauve border-t-transparent animate-spin" /></div>}>
      <DupesContent />
    </Suspense>
  );
}
