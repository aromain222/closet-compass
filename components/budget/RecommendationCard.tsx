import type { BudgetShoppingRecommendation } from "@/lib/products/types";
import { Badge } from "@/components/ui/badge";

interface RecommendationCardProps {
  rec: BudgetShoppingRecommendation;
}

type BadgeVariant = "success" | "blush" | "muted" | "lavender";

interface ActionStyle {
  badge: BadgeVariant;
  label: string;
  accent: string;
}

const ACTION: Record<string, ActionStyle> = {
  buy_now: {
    badge: "success",
    label: "Go for it",
    accent: "border-l-[3px] border-l-green-200",
  },
  wait_for_drop: {
    badge: "lavender",
    label: "Save for later",
    accent: "border-l-[3px] border-l-lavender/60",
  },
  skip_for_budget: {
    badge: "muted",
    label: "Maybe next month",
    accent: "border-l-[3px] border-l-taupe/40",
  },
  review_materials: {
    badge: "blush",
    label: "Check materials first",
    accent: "border-l-[3px] border-l-blush/50",
  },
};

export function RecommendationCard({ rec }: RecommendationCardProps) {
  const style = ACTION[rec.recommendation] ?? ACTION.skip_for_budget;

  return (
    <div className={`bg-card rounded-2xl border border-soft card-shadow p-4 space-y-2.5 ${style.accent}`}>
      {/* Identity */}
      <div>
        <p className="text-[11px] text-muted uppercase tracking-[0.12em] font-medium">{rec.brand}</p>
        <p className="text-sm font-medium text-warm-dark leading-snug line-clamp-2">{rec.title}</p>
        <p className="text-xs text-muted">{rec.retailer}</p>
      </div>

      {/* Price + action */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold text-warm-dark">${rec.price}</span>
        {rec.targetPrice && rec.price <= rec.targetPrice && (
          <Badge variant="success" size="sm">At target</Badge>
        )}
        <Badge variant={style.badge} size="sm">{style.label}</Badge>
      </div>

      {/* Reason — companion tone */}
      <p className="text-xs text-muted leading-relaxed italic">{rec.reason}</p>

      {/* Material score */}
      <div className="flex items-center gap-2 text-xs text-muted">
        <span>Material quality</span>
        <div className="flex-1 h-1 rounded-full bg-petal overflow-hidden max-w-[80px]">
          <div
            className="h-full rounded-full bg-lavender transition-all"
            style={{ width: `${rec.materialScore}%` }}
          />
        </div>
        <span className="font-medium text-warm-mid">{rec.materialScore}/100</span>
      </div>
    </div>
  );
}
