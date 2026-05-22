import type { BudgetShoppingRecommendation } from "@/lib/products/types";
import { Badge } from "@/components/ui/badge";

interface RecommendationCardProps {
  rec: BudgetShoppingRecommendation;
}

const actionStyles: Record<string, { badge: "success" | "blush" | "muted" | "mauve"; label: string }> = {
  buy_now: { badge: "success", label: "Buy now" },
  wait_for_drop: { badge: "blush", label: "Wait for drop" },
  skip_for_budget: { badge: "muted", label: "Skip for now" },
  review_materials: { badge: "mauve", label: "Review materials" },
};

export function RecommendationCard({ rec }: RecommendationCardProps) {
  const style = actionStyles[rec.recommendation] ?? { badge: "muted", label: rec.recommendation };

  return (
    <div className="flex items-start gap-3 bg-card rounded-2xl border border-soft card-shadow p-4">
      <div className="flex-1 min-w-0 space-y-2">
        <div>
          <p className="text-[11px] text-muted uppercase tracking-widest font-medium">{rec.brand}</p>
          <p className="text-sm font-medium text-warm-dark leading-snug line-clamp-2">{rec.title}</p>
          <p className="text-xs text-muted">{rec.retailer}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-warm-dark text-sm">${rec.price}</span>
          {rec.targetPrice && rec.price <= rec.targetPrice && (
            <Badge variant="success" size="sm">At target</Badge>
          )}
          <Badge variant={style.badge} size="sm">{style.label}</Badge>
        </div>

        <p className="text-xs text-muted leading-relaxed">{rec.reason}</p>

        <div className="flex items-center gap-3 text-xs text-muted">
          <span>Material score: <strong className="text-warm-mid">{rec.materialScore}/100</strong></span>
        </div>
      </div>
    </div>
  );
}
