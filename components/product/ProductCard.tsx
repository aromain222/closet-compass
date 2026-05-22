"use client";

import Image from "next/image";
import { Heart, ExternalLink } from "lucide-react";
import type { ProductResult } from "@/lib/products/types";
import { MaterialBadge } from "./MaterialBadge";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: ProductResult;
  onSelect?: (product: ProductResult) => void;
  onWishlist?: (product: ProductResult) => void;
  wishlisted?: boolean;
  compact?: boolean;
}

export function ProductCard({ product, onSelect, onWishlist, wishlisted = false, compact = false }: ProductCardProps) {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div
      className="group bg-card rounded-2xl border border-soft card-shadow hover:card-shadow-hover transition-all overflow-hidden cursor-pointer"
      onClick={() => onSelect?.(product)}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] bg-petal overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          unoptimized
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-blush text-warm-dark text-[11px] font-medium px-2 py-0.5 rounded-full">
            −{discount}%
          </span>
        )}
        <button
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            wishlisted
              ? "bg-blush text-warm-dark"
              : "bg-card/80 text-muted hover:bg-blush hover:text-warm-dark backdrop-blur-sm"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onWishlist?.(product);
          }}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={14} fill={wishlisted ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Info */}
      <div className={`p-3 space-y-2 ${compact ? "p-2 space-y-1" : ""}`}>
        <div>
          <p className="text-[11px] text-muted uppercase tracking-widest font-medium">{product.brand}</p>
          <p className={`font-medium text-warm-dark leading-snug line-clamp-2 ${compact ? "text-sm" : "text-sm"}`}>
            {product.title}
          </p>
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="font-semibold text-warm-dark text-sm">${product.price}</span>
          {product.originalPrice && (
            <span className="text-[12px] text-muted line-through">${product.originalPrice}</span>
          )}
        </div>

        {!compact && (
          <MaterialBadge
            label={product.materialConfidenceLabel}
            fibers={product.normalizedMaterials.slice(0, 2).map((m) => m.fiber)}
          />
        )}

        {!compact && (
          <div className="flex items-center justify-between pt-1">
            <Badge variant="warm" size="sm">{product.category}</Badge>
            <a
              href={product.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-warm-dark transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={13} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
