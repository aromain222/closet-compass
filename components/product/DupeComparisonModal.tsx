"use client";

import { useEffect } from "react";
import Image from "next/image";
import { X, ExternalLink, Heart, AlertTriangle, TrendingDown } from "lucide-react";
import type { DupeComparison, DupeRecommendationLabel } from "@/lib/products/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreBar } from "./MaterialBadge";

type BadgeVariant = "success" | "blush" | "mauve" | "muted";
interface RecConfig { badge: BadgeVariant; label: string; note: string; }

const REC: Record<DupeRecommendationLabel, RecConfig> = {
  strong_dupe:       { badge: "success", label: "Best Dupe",          note: "Strong match — similar materials, meaningful savings." },
  worth_the_splurge: { badge: "blush",   label: "Worth the Splurge",  note: "The original may be worth paying more for." },
  consider:          { badge: "mauve",   label: "Consider",           note: "Some trade-offs — review materials before buying." },
  avoid:             { badge: "muted",   label: "Skip",               note: "Material or quality gaps are too significant." },
};

function fiberList(normalized: Array<{ fiber: string; percentage: number | null }>, raw: string[]) {
  return normalized.length > 0 ? normalized : raw.map((f) => ({ fiber: f, percentage: null }));
}

interface Props {
  comparison: DupeComparison | null;
  onClose: () => void;
  onWishlist?: (c: DupeComparison) => void;
  wishlisted?: boolean;
}

export function DupeComparisonModal({ comparison, onClose, onWishlist, wishlisted = false }: Props) {
  useEffect(() => {
    if (!comparison) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [comparison, onClose]);

  if (!comparison) return null;

  const { sourceProduct: src, alternativeProduct: alt, score } = comparison;
  const cfg = REC[score.recommendation] ?? REC.consider;
  const saving = src.price - alt.price;
  const savingPct = saving > 0 ? Math.round((saving / src.price) * 100) : 0;
  const srcFibers = fiberList(src.normalizedMaterials, src.listedMaterials);
  const altFibers = fiberList(alt.normalizedMaterials, alt.listedMaterials);

  const qualityRows = [
    { label: "Softness",      srcV: src.softnessScore,      altV: alt.softnessScore,      color: "bg-blush" },
    { label: "Breathability", srcV: src.breathabilityScore, altV: alt.breathabilityScore, color: "bg-lavender" },
    { label: "Opacity",       srcV: src.opacityScore,       altV: alt.opacityScore,       color: "bg-mauve" },
    { label: "Durability",    srcV: src.durabilityScore,    altV: alt.durabilityScore,    color: "bg-taupe" },
    { label: "Stretch",       srcV: src.stretchScore,       altV: alt.stretchScore,       color: "bg-lavender" },
  ].filter((r) => r.srcV > 0 || r.altV > 0);

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

        <div className="overflow-y-auto flex-1 scrollbar-hide">

          {/* Recommendation + savings */}
          <div className="px-5 pt-5 pb-4 border-b border-soft space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={cfg.badge}>{cfg.label}</Badge>
              <span className="text-xs text-muted">{cfg.note}</span>
            </div>
            {saving > 0 && (
              <p className="flex items-center gap-1 text-sm font-semibold text-green-700">
                <TrendingDown size={14} />
                Save ${saving.toFixed(0)} ({savingPct}% cheaper than original)
              </p>
            )}
          </div>

          {/* Side-by-side product headers */}
          <div className="grid grid-cols-2 divide-x divide-soft border-b border-soft">
            <div className="p-4 space-y-2">
              <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Original</p>
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-petal">
                <Image src={src.imageUrl} alt={src.title} fill sizes="200px" className="object-cover" unoptimized />
              </div>
              <div>
                <p className="text-[11px] text-muted uppercase tracking-wider font-medium">{src.brand}</p>
                <p className="text-sm font-medium text-warm-dark leading-snug line-clamp-2">{src.title}</p>
                <p className="text-lg font-semibold text-warm-dark mt-1">${src.price}</p>
              </div>
            </div>

            <div className="p-4 space-y-2">
              <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Dupe</p>
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-petal">
                <Image src={alt.imageUrl} alt={alt.title} fill sizes="200px" className="object-cover" unoptimized />
              </div>
              <div>
                <p className="text-[11px] text-muted uppercase tracking-wider font-medium">{alt.brand}</p>
                <p className="text-sm font-medium text-warm-dark leading-snug line-clamp-2">{alt.title}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-lg font-semibold text-warm-dark">${alt.price}</p>
                  {saving > 0 && (
                    <span className="text-xs font-semibold text-green-700">−{savingPct}%</span>
                  )}
                </div>
                <p className="text-xs text-muted">{alt.retailer}</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-6">

            {/* Materials */}
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-3">Materials</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted mb-1">Original</p>
                  {srcFibers.length === 0
                    ? <span className="text-xs text-muted italic">Not disclosed</span>
                    : srcFibers.slice(0, 4).map((m, i) => (
                      <p key={i} className="text-xs text-warm-dark leading-snug">
                        {m.percentage != null && <span className="text-muted text-[11px]">{m.percentage}% </span>}
                        {m.fiber}
                      </p>
                    ))
                  }
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted mb-1">Dupe</p>
                  {altFibers.length === 0
                    ? <span className="text-xs text-muted italic">Not disclosed</span>
                    : altFibers.slice(0, 4).map((m, i) => (
                      <p key={i} className="text-xs text-warm-dark leading-snug">
                        {m.percentage != null && <span className="text-muted text-[11px]">{m.percentage}% </span>}
                        {m.fiber}
                      </p>
                    ))
                  }
                </div>
              </div>
              {score.materialExplanation && (
                <p className="text-xs text-muted mt-3 leading-relaxed italic border-l-2 border-blush/40 pl-3">
                  {score.materialExplanation}
                </p>
              )}
            </div>

            {/* Quality comparison */}
            {qualityRows.length > 0 && (
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-3">Quality comparison</p>
                <div className="space-y-2.5">
                  {qualityRows.map((s) => {
                    const diff = s.altV - s.srcV;
                    return (
                      <div key={s.label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="text-[10px] tabular-nums text-muted">{s.srcV}</span>
                          <div className="w-20 h-2 bg-petal rounded-full overflow-hidden">
                            <div className={`h-full ${s.color} opacity-50 rounded-full ml-auto`} style={{ width: `${s.srcV}%` }} />
                          </div>
                        </div>
                        <div className="text-center min-w-[80px]">
                          <span className="text-[10px] text-muted block">{s.label}</span>
                          {diff !== 0 && (
                            <span className={`text-[10px] font-semibold ${diff < -8 ? "text-red-400" : diff > 8 ? "text-green-600" : "text-muted"}`}>
                              {diff > 0 ? `+${diff}` : diff}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-20 h-2 bg-petal rounded-full overflow-hidden">
                            <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.altV}%` }} />
                          </div>
                          <span className="text-[10px] tabular-nums text-muted">{s.altV}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div className="grid grid-cols-[1fr_auto_1fr] text-[10px] text-muted/50 pt-0.5">
                    <span className="text-right">Original</span>
                    <span />
                    <span>Dupe</span>
                  </div>
                </div>
              </div>
            )}

            {/* Match scores */}
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-3">Match scores</p>
              <div className="space-y-2">
                <ScoreBar label="Overall"  score={score.finalDupeScore}      color="bg-blush" />
                <ScoreBar label="Material" score={score.materialSimilarity}  color="bg-lavender" />
                <ScoreBar label="Fit"      score={score.fitSimilarity}       color="bg-taupe" />
              </div>
            </div>

            {/* Explanation */}
            {score.explanation && (
              <p className="text-xs text-muted leading-relaxed border-l-2 border-blush/40 pl-3 italic">
                {score.explanation}
              </p>
            )}

            {/* Risk notes */}
            {score.risks.length > 0 && (
              <div className="rounded-xl bg-taupe/10 border border-taupe/25 px-3 py-2.5 space-y-1">
                <p className="text-[10px] text-warm-mid uppercase tracking-wider font-semibold flex items-center gap-1">
                  <AlertTriangle size={10} /> Risk notes
                </p>
                {score.risks.map((r, i) => (
                  <p key={i} className="text-xs text-warm-mid leading-snug">{r}</p>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-soft flex gap-2 bg-card flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1.5"
            onClick={() => onWishlist?.(comparison)}
          >
            <Heart size={13} fill={wishlisted ? "currentColor" : "none"} />
            {wishlisted ? "Saved" : "Save dupe"}
          </Button>
          <div className="ml-auto flex gap-2">
            {src.source !== "mock" && (
              <a
                href={src.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full border border-soft text-muted hover:text-warm-dark transition-all"
              >
                Original <ExternalLink size={12} />
              </a>
            )}
            {alt.source !== "mock" && (
              <a
                href={alt.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full border border-border-strong text-warm-mid hover:border-mauve hover:bg-lavender/10 hover:text-warm-dark transition-all"
              >
                See deal <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
