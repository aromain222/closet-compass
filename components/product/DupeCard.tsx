"use client";

import Image from "next/image";
import { ExternalLink, Heart, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import type { DupeComparison, DupeRecommendationLabel } from "@/lib/products/types";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "./MaterialBadge";
import { Button } from "@/components/ui/button";

/* ── Recommendation config ── */

type BadgeVariant = "success" | "blush" | "mauve" | "muted";

interface RecConfig {
  badge: BadgeVariant;
  label: string;
  note: string;
  accent: string;
}

const REC: Record<DupeRecommendationLabel, RecConfig> = {
  strong_dupe: {
    badge: "success",
    label: "Best Dupe",
    note: "Strong match — similar materials, meaningful savings.",
    accent: "border-l-[3px] border-l-green-300",
  },
  worth_the_splurge: {
    badge: "blush",
    label: "Worth the Splurge",
    note: "The original may be worth paying more for — materials or quality differ meaningfully.",
    accent: "border-l-[3px] border-l-blush",
  },
  consider: {
    badge: "mauve",
    label: "Consider",
    note: "Some trade-offs — review material and fit notes before buying.",
    accent: "border-l-[3px] border-l-mauve/60",
  },
  avoid: {
    badge: "muted",
    label: "Skip",
    note: "Material or quality gaps are too significant.",
    accent: "border-l-[3px] border-l-taupe/60",
  },
};

/* ── Fiber lines ── */

function fiberList(
  normalized: Array<{ fiber: string; percentage: number | null }>,
  raw: string[]
) {
  return normalized.length > 0 ? normalized : raw.map((f) => ({ fiber: f, percentage: null }));
}

function FiberLines({ fibers }: { fibers: Array<{ fiber: string; percentage: number | null }> }) {
  if (fibers.length === 0)
    return <span className="text-xs text-muted italic">Not disclosed</span>;
  return (
    <>
      {fibers.slice(0, 4).map((m, i) => (
        <span key={i} className="text-xs text-warm-dark leading-snug">
          {m.percentage != null && (
            <span className="text-muted text-[11px]">{m.percentage}%&thinsp;</span>
          )}
          {m.fiber}
        </span>
      ))}
    </>
  );
}

/* ── Card ── */

export interface DupeCardProps {
  comparison: DupeComparison;
  onSelect?: (c: DupeComparison) => void;
  onWishlist?: (c: DupeComparison) => void;
  wishlisted?: boolean;
}

export function DupeCard({ comparison, onSelect, onWishlist, wishlisted = false }: DupeCardProps) {
  const { sourceProduct: src, alternativeProduct: alt, score } = comparison;
  const cfg = REC[score.recommendation] ?? REC.consider;

  const saving = src.price - alt.price;
  const savingPct = saving > 0 ? Math.round((saving / src.price) * 100) : 0;

  const srcFibers = fiberList(src.normalizedMaterials, src.listedMaterials);
  const altFibers = fiberList(alt.normalizedMaterials, alt.listedMaterials);

  return (
    <article
      className={`bg-card rounded-2xl border border-soft card-shadow hover:card-shadow-hover transition-all overflow-hidden ${cfg.accent}`}
    >
      {/* ── Identity + price ── */}
      <div
        className="flex gap-4 p-5 cursor-pointer"
        onClick={() => onSelect?.(comparison)}
      >
        {/* Thumbnail */}
        <div className="relative w-24 shrink-0 rounded-xl overflow-hidden bg-petal">
          <div className="aspect-[3/4] relative">
            <Image
              src={alt.imageUrl}
              alt={alt.title}
              fill
              sizes="96px"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="absolute bottom-0 inset-x-0 p-1.5 bg-gradient-to-t from-warm-dark/70 to-transparent flex justify-center">
            <Badge variant={cfg.badge} className="text-[10px] max-w-full truncate">
              {cfg.label}
            </Badge>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <p className="text-[11px] text-muted uppercase tracking-[0.12em] font-medium">{alt.brand}</p>
            <h3 className="text-sm font-medium text-warm-dark leading-snug line-clamp-2">{alt.title}</h3>
            <p className="text-xs text-muted">{alt.retailer}</p>
          </div>

          {/* Price comparison */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xl font-semibold text-warm-dark">${alt.price}</span>
            <span className="text-sm text-muted line-through">${src.price}</span>
            {saving > 0 && (
              <span className="flex items-center gap-1 text-xs font-semibold text-green-700">
                <TrendingDown size={11} />
                Save ${saving.toFixed(0)} ({savingPct}%)
              </span>
            )}
            {saving < 0 && (
              <span className="flex items-center gap-1 text-xs text-muted">
                <TrendingUp size={11} />
                ${Math.abs(saving).toFixed(0)} more than original
              </span>
            )}
          </div>

          <p className="text-xs text-muted italic leading-relaxed">{cfg.note}</p>
        </div>
      </div>

      {/* ── Material comparison ── */}
      <div className="mx-5 mb-4 rounded-xl border border-soft overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-soft">
          <div className="p-3 bg-petal/50">
            <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-2">Original</p>
            <div className="flex flex-col gap-0.5">
              <FiberLines fibers={srcFibers} />
            </div>
          </div>
          <div className="p-3 bg-card">
            <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-2">This dupe</p>
            <div className="flex flex-col gap-0.5">
              <FiberLines fibers={altFibers} />
            </div>
          </div>
        </div>
        {score.materialExplanation && (
          <div className="px-3 py-2.5 border-t border-soft">
            <p className="text-xs text-muted leading-relaxed">{score.materialExplanation}</p>
          </div>
        )}
      </div>

      {/* ── Side-by-side quality scores ── */}
      {(src.softnessScore > 0 || alt.softnessScore > 0 ||
        src.breathabilityScore > 0 || alt.breathabilityScore > 0) && (
        <div className="mx-5 mb-4 space-y-1.5">
          <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Quality scores</p>
          {([
            { label: "Softness",      srcV: src.softnessScore,      altV: alt.softnessScore,      color: "bg-blush" },
            { label: "Breathability", srcV: src.breathabilityScore, altV: alt.breathabilityScore, color: "bg-lavender" },
            { label: "Opacity",       srcV: src.opacityScore,       altV: alt.opacityScore,       color: "bg-mauve" },
            { label: "Durability",    srcV: src.durabilityScore,    altV: alt.durabilityScore,    color: "bg-taupe" },
            { label: "Stretch",       srcV: src.stretchScore,       altV: alt.stretchScore,       color: "bg-lavender" },
          ] as const).filter((s) => s.srcV > 0 || s.altV > 0).map((s) => {
            const diff = s.altV - s.srcV;
            return (
              <div key={s.label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                {/* Original bar (right-aligned) */}
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-[10px] tabular-nums text-muted">{s.srcV}</span>
                  <div className="w-16 h-1.5 bg-petal rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} opacity-50 rounded-full ml-auto`} style={{ width: `${s.srcV}%` }} />
                  </div>
                </div>
                {/* Label + diff */}
                <div className="text-center min-w-[68px]">
                  <span className="text-[10px] text-muted block">{s.label}</span>
                  {diff !== 0 && (
                    <span className={`text-[10px] font-semibold ${diff < -8 ? "text-red-400" : diff > 8 ? "text-green-600" : "text-muted"}`}>
                      {diff > 0 ? `+${diff}` : diff}
                    </span>
                  )}
                </div>
                {/* Dupe bar (left-aligned) */}
                <div className="flex items-center gap-1">
                  <div className="w-16 h-1.5 bg-petal rounded-full overflow-hidden">
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
            <span>This dupe</span>
          </div>
        </div>
      )}

      {/* ── Match scores ── */}
      <div className="mx-5 mb-4 space-y-2">
        <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Match scores</p>
        <ScoreBar label="Overall" score={score.finalDupeScore} color="bg-blush" />
        <ScoreBar label="Material" score={score.materialSimilarity} color="bg-lavender" />
        <ScoreBar label="Fit" score={score.fitSimilarity} color="bg-taupe" />
      </div>

      {/* ── Explanation ── */}
      {score.explanation && (
        <p className="mx-5 mb-4 text-xs text-muted leading-relaxed border-l-2 border-blush/40 pl-3 italic">
          {score.explanation}
        </p>
      )}

      {/* ── Risk notes ── */}
      {score.risks.length > 0 && (
        <div className="mx-5 mb-4 rounded-xl bg-taupe/10 border border-taupe/25 px-3 py-2.5 space-y-1">
          <p className="text-[10px] text-warm-mid uppercase tracking-wider font-semibold flex items-center gap-1">
            <AlertTriangle size={10} /> Risk notes
          </p>
          {score.risks.map((r, i) => (
            <p key={i} className="text-xs text-warm-mid leading-snug">{r}</p>
          ))}
        </div>
      )}

      {/* ── CTAs ── */}
      <div className="flex gap-2 px-5 pb-5 pt-2 border-t border-soft">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1.5"
          onClick={(e) => { e.stopPropagation(); onWishlist?.(comparison); }}
        >
          <Heart size={13} fill={wishlisted ? "currentColor" : "none"} />
          {wishlisted ? "Saved" : "Save"}
        </Button>
        {alt.source !== "mock" && (
          <a
            href={alt.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full border border-border-strong text-warm-mid hover:border-mauve hover:bg-lavender/10 hover:text-warm-dark transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            See price <ExternalLink size={12} />
          </a>
        )}
      </div>
    </article>
  );
}
