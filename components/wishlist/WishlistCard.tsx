"use client";

import Image from "next/image";
import { Trash2, TrendingDown, ExternalLink } from "lucide-react";
import type { WishlistItem } from "@/lib/products/types";
import { Badge } from "@/components/ui/badge";

interface WishlistCardProps {
  item: WishlistItem;
  onRemove?: (item: WishlistItem) => void;
  onSelect?: (item: WishlistItem) => void;
}

const priorityStyles: Record<string, { badge: "blush" | "mauve" | "muted"; label: string }> = {
  high: { badge: "blush", label: "High priority" },
  medium: { badge: "mauve", label: "Medium" },
  low: { badge: "muted", label: "Low" },
};

export function WishlistCard({ item, onRemove, onSelect }: WishlistCardProps) {
  const { product } = item;
  const priority = item.priority ? priorityStyles[item.priority] : null;
  const atTarget = item.targetPrice && product.price <= item.targetPrice;

  return (
    <div
      className="flex gap-3 bg-card rounded-2xl border border-soft card-shadow p-3 hover:card-shadow-hover transition-all cursor-pointer"
      onClick={() => onSelect?.(item)}
    >
      {/* Image */}
      <div className="relative w-20 h-28 rounded-xl overflow-hidden bg-petal shrink-0">
        <Image
          src={product.imageUrl}
          alt={product.title}
          fill
          className="object-cover"
          sizes="80px"
          unoptimized
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div>
          <p className="text-[11px] text-muted uppercase tracking-widest font-medium">{product.brand}</p>
          <p className="text-sm font-medium text-warm-dark leading-snug line-clamp-2">{product.title}</p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-warm-dark text-sm">${product.price}</span>
          {item.targetPrice && (
            <span className="text-xs text-muted">
              target ${item.targetPrice}
            </span>
          )}
          {atTarget && <Badge variant="success"><TrendingDown size={10} className="mr-0.5" /> At target!</Badge>}
        </div>

        <div className="flex items-center gap-1.5">
          {priority && <Badge variant={priority.badge} size="sm">{priority.label}</Badge>}
          <Badge variant="warm" size="sm">{product.retailer}</Badge>
        </div>

        <p className="text-[11px] text-muted">
          Added {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center justify-between">
        <a
          href={product.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted hover:text-warm-dark transition-colors p-1"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={14} />
        </a>
        <button
          className="text-muted hover:text-red-400 transition-colors p-1"
          onClick={(e) => { e.stopPropagation(); onRemove?.(item); }}
          aria-label="Remove from wishlist"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
