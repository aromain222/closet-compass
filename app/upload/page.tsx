"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UploadZone } from "@/components/upload/UploadZone";
import { ImagePreviewForm, VisualSignalsPanel } from "@/components/upload/ImageAnalysisPanel";
import { SearchResultCard } from "@/components/search/SearchResultCard";
import { SearchResultsSkeleton } from "@/components/ui/skeleton";
import { ProductModal } from "@/components/product/ProductModal";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { useUser } from "@/lib/context/user";
import { groupProducts } from "@/lib/utils/groupProducts";
import type { ProductGroup } from "@/lib/utils/groupProducts";
import type { ProductResult } from "@/lib/products/types";
import type { ImageSearchAnalysis } from "@/lib/products/types";

type Step = "idle" | "previewing" | "searching" | "results";

type ImageSource =
  | { kind: "base64"; base64: string; dataUrl: string }
  | { kind: "url"; url: string };

export default function UploadPage() {
  const router = useRouter();
  const { userId } = useUser();

  const [step, setStep] = useState<Step>("idle");
  const [source, setSource] = useState<ImageSource | null>(null);
  const [analysis, setAnalysis] = useState<ImageSearchAnalysis | null>(null);
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());
  const [tracked, setTracked] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<ProductResult | null>(null);

  const dataUrl =
    source?.kind === "base64"
      ? source.dataUrl
      : source?.kind === "url"
      ? source.url
      : "";

  /* ── Step 1: file chosen ── */
  function handleFile(base64: string, dataUrl: string) {
    setSource({ kind: "base64", base64, dataUrl });
    setStep("previewing");
  }

  function handleUrl(url: string) {
    setSource({ kind: "url", url });
    setStep("previewing");
  }

  function handleReset() {
    setStep("idle");
    setSource(null);
    setAnalysis(null);
    setGroups([]);
    setError(null);
  }

  /* ── Step 2 → 3: submit with notes ── */
  const handleSearch = useCallback(
    async (notes: string) => {
      if (!source) return;
      setStep("searching");
      setError(null);

      try {
        const body =
          source.kind === "base64"
            ? { imageBase64: source.base64, query: notes || undefined }
            : { imageUrl: source.url, query: notes || undefined };

        const res = await api.searchImage(body);
        setAnalysis(res.imageSearch ?? null);
        setGroups(groupProducts(res.products));
        setStep("results");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Image search failed. Please try again.");
        setStep("previewing");
      }
    },
    [source]
  );

  /* ── Wishlist / tracking ── */
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

  /* ── Render ── */

  if (step === "idle") {
    return <UploadZone onFile={handleFile} onUrl={handleUrl} />;
  }

  if (step === "previewing") {
    return (
      <ImagePreviewForm
        dataUrl={dataUrl}
        onSearch={handleSearch}
        onReset={handleReset}
      />
    );
  }

  if (step === "searching") {
    return (
      <div className="min-h-screen bg-cream px-4 py-12 max-w-3xl mx-auto">
        <SearchResultsSkeleton count={4} />
      </div>
    );
  }

  /* results */
  const totalResults = groups.reduce((sum, g) => sum + g.products.length, 0);

  return (
    <div className="min-h-screen bg-cream px-4 py-8 max-w-3xl mx-auto space-y-8">

      {/* Visual signals */}
      {analysis && (
        <VisualSignalsPanel
          dataUrl={dataUrl}
          analysis={analysis}
          onReset={handleReset}
        />
      )}

      {/* Error */}
      {error && (
        <div className="rounded-2xl bg-card border border-soft p-6 text-center space-y-3">
          <p className="text-sm text-red-500">{error}</p>
          <Button variant="secondary" size="sm" onClick={() => setStep("previewing")}>
            Try again
          </Button>
        </div>
      )}

      {/* Result meta */}
      {!error && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-warm-mid">
            <span className="font-semibold text-warm-dark">{totalResults}</span>{" "}
            result{totalResults !== 1 ? "s" : ""}
            {analysis?.inferredQuery && (
              <span className="text-muted"> for &ldquo;{analysis.inferredQuery}&rdquo;</span>
            )}
          </p>
          <button
            className="text-xs text-muted hover:text-warm-dark transition-colors"
            onClick={handleReset}
          >
            Search again
          </button>
        </div>
      )}

      {/* No results */}
      {!error && totalResults === 0 && (
        <div className="rounded-2xl bg-card border border-soft p-10 text-center space-y-3">
          <p className="font-display text-xl font-light text-warm-dark">No matches found</p>
          <p className="text-sm text-muted max-w-xs mx-auto">
            Try uploading a clearer image, or add notes to help narrow the search.
          </p>
          <Button variant="secondary" size="sm" onClick={handleReset}>
            Try a different image
          </Button>
        </div>
      )}

      {/* Grouped results */}
      {!error && totalResults > 0 && (
        <div className="space-y-10">
          {groups.map((group) => (
            <section key={group.key}>
              <div className="flex items-center gap-3 mb-4">
                <span className={`text-[11px] font-semibold uppercase tracking-[0.12em] px-3 py-1 rounded-full border ${groupBadgeColors[group.key] ?? "bg-petal text-muted border-border-soft"}`}>
                  {group.label}
                </span>
                <p className="text-xs text-muted">{group.sublabel}</p>
              </div>
              <div className="space-y-4">
                {group.products.map((product) => (
                  <SearchResultCard
                    key={product.id}
                    product={product}
                    group={group}
                    wishlisted={wishlisted.has(product.id)}
                    tracked={tracked.has(product.id)}
                    onSelect={setSelected}
                    onWishlist={handleWishlist}
                    onTrack={handleTrack}
                    onFindDupes={handleFindDupes}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Product detail modal */}
      <ProductModal
        product={selected}
        onClose={() => setSelected(null)}
        onWishlist={handleWishlist}
        onFindDupes={handleFindDupes}
        onTrack={handleTrack}
        wishlisted={selected ? wishlisted.has(selected.id) : false}
        tracked={selected ? tracked.has(selected.id) : false}
        userId={userId}
      />
    </div>
  );
}

const groupBadgeColors: Record<string, string> = {
  best: "bg-blush/20 text-blush-dark border-blush/30",
  material: "bg-lavender/20 text-lavender-dark border-lavender/30",
  value: "bg-success-soft/20 text-green-700 border-success-soft/40",
  splurge: "bg-mauve/20 text-mauve-dark border-mauve/30",
  budget: "bg-taupe/20 text-warm-mid border-taupe/30",
};
