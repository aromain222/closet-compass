import type { BudgetStatus } from "@/lib/products/types";

interface BudgetBarProps {
  spent: number;
  limit: number;
  status: BudgetStatus;
}

const barColor: Record<BudgetStatus, string> = {
  under_budget: "bg-lavender",
  near_limit: "bg-blush",
  over_budget: "bg-mauve",
};

const statusCopy: Record<BudgetStatus, string> = {
  under_budget: "You're on track",
  near_limit: "Getting close",
  over_budget: "Over this month",
};

export function BudgetBar({ spent, limit, status }: BudgetBarProps) {
  const pct = Math.min(100, (spent / limit) * 100);
  const remaining = limit - spent;

  return (
    <div className="space-y-2.5">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-warm-dark">${spent.toFixed(0)}</span>
        <span className="text-muted">${limit} budget</span>
      </div>

      <div className="h-2 rounded-full bg-petal overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor[status]}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex justify-between text-xs">
        <span className="text-muted">{statusCopy[status]}</span>
        <span className={remaining >= 0 ? "text-muted" : "text-mauve-dark font-medium"}>
          {remaining >= 0
            ? `$${remaining.toFixed(0)} left`
            : `over by $${Math.abs(remaining).toFixed(0)}`}
        </span>
      </div>
    </div>
  );
}
