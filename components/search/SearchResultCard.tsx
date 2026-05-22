"use client";

import Image from "next/image";
import { Heart, TrendingUp, Shuffle, ExternalLink, CheckCircle } from "lucide-react";
import type { ProductResult } from "@/lib/products/types";
import type { ProductGroup } from "@/lib/utils/groupProducts";
import { Badge } from "@/components/ui/badge";

/* ───────── helpers ───────── */

function confidenceLabel(c: number): { text: string; color: string } {
  if (c >= 0.85) return { text: "Quality verified", color: "text-green-700" };
  if (c >= 0.65) return { text: "Mostly verified", color: "text-mauve-dark" };
  return { text: "Unverified materials", color: "text-muted" };
}

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs text-muted w-[78px] shrink-0 font-medium">{label}</span>
      <div className="flex-1 h-[5px] rounded-full bg-petal overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-warm-mid w-6 text-right">{score}</span>
    </div>
  );
}

/* ───────── material chip ───────── */

function MaterialChip({ fiber, pct }: { fiber: string; pct?: number | null }) {
  return (
    <span className="inline-flex items-center gap-1 bg-lavender/20 border border-lavender/40 text-warm-dark text-xs font-medium px-3 py-1.5 rounded-full">
      {pct != null ? <span className="text-muted text-[11px]">{pct}%</span> : null}
      {fiber}
    </span>
  );
}

/* ───────── group badge ───────── */

const groupBadgeVariant: Record<string, "blush" | "mauve" | "lavender" | "taupe" | "success"> = {
  best: "blush",
  material: "lavender",
  value: "success",
  splurge: "mauve",
  budget: "taupe",
};

/* ───────── card ───────── */

export interface SearchResultCardProps {
  product: ProductResult;
  group?: ProductGroup;
  wishlisted?: boolean;
  tracked?: boolean;
  onSelect?: (p: ProductResult) => void;
  onWishlist?: (p: ProductResult) => void;
  onTrack?: (p: ProductResult) => void;
  onFindDupes?: (p: ProductResult) => void;
}

export function SearchResultCard({
  product,
  group,
  wishlisted = false,
  tracked = false,
  onSelect,
  onWishlist,
  onTrack,
  onFindDupes,
}: SearchResultCardProps) {
  const { text: confText, color: confColor } = confidenceLabel(product.materialConfidence);
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const fibers = product.normalizedMaterials.length > 0
    ? product.normalizedMaterials
    : product.listedMaterials.map((raw) => ({ fiber: raw, percentage: null }));

  const matchNote = product.reviewSummary ?? null;

  return (
    <article className="group bg-card rounded-2xl border border-soft card-shadow hover:card-shadow-hover transition-all overflow-hidden">
      <div className="flex flex-col sm:flex-row">

        {/* ── Image ── */}
        <div
          className="relative w-full sm:w-52 aspect-[3/4] sm:aspect-auto sm:h-auto bg-petal shrink-0 cursor-pointer overflow-hidden"
          onClick={() => onSelect?.(product)}
        >
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, 208px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-warm-dark/20 via-transparent to-transparent pointer-events-none" />

          {/* Group badge */}
          {group && (
            <div className="absolute top-3 left-3">
              <Badge variant={groupBadgeVariant[group.key] ?? "warm"}>
                {group.label}
              </Badge>
            </div>
          )}

          {/* Discount badge */}
          {discount > 0 && (
            <span className="absolute bottom-3 left-3 bg-card/95 text-warm-dark text-[11px] font-semibold px-2 py-0.5 rounded-full">
              −{discount}%
            </span>
          )}

          {/* Wishlist shortcut */}
          <button
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${
              wishlisted
                ? "bg-blush text-warm-dark"
                : "bg-card/80 text-muted hover:bg-blush hover:text-warm-dark"
            }`}
            onClick={(e) => { e.stopPropagation(); onWishlist?.(product); }}
            aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
          >
            <Heart size={14} fill={wishlisted ? "currentColor" : "none"} />
          </button>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 min-w-0 p-5 flex flex-col gap-4">

          {/* Identity */}
          <div
            className="cursor-pointer"
            onClick={() => onSelect?.(product)}
          >
            <p className="text-[11px] text-muted uppercase tracking-[0.12em] font-medium mb-0.5">{product.brand}</p>
            <h3 className="font-display text-xl font-light text-warm-dark leading-snug">{product.title}</h3>
            <p className="text-xs text-muted mt-0.5">{product.retailer} · {product.category}</p>

            {/* Price */}
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-xl font-semibold text-warm-dark">${product.price}</span>
              {product.originalPrice && (
                <span className="text-sm text-muted line-through">${product.originalPrice}</span>
              )}
              {discount > 0 && (
                <span className="text-xs font-medium text-blush-dark">Save ${(product.originalPrice! - product.price).toFixed(0)}</span>
              )}
            </div>
          </div>

          {/* ── Materials (prominent) ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-warm-mid uppercase tracking-[0.12em]">Fabric composition</p>
              <span className={`text-[11px] font-medium flex items-center gap-1 ${confColor}`}>
                {product.materialConfidence >= 0.85 && <CheckCircle size={11} />}
                {confText}
              </span>
            </div>

            {fibers.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {fibers.slice(0, 5).map((m, i) => (
                  <MaterialChip key={`${m.fiber}-${i}`} fiber={m.fiber} pct={m.percentage} />
                ))}
                {fibers.length > 5 && (
                  <span className="text-xs text-muted self-center">+{fibers.length - 5} more</span>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted italic">Fiber content not disclosed by retailer</p>
            )}
          </div>

          {/* ── Quality scores ── */}
          {(product.softnessScore > 0 || product.breathabilityScore > 0) && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-warm-mid uppercase tracking-[0.12em]">Fabric quality</p>
              <div className="space-y-1.5">
                {product.softnessScore > 0 && (
                  <ScoreBar label="Softness" score={product.softnessScore} color="bg-blush" />
                )}
                {product.breathabilityScore > 0 && (
                  <ScoreBar label="Breathability" score={product.breathabilityScore} color="bg-lavender" />
                )}
                {product.opacityScore > 0 && (
                  <ScoreBar label="Opacity" score={product.opacityScore} color="bg-mauve" />
                )}
                {product.durabilityScore > 0 && (
                  <ScoreBar label="Durability" score={product.durabilityScore} color="bg-taupe" />
                )}
                {product.stretchScore > 0 && (
                  <ScoreBar label="Stretch" score={product.stretchScore} color="bg-lavender" />
                )}
              </div>
            </div>
          )}

          {/* ── Match note ── */}
          {matchNote && (
            <p className="text-sm text-muted italic leading-relaxed border-l-2 border-blush/50 pl-3 py-0.5">
              {matchNote}
            </p>
          )}

          {/* ── Care ── */}
          {product.careInstructions.length > 0 && (
            <p className="text-xs text-muted">
              Care: {product.careInstructions.join(" · ")}
            </p>
          )}

          {/* ── CTAs ── */}
          <div className="flex flex-wrap items-center gap-2 mt-auto pt-1 border-t border-soft">
            <button
              className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full border transition-all ${
                wishlisted
                  ? "bg-blush border-blush text-warm-dark"
                  : "border-border-strong text-warm-mid hover:border-blush hover:bg-blush/10 hover:text-warm-dark"
              }`}
              onClick={() => onWishlist?.(product)}
            >
              <Heart size={13} fill={wishlisted ? "currentColor" : "none"} />
              {wishlisted ? "Saved" : "Save"}
            </button>

            <button
              className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full border transition-all ${
                tracked
                  ? "bg-lavender/30 border-lavender text-warm-dark"
                  : "border-border-strong text-warm-mid hover:border-lavender hover:bg-lavender/10 hover:text-warm-dark"
              }`}
              onClick={() => onTrack?.(product)}
            >
              <TrendingUp size={13} />
              {tracked ? "Tracking" : "Track price"}
            </button>

            <button
              className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full border border-border-strong text-warm-mid hover:border-warm hover:bg-petal hover:text-warm-dark transition-all"
              onClick={() => onFindDupes?.(product)}
            >
              <Shuffle size={13} /> Find dupes
            </button>

            {product.source !== "mock" && (
              <a
                href={product.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 text-xs text-muted hover:text-warm-dark transition-colors"
              >
                Shop <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
