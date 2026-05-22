"use client";

import { useEffect } from "react";
import Image from "next/image";
import { X, ExternalLink, Heart, Tag } from "lucide-react";
import type { ProductResult } from "@/lib/products/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "./MaterialBadge";

interface ProductModalProps {
  product: ProductResult | null;
  onClose: () => void;
  onWishlist?: (product: ProductResult) => void;
  onFindDupes?: (product: ProductResult) => void;
  onTrack?: (product: ProductResult) => void;
  wishlisted?: boolean;
}

export function ProductModal({ product, onClose, onWishlist, onFindDupes, onTrack, wishlisted }: ProductModalProps) {
  useEffect(() => {
    if (!product) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [product, onClose]);

  if (!product) return null;

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-warm-dark/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-2xl bg-card rounded-t-3xl sm:rounded-3xl modal-shadow overflow-hidden max-h-[92dvh] flex flex-col">
        {/* Close */}
        <button
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-petal flex items-center justify-center text-muted hover:text-warm-dark transition-colors"
          onClick={onClose}
        >
          <X size={16} />
        </button>

        <div className="overflow-y-auto flex-1 scrollbar-hide">
          <div className="flex flex-col sm:flex-row">
            {/* Image */}
            <div className="relative sm:w-56 aspect-[3/4] sm:aspect-auto sm:h-auto bg-petal shrink-0">
              <Image
                src={product.imageUrl}
                alt={product.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 224px"
                unoptimized
              />
            </div>

            {/* Content */}
            <div className="flex-1 p-5 space-y-5">
              <div>
                <p className="text-[11px] text-muted uppercase tracking-widest font-medium">{product.brand}</p>
                <h2 className="font-display text-2xl font-light mt-1 leading-snug">{product.title}</h2>
                <p className="text-sm text-muted mt-1">{product.retailer}</p>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-warm-dark">${product.price}</span>
                {product.originalPrice && (
                  <span className="text-sm text-muted line-through">${product.originalPrice}</span>
                )}
                {discount > 0 && (
                  <Badge variant="blush">−{discount}%</Badge>
                )}
              </div>

              <p className="text-sm text-warm-mid leading-relaxed">{product.description}</p>

              {/* Materials */}
              {product.listedMaterials.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-warm-mid uppercase tracking-wider mb-2">Materials</p>
                  <div className="flex flex-wrap gap-1.5">
                    {product.normalizedMaterials.map((m) => (
                      <Badge key={m.fiber} variant="taupe">
                        {m.percentage ? `${m.percentage}% ` : ""}{m.fiber}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Quality scores */}
              <div>
                <p className="text-xs font-semibold text-warm-mid uppercase tracking-wider mb-3">Fabric quality</p>
                <div className="space-y-2">
                  <ScoreBar label="Softness" score={product.softnessScore} color="bg-blush" />
                  <ScoreBar label="Breathability" score={product.breathabilityScore} color="bg-lavender" />
                  <ScoreBar label="Opacity" score={product.opacityScore} color="bg-mauve" />
                  <ScoreBar label="Durability" score={product.durabilityScore} color="bg-taupe" />
                  <ScoreBar label="Stretch" score={product.stretchScore} color="bg-lavender" />
                </div>
              </div>

              {/* Colors & sizes */}
              {product.colors.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {product.colors.map((c) => (
                    <Badge key={c} variant="muted">{c}</Badge>
                  ))}
                </div>
              )}

              {product.reviewSummary && (
                <p className="text-sm text-muted italic border-l-2 border-blush/50 pl-3">{product.reviewSummary}</p>
              )}

              {/* Care */}
              {product.careInstructions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-warm-mid uppercase tracking-wider mb-1.5">Care</p>
                  <p className="text-sm text-muted">{product.careInstructions.join(" · ")}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-soft flex flex-wrap gap-2">
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={() => onWishlist?.(product)}
          >
            <Heart size={14} fill={wishlisted ? "currentColor" : "none"} />
            {wishlisted ? "Wishlisted" : "Save to wishlist"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => onFindDupes?.(product)}>
            <Tag size={14} /> Find dupes
          </Button>
          <Button variant="outline" size="sm" onClick={() => onTrack?.(product)}>
            Track price
          </Button>
          <a
            href={product.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-warm-dark transition-colors px-3 py-2"
          >
            Shop <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}
