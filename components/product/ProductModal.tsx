"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  X, ExternalLink, Heart, Shuffle, TrendingUp,
  CheckCircle, AlertCircle, Minus,
} from "lucide-react";
import type {
  ProductResult, MaterialProfile, BudgetStatus,
  PriceHistoryPoint,
} from "@/lib/products/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { PriceHistoryChart } from "@/components/wishlist/PriceHistoryChart";

export interface ProductModalProps {
  product: ProductResult | null;
  onClose: () => void;
  onWishlist?: (product: ProductResult) => void;
  onFindDupes?: (product: ProductResult) => void;
  onTrack?: (product: ProductResult) => void;
  wishlisted?: boolean;
  tracked?: boolean;
  userId?: string;
  budgetStatus?: BudgetStatus;
}

/* ── helpers ── */

function attrLabel(level: string): { text: string; variant: "success" | "mauve" | "muted" | "taupe" } {
  switch (level) {
    case "high":      return { text: "High",      variant: "success" };
    case "medium":    return { text: "Medium",    variant: "mauve" };
    case "low":       return { text: "Low",       variant: "muted" };
    case "light":     return { text: "Light",     variant: "muted" };
    case "midweight": return { text: "Midweight", variant: "taupe" };
    case "heavy":     return { text: "Heavy",     variant: "mauve" };
    default:          return { text: "—",         variant: "taupe" };
  }
}

function ScoreRow({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted w-[88px] shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-petal overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(100, score)}%` }} />
      </div>
      <span className="text-xs text-warm-mid w-7 text-right tabular-nums">{score}</span>
    </div>
  );
}

function FiberChip({ fiber, pct }: { fiber: string; pct?: number | null }) {
  return (
    <span className="inline-flex items-center gap-1 bg-lavender/15 border border-lavender/35 text-warm-dark text-xs font-medium px-3 py-1 rounded-full">
      {pct != null ? <span className="text-muted text-[11px]">{pct}%</span> : null}
      {fiber}
    </span>
  );
}

function ConfidenceRow({ label }: { label: "high" | "medium" | "low" }) {
  if (label === "high")
    return (
      <span className="flex items-center gap-1 text-[11px] font-medium text-green-700">
        <CheckCircle size={11} /> Quality verified
      </span>
    );
  if (label === "medium")
    return (
      <span className="flex items-center gap-1 text-[11px] font-medium text-mauve-dark">
        <Minus size={11} /> Mostly verified
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-[11px] font-medium text-muted">
      <AlertCircle size={11} /> Unverified
    </span>
  );
}

function tagLabel(tag: string) {
  return tag.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const BUDGET_COPY: Record<BudgetStatus, string | null> = {
  under_budget: null,
  near_limit: "You're getting close to your shopping budget — might be a good one to save for later.",
  over_budget: "You're over your shopping budget this month. This one could wait until next month.",
};

/* ── modal ── */

export function ProductModal({
  product,
  onClose,
  onWishlist,
  onFindDupes,
  onTrack,
  wishlisted = false,
  tracked = false,
  userId,
  budgetStatus,
}: ProductModalProps) {
  const [profile, setProfile] = useState<MaterialProfile | null>(null);
  const [history, setHistory] = useState<PriceHistoryPoint[]>([]);

  useEffect(() => {
    if (!product) return;

    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";

    setProfile(null);
    setHistory([]);

    api.getProduct(product.id)
      .then((res) => setProfile(res.materialProfile))
      .catch(() => null);

    if (userId) {
      api.getPriceHistory(product.id, userId)
        .then((res) => setHistory(res.priceHistory ?? []))
        .catch(() => null);
    }

    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [product?.id, onClose, userId]);

  if (!product) return null;

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const fibers =
    product.normalizedMaterials.length > 0
      ? product.normalizedMaterials
      : product.listedMaterials.map((f) => ({ fiber: f, percentage: null }));

  const budgetNote = budgetStatus ? BUDGET_COPY[budgetStatus] : null;

  const hasScores =
    product.softnessScore > 0 ||
    product.breathabilityScore > 0 ||
    product.durabilityScore > 0 ||
    product.opacityScore > 0 ||
    product.stretchScore > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-warm-dark/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-2xl bg-card rounded-t-3xl sm:rounded-3xl modal-shadow overflow-hidden max-h-[92dvh] flex flex-col">
        <button
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-petal flex items-center justify-center text-muted hover:text-warm-dark transition-colors"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 scrollbar-hide">

          {/* Hero */}
          <div className="flex flex-col sm:flex-row">
            <div className="relative w-full sm:w-56 aspect-[3/4] sm:aspect-auto bg-petal shrink-0">
              <Image
                src={product.imageUrl}
                alt={product.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 224px"
                unoptimized
              />
              {discount > 0 && (
                <span className="absolute bottom-3 left-3 bg-card/95 text-warm-dark text-[11px] font-semibold px-2 py-0.5 rounded-full">
                  −{discount}%
                </span>
              )}
            </div>

            <div className="flex-1 p-5 space-y-3">
              <div>
                <p className="text-[11px] text-muted uppercase tracking-[0.12em] font-medium">{product.brand}</p>
                <h2 className="font-display text-2xl font-light mt-1 leading-snug text-warm-dark">{product.title}</h2>
                <p className="text-xs text-muted mt-0.5">{product.retailer} · {product.category}</p>
              </div>

              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-semibold text-warm-dark">${product.price}</span>
                {product.originalPrice && (
                  <span className="text-sm text-muted line-through">${product.originalPrice}</span>
                )}
                {discount > 0 && <Badge variant="blush">−{discount}%</Badge>}
              </div>

              {product.colors.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {product.colors.map((c) => (
                    <Badge key={c} variant="muted" size="sm">{c}</Badge>
                  ))}
                </div>
              )}

              {product.sizes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {product.sizes.map((s) => (
                    <Badge key={s} variant="taupe" size="sm">{s}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Content ── */}
          <div className="p-5 space-y-6">

            {/* Why it matches */}
            {product.reviewSummary && (
              <div>
                <p className="text-[11px] font-semibold text-warm-mid uppercase tracking-wider mb-2">Why it matches</p>
                <p className="text-sm text-muted leading-relaxed italic border-l-2 border-blush/50 pl-3">
                  {product.reviewSummary}
                </p>
              </div>
            )}

            {/* Budget note */}
            {budgetNote && (
              <div className="bg-taupe/10 border border-taupe/25 rounded-xl px-4 py-3">
                <p className="text-xs text-warm-mid leading-relaxed">{budgetNote}</p>
              </div>
            )}

            {/* Fabric composition */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-warm-mid uppercase tracking-wider">Fabric composition</p>
                <ConfidenceRow label={product.materialConfidenceLabel} />
              </div>

              {fibers.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {fibers.map((m, i) => (
                    <FiberChip key={`${m.fiber}-${i}`} fiber={m.fiber} pct={m.percentage} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted italic">Fiber content not listed by retailer</p>
              )}

              {profile?.fabricFeel && (
                <p className="text-sm text-warm-mid leading-relaxed">
                  <span className="font-medium text-warm-dark">Feel — </span>
                  {profile.fabricFeel}
                </p>
              )}

              {profile && (
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { label: "Weight",       value: profile.weight },
                      { label: "Stretch",      value: profile.stretchLevel },
                      { label: "Opacity",      value: profile.opacity },
                      { label: "Breathability",value: profile.breathability },
                    ] as const
                  ).map(({ label, value }) => {
                    const { text, variant } = attrLabel(value);
                    return (
                      <div key={label} className="flex items-center justify-between bg-petal/60 rounded-xl px-3 py-2">
                        <span className="text-xs text-muted">{label}</span>
                        <Badge variant={variant} size="sm">{text}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}

              {profile?.performanceTags && profile.performanceTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {profile.performanceTags.map((tag) => (
                    <Badge key={tag} variant="lavender" size="sm">{tagLabel(tag)}</Badge>
                  ))}
                </div>
              )}

              {profile?.explanation && (
                <p className="text-xs text-muted leading-relaxed italic">{profile.explanation}</p>
              )}
            </div>

            {/* Quality profile */}
            {hasScores && (
              <div className="space-y-2.5">
                <p className="text-[11px] font-semibold text-warm-mid uppercase tracking-wider">Quality profile</p>
                <div className="space-y-2">
                  {product.softnessScore > 0 && (
                    <ScoreRow label="Softness" score={product.softnessScore} color="bg-blush" />
                  )}
                  {product.breathabilityScore > 0 && (
                    <ScoreRow label="Breathability" score={product.breathabilityScore} color="bg-lavender" />
                  )}
                  {product.opacityScore > 0 && (
                    <ScoreRow label="Opacity" score={product.opacityScore} color="bg-mauve" />
                  )}
                  {product.durabilityScore > 0 && (
                    <ScoreRow label="Durability" score={product.durabilityScore} color="bg-taupe" />
                  )}
                  {product.stretchScore > 0 && (
                    <ScoreRow label="Stretch" score={product.stretchScore} color="bg-lavender" />
                  )}
                </div>
              </div>
            )}

            {/* Care */}
            {product.careInstructions.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-warm-mid uppercase tracking-wider mb-1.5">Care</p>
                <p className="text-xs text-muted">{product.careInstructions.join(" · ")}</p>
              </div>
            )}

            {/* Price history */}
            {history.length > 1 && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-warm-mid uppercase tracking-wider">Price history</p>
                <PriceHistoryChart history={history} targetPrice={null} />
              </div>
            )}
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="p-4 border-t border-soft flex flex-wrap gap-2 bg-card">
          <Button
            variant="primary"
            size="sm"
            className="flex-1 min-w-[110px]"
            onClick={() => onWishlist?.(product)}
          >
            <Heart size={13} fill={wishlisted ? "currentColor" : "none"} />
            {wishlisted ? "Wishlisted" : "Save"}
          </Button>
          <Button
            variant={tracked ? "secondary" : "outline"}
            size="sm"
            onClick={() => onTrack?.(product)}
          >
            <TrendingUp size={13} />
            {tracked ? "Tracking" : "Track price"}
          </Button>
          {onFindDupes && (
            <Button variant="outline" size="sm" onClick={() => onFindDupes(product)}>
              <Shuffle size={13} /> Dupes
            </Button>
          )}
          {product.source !== "mock" && (
            <a
              href={product.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-warm-dark transition-colors px-3 py-2 ml-auto"
            >
              Shop <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
