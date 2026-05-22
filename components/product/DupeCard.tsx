"use client";

import Image from "next/image";
import { ExternalLink, Heart } from "lucide-react";
import type { DupeComparison } from "@/lib/products/types";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "./MaterialBadge";
import { Button } from "@/components/ui/button";

interface DupeCardProps {
  comparison: DupeComparison;
  onSelect?: (comparison: DupeComparison) => void;
  onWishlist?: (comparison: DupeComparison) => void;
  wishlisted?: boolean;
}

const labelStyles: Record<string, { badge: "success" | "mauve" | "muted" | "blush"; text: string }> = {
  strong_dupe: { badge: "success", text: "Strong dupe" },
  worth_the_splurge: { badge: "blush", text: "Worth the splurge" },
  consider: { badge: "mauve", text: "Consider" },
  avoid: { badge: "muted", text: "Avoid" },
};

export function DupeCard({ comparison, onSelect, onWishlist, wishlisted }: DupeCardProps) {
  const { alternativeProduct: alt, score } = comparison;
  const saving = comparison.sourceProduct.price - alt.price;
  const { badge, text } = labelStyles[score.recommendation] ?? { badge: "muted", text: score.recommendation };

  return (
    <div
      className="bg-card rounded-2xl border border-soft card-shadow hover:card-shadow-hover transition-all cursor-pointer overflow-hidden"
      onClick={() => onSelect?.(comparison)}
    >
      <div className="flex gap-3 p-3">
        {/* Image */}
        <div className="relative w-24 h-32 rounded-xl overflow-hidden bg-petal shrink-0">
          <Image
            src={alt.imageUrl}
            alt={alt.title}
            fill
            className="object-cover"
            sizes="96px"
            unoptimized
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <p className="text-[11px] text-muted uppercase tracking-widest font-medium">{alt.brand}</p>
            <p className="text-sm font-medium text-warm-dark leading-snug line-clamp-2">{alt.title}</p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-warm-dark">${alt.price}</span>
            {saving > 0 && (
              <Badge variant="success">Save ${saving}</Badge>
            )}
            <Badge variant={badge}>{text}</Badge>
          </div>

          <div className="space-y-1.5">
            <ScoreBar label="Match" score={score.finalDupeScore} color="bg-blush" />
            <ScoreBar label="Material" score={score.materialSimilarity} color="bg-lavender" />
          </div>

          <p className="text-xs text-muted line-clamp-2">{score.explanation}</p>
        </div>
      </div>

      {/* Risks */}
      {score.risks.length > 0 && (
        <div className="px-3 pb-3">
          <p className="text-[11px] text-muted">
            ⚠ {score.risks.slice(0, 2).join(" · ")}
          </p>
        </div>
      )}

      <div className="flex gap-2 px-3 pb-3">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 justify-center"
          onClick={(e) => { e.stopPropagation(); onWishlist?.(comparison); }}
        >
          <Heart size={13} fill={wishlisted ? "currentColor" : "none"} />
          {wishlisted ? "Saved" : "Save"}
        </Button>
        <a
          href={alt.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-medium text-muted hover:text-warm-dark transition-colors py-2"
          onClick={(e) => e.stopPropagation()}
        >
          Shop <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}
