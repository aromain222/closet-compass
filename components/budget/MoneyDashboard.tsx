"use client";

import dynamic from "next/dynamic";
import { RefreshCw, TrendingDown, TrendingUp, Minus } from "lucide-react";
import {
  type DashboardData,
  formatCurrency, percentChange, generateInsights, getGreeting,
} from "@/lib/mock/spendingData";
import { SpendingInsightCard } from "./SpendingInsightCard";
import { Button } from "@/components/ui/button";

const SpendingTrendChart = dynamic(
  () => import("./SpendingTrendChart").then(m => m.SpendingTrendChart),
  { ssr: false, loading: () => <div className="h-[160px] rounded-xl bg-petal animate-pulse" /> }
);

const SpendingBreakdownChart = dynamic(
  () => import("./SpendingBreakdownChart").then(m => m.SpendingBreakdownChart),
  { ssr: false, loading: () => <div className="h-[110px] rounded-xl bg-petal animate-pulse" /> }
);

/* ── helpers ── */

function Delta({ current, prev, invert = false }: { current: number; prev: number; invert?: boolean }) {
  const pct = percentChange(current, prev);
  if (pct === 0) return <span className="text-[11px] text-muted font-mono">—</span>;
  const isPositive = pct > 0;
  const isGood = invert ? !isPositive : isPositive;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold font-mono ${isGood ? "text-green-700" : "text-red-400"}`}>
      {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {Math.abs(pct)}%
    </span>
  );
}

function StatCell({
  label, value, sub, delta,
}: { label: string; value: string; sub?: string; delta?: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-soft p-4 space-y-1.5 card-shadow">
      <p className="text-[10px] text-muted uppercase tracking-wider font-medium">{label}</p>
      <p className="font-mono text-[1.6rem] font-bold text-warm-dark leading-none">{value}</p>
      {(sub || delta) && (
        <div className="flex items-center gap-2">
          {delta}
          {sub && <p className="text-[11px] text-muted">{sub}</p>}
        </div>
      )}
    </div>
  );
}

function BudgetMeter({ data }: { data: DashboardData }) {
  const { fashionSpend, budgetLimit, budgetRemaining, budgetStatus } = data;
  const pct = Math.min(100, Math.round((fashionSpend / budgetLimit) * 100));
  const barColor =
    budgetStatus === "over_budget" ? "#F87171"
    : budgetStatus === "near_limit" ? "#C49A9A"
    : "#E8B4A8";

  return (
    <div className="bg-card rounded-2xl border border-soft p-4 space-y-3 card-shadow">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted uppercase tracking-wider font-medium">Style budget</p>
        <p className="text-xs font-mono text-warm-mid">
          {formatCurrency(fashionSpend)} <span className="text-muted">/ {formatCurrency(budgetLimit)}</span>
        </p>
      </div>

      <div className="relative h-2 rounded-full bg-petal overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[11px] font-mono text-muted">{pct}% used</p>
        {budgetStatus === "over_budget" ? (
          <p className="text-[11px] font-semibold text-red-400">
            {formatCurrency(Math.abs(budgetRemaining))} over
          </p>
        ) : (
          <p className="text-[11px] text-muted">
            <span className="font-semibold text-warm-dark font-mono">{formatCurrency(budgetRemaining)}</span>{" "}
            remaining
          </p>
        )}
      </div>
    </div>
  );
}

function TransactionRow({ tx }: { tx: DashboardData["recentTransactions"][0] }) {
  const dateStr = new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const initials = tx.category.slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-soft last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-petal border border-soft flex items-center justify-center shrink-0">
          <span className="text-[10px] text-muted font-mono font-semibold">{initials}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm text-warm-dark font-medium truncate">{tx.merchant}</p>
          <p className="text-[11px] text-muted">{dateStr} · {tx.category}</p>
        </div>
      </div>
      <span className="text-sm font-bold text-warm-dark font-mono shrink-0 ml-3">
        {formatCurrency(tx.amount)}
      </span>
    </div>
  );
}

/* ── Main dashboard ── */

interface Props {
  data: DashboardData;
  onRefresh?: () => void;
  isMockPreview?: boolean;
  refreshing?: boolean;
}

export function MoneyDashboard({ data, onRefresh, isMockPreview, refreshing }: Props) {
  const greeting = getGreeting();
  const insights = generateInsights(data);
  const totalDelta = percentChange(data.totalSpend, data.prevTotalSpend);

  return (
    <div className="space-y-5">

      {/* ── Demo banner ── */}
      {isMockPreview && (
        <div className="flex items-center gap-2 bg-taupe/10 border border-taupe/20 rounded-xl px-4 py-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-taupe shrink-0" />
          <p className="text-xs text-warm-mid">
            Sample data — connect your bank to see your real spending.
          </p>
        </div>
      )}

      {/* ── Greeting ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-light text-warm-dark">
            {greeting}, {data.userName}.
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Here&rsquo;s what your money has been doing lately.
          </p>
        </div>
        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={onRefresh} className="shrink-0 mt-1.5" disabled={refreshing}>
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          </Button>
        )}
      </div>

      {/* ── Hero stats ── */}
      <div className="grid grid-cols-2 gap-3">
        <StatCell
          label="Total this month"
          value={formatCurrency(data.totalSpend)}
          sub={data.month}
          delta={
            <Delta current={data.totalSpend} prev={data.prevTotalSpend} invert />
          }
        />
        <StatCell
          label="Fashion spend"
          value={formatCurrency(data.fashionSpend)}
          sub={`of ${formatCurrency(data.budgetLimit)} budget`}
          delta={
            <Delta current={data.fashionSpend} prev={data.prevFashionSpend} invert />
          }
        />
      </div>

      {/* ── Month-over-month callout ── */}
      <div className="bg-card rounded-2xl border border-soft px-4 py-3 flex items-center justify-between card-shadow">
        <p className="text-xs text-muted">vs. last month</p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-muted line-through">{formatCurrency(data.prevTotalSpend)}</span>
          <span className="text-muted text-xs">→</span>
          <span className="font-mono text-sm font-bold text-warm-dark">{formatCurrency(data.totalSpend)}</span>
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full font-mono ${
            totalDelta < 0 ? "bg-green-50 text-green-700" : totalDelta > 0 ? "bg-red-50 text-red-400" : "bg-petal text-muted"
          }`}>
            {totalDelta < 0 ? <TrendingDown size={10} /> : totalDelta > 0 ? <TrendingUp size={10} /> : <Minus size={10} />}
            {Math.abs(totalDelta)}%
          </span>
        </div>
      </div>

      {/* ── Budget meter ── */}
      <BudgetMeter data={data} />

      {/* ── Insight cards ── */}
      {insights.length > 0 && (
        <div>
          <p className="text-[10px] text-muted uppercase tracking-wider font-medium mb-3">Money intel</p>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
            {insights.map((ins, i) => (
              <SpendingInsightCard key={i} symbol={ins.symbol} text={ins.text} />
            ))}
          </div>
        </div>
      )}

      {/* ── Spending trend ── */}
      <div className="bg-card rounded-2xl border border-soft p-5 space-y-4 card-shadow">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted uppercase tracking-wider font-medium">Spending over time</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 rounded-full" style={{ backgroundColor: "#C5B8D8" }} />
              <span className="text-[10px] text-muted">Total</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 border-t-2 border-dashed" style={{ borderColor: "#E8B4A8" }} />
              <span className="text-[10px] text-muted">Fashion</span>
            </div>
          </div>
        </div>
        <SpendingTrendChart data={data.weeklyTrend} />
      </div>

      {/* ── Category breakdown ── */}
      <div className="bg-card rounded-2xl border border-soft p-5 space-y-4 card-shadow">
        <p className="text-[10px] text-muted uppercase tracking-wider font-medium">By category</p>
        <SpendingBreakdownChart data={data.categoryBreakdown} />
      </div>

      {/* ── Top merchants ── */}
      <div className="bg-card rounded-2xl border border-soft p-5 space-y-3.5 card-shadow">
        <p className="text-[10px] text-muted uppercase tracking-wider font-medium">Where you shopped</p>
        {data.topMerchants.map((m) => {
          const maxSpend = Math.max(...data.topMerchants.map(x => x.spend));
          const pct = Math.round((m.spend / maxSpend) * 100);
          return (
            <div key={m.name} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-warm-mid">{m.name}</span>
                <span className="text-sm font-bold text-warm-dark font-mono">{formatCurrency(m.spend)}</span>
              </div>
              <div className="h-1 rounded-full bg-petal overflow-hidden">
                <div className="h-full rounded-full bg-blush/60" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Recent transactions ── */}
      <div className="bg-card rounded-2xl border border-soft p-5 card-shadow">
        <p className="text-[10px] text-muted uppercase tracking-wider font-medium mb-3">Recent transactions</p>
        {data.recentTransactions.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} />
        ))}
      </div>

    </div>
  );
}
