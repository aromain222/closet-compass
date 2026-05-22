import type { BudgetStatus } from "@/lib/products/types";

interface BudgetBarProps {
  spent: number;
  limit: number;
  status: BudgetStatus;
}

const statusColor: Record<BudgetStatus, string> = {
  under_budget: "bg-success-soft",
  near_limit: "bg-blush",
  over_budget: "bg-mauve-dark",
};

const statusLabel: Record<BudgetStatus, string> = {
  under_budget: "On track",
  near_limit: "Nearing limit",
  over_budget: "Over budget",
};

export function BudgetBar({ spent, limit, status }: BudgetBarProps) {
  const pct = Math.min(100, (spent / limit) * 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-warm-mid font-medium">${spent.toFixed(0)} spent</span>
        <span className="text-muted">of ${limit} budget</span>
      </div>
      <div className="h-2.5 rounded-full bg-petal overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${statusColor[status]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted">
        <span className={status === "over_budget" ? "text-mauve-dark font-medium" : "text-muted"}>
          {statusLabel[status]}
        </span>
        <span>${Math.max(0, limit - spent).toFixed(0)} remaining</span>
      </div>
    </div>
  );
}
