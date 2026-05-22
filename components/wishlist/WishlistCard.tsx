"use client";

import Image from "next/image";
import { Trash2, Shuffle, ExternalLink, TrendingDown, CheckCircle, BarChart2, TrendingUp } from "lucide-react";
import type { WishlistItem } from "@/lib/products/types";
import { Badge } from "@/components/ui/badge";

interface WishlistCardProps {
  item: WishlistItem;
  tracked?: boolean;
  historyOpen?: boolean;
  onSelect?: (item: WishlistItem) => void;
  onRemove?: (item: WishlistItem) => void;
  onFindDupes?: (item: WishlistItem) => void;
  onTrack?: (item: WishlistItem) => void;
  onToggleHistory?: (item: WishlistItem) => void;
}

const priorityConfig: Record<string, { badge: "blush" | "mauve" | "muted"; label: string }> = {
  high: { badge: "blush", label: "High priority" },
  medium: { badge: "mauve", label: "Maybe buy" },
  low: { badge: "muted", label: "Saved for later" },
};

export function WishlistCard({
  item,
  tracked = false,
  historyOpen = false,
  onSelect,
  onRemove,
  onFindDupes,
  onTrack,
  onToggleHistory,
}: WishlistCardProps) {
  const { product } = item;
  const isTracked = tracked || item.targetPrice != null;

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const fibers =
    product.normalizedMaterials.length > 0
      ? product.normalizedMaterials
      : product.listedMaterials.map((f) => ({ fiber: f, percentage: null }));

  const priority = item.priority ? priorityConfig[item.priority] : null;

  return (
    <article className="bg-card rounded-2xl border border-soft card-shadow hover:card-shadow-hover transition-all overflow-hidden">
      {/* ── Main row ── */}
      <div className="flex gap-4 p-4">
        {/* Image */}
        <div
          className="relative w-[72px] shrink-0 rounded-xl overflow-hidden bg-petal cursor-pointer"
          onClick={() => onSelect?.(item)}
        >
          <div className="aspect-[3/4] relative">
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              sizes="72px"
              className="object-cover"
              unoptimized
            />
          </div>
          {discount > 0 && (
            <span className="absolute top-1.5 left-1.5 bg-card/90 text-warm-dark text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
              −{discount}%
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 cursor-pointer" onClick={() => onSelect?.(item)}>
              <p className="text-[11px] text-muted uppercase tracking-[0.12em] font-medium">{product.brand}</p>
              <h3 className="text-sm font-medium text-warm-dark leading-snug line-clamp-2">{product.title}</h3>
              <p className="text-xs text-muted">{product.retailer}</p>
            </div>
            <button
              className="shrink-0 text-muted hover:text-red-400 transition-colors p-1"
              onClick={() => onRemove?.(item)}
              aria-label="Remove from wishlist"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-base font-semibold text-warm-dark">${product.price}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-muted line-through">${product.originalPrice}</span>
            )}
            {discount > 0 && (
              <span className="flex items-center gap-0.5 text-xs font-semibold text-green-700">
                <TrendingDown size={11} />
                Save ${(product.originalPrice! - product.price).toFixed(0)}
              </span>
            )}
          </div>

          {/* Material chips */}
          {fibers.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {fibers.slice(0, 3).map((m, i) => (
                <Badge key={i} variant="lavender">
                  {m.percentage != null && (
                    <span className="text-[10px] text-muted mr-0.5">{m.percentage}%</span>
                  )}
                  {m.fiber}
                </Badge>
              ))}
            </div>
          )}

          {/* Status badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {priority && <Badge variant={priority.badge}>{priority.label}</Badge>}
            {isTracked && (
              <Badge variant="lavender">
                <CheckCircle size={10} className="mr-0.5" /> Tracking
              </Badge>
            )}
            {item.targetPrice && (
              <span className="text-[11px] text-muted">target ${item.targetPrice}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── CTA row ── */}
      <div className="flex items-center gap-1.5 px-4 pb-4 pt-3 border-t border-soft flex-wrap">
        <button
          className="text-xs font-medium px-3 py-1.5 rounded-full border border-border-strong text-warm-mid hover:border-mauve hover:bg-lavender/10 hover:text-warm-dark transition-all"
          onClick={() => onSelect?.(item)}
        >
          View details
        </button>
        <button
          className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border border-border-strong text-warm-mid hover:border-mauve hover:bg-lavender/10 hover:text-warm-dark transition-all"
          onClick={() => onFindDupes?.(item)}
        >
          <Shuffle size={11} /> Find dupe
        </button>

        {!isTracked ? (
          <button
            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border border-border-strong text-warm-mid hover:border-lavender hover:bg-lavender/10 hover:text-warm-dark transition-all"
            onClick={() => onTrack?.(item)}
          >
            <TrendingUp size={11} /> Track price
          </button>
        ) : (
          <button
            className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
              historyOpen
                ? "border-mauve bg-lavender/20 text-warm-dark"
                : "border-lavender/50 bg-lavender/10 text-warm-dark"
            }`}
            onClick={() => onToggleHistory?.(item)}
          >
            <BarChart2 size={11} />
            {historyOpen ? "Hide history" : "Price history"}
          </button>
        )}

        {product.source !== "mock" && (
          <a
            href={product.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-muted hover:text-warm-dark transition-colors"
          >
            <ExternalLink size={13} />
          </a>
        )}
      </div>
    </article>
  );
}
