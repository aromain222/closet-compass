import type { SpendingSummary } from "@/lib/products/types";
import { BudgetBar } from "./BudgetBar";

interface SpendingCardProps {
  summary: SpendingSummary;
}

function formatCategory(cat: string): string {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function SpendingCard({ summary }: SpendingCardProps) {
  const monthLabel = new Date(summary.month + "-02").toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-card rounded-2xl border border-soft card-shadow p-6 space-y-6">
      {/* ── Hero ── */}
      <div>
        <p className="text-xs text-muted uppercase tracking-wider font-medium mb-2">{monthLabel}</p>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-4xl font-light text-warm-dark">
            ${summary.shoppingSpend.toFixed(0)}
          </span>
          <span className="text-base text-muted font-light">on shopping</span>
        </div>
      </div>

      {/* ── Budget bar ── */}
      <BudgetBar
        spent={summary.shoppingSpend}
        limit={summary.budgetLimit}
        status={summary.budgetStatus}
      />

      {/* ── AI summary ── */}
      {summary.summaryText && (
        <p className="text-sm text-warm-mid italic leading-relaxed border-l-2 border-blush/40 pl-3">
          {summary.summaryText}
        </p>
      )}

      {/* ── Where you shopped ── */}
      {summary.topMerchants.length > 0 && (
        <div>
          <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-3">
            Where you shopped
          </p>
          <div className="space-y-2.5">
            {summary.topMerchants.slice(0, 5).map((m) => {
              const pct = Math.round((m.spend / summary.shoppingSpend) * 100);
              return (
                <div key={m.merchantName} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-warm-mid truncate">{m.merchantName}</span>
                    <span className="font-medium text-warm-dark shrink-0 ml-2">
                      ${m.spend.toFixed(0)}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-petal overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blush/60 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Category chips ── */}
      {summary.categoryBreakdown.length > 0 && (
        <div>
          <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-3">
            By category
          </p>
          <div className="flex flex-wrap gap-2">
            {summary.categoryBreakdown.map((c) => (
              <div
                key={c.category}
                className="flex items-center gap-1.5 bg-petal border border-border-soft rounded-full px-3 py-1.5"
              >
                <span className="text-xs text-warm-mid">{formatCategory(c.category)}</span>
                <span className="text-xs font-semibold text-warm-dark">${c.spend.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
