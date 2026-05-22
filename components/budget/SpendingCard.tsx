import type { SpendingSummary } from "@/lib/products/types";
import { Card } from "@/components/ui/card";
import { BudgetBar } from "./BudgetBar";

interface SpendingCardProps {
  summary: SpendingSummary;
}

export function SpendingCard({ summary }: SpendingCardProps) {
  return (
    <Card padding="lg" className="space-y-5">
      <div>
        <p className="text-xs text-muted uppercase tracking-wider font-medium mb-1">
          {new Date(summary.month + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
        <h2 className="font-display text-3xl font-light text-warm-dark">
          ${summary.shoppingSpend.toFixed(0)}
          <span className="text-lg text-muted font-sans font-normal ml-1">spent on fashion</span>
        </h2>
      </div>

      <BudgetBar
        spent={summary.shoppingSpend}
        limit={summary.budgetLimit}
        status={summary.budgetStatus}
      />

      <p className="text-sm text-muted italic">{summary.summaryText}</p>

      {summary.topMerchants.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-warm-mid uppercase tracking-wider mb-3">Where you shopped</p>
          <div className="space-y-2">
            {summary.topMerchants.slice(0, 4).map((m) => (
              <div key={m.merchantName} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-blush shrink-0" />
                  <span className="text-sm text-warm-mid truncate">{m.merchantName}</span>
                  <span className="text-xs text-muted shrink-0">{m.transactionCount}×</span>
                </div>
                <span className="text-sm font-medium text-warm-dark shrink-0 ml-3">${m.spend.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.categoryBreakdown.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-warm-mid uppercase tracking-wider mb-3">By category</p>
          <div className="flex flex-wrap gap-2">
            {summary.categoryBreakdown.map((c) => (
              <div key={c.category} className="flex items-center gap-1.5 bg-petal px-3 py-1.5 rounded-full">
                <span className="text-xs text-warm-mid">{c.category}</span>
                <span className="text-xs font-semibold text-warm-dark">${c.spend.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
