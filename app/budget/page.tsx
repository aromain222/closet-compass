"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PlaidConnectPrompt } from "@/components/budget/PlaidConnectPrompt";
import { MoneyDashboard } from "@/components/budget/MoneyDashboard";
import { RecommendationCard } from "@/components/budget/RecommendationCard";
import { api } from "@/lib/api/client";
import { useUser } from "@/lib/context/user";
import {
  MOCK_DASHBOARD_DATA,
  CHART_COLORS,
  type DashboardData,
} from "@/lib/mock/spendingData";
import type { BudgetShoppingRecommendation, SpendingSummary } from "@/lib/products/types";
import type { ShoppingTransaction } from "@/lib/api/client";

/* ── Merge real Plaid data into DashboardData shape ── */

function buildDashboardData(
  summary: SpendingSummary,
  transactions: ShoppingTransaction[]
): DashboardData {
  const estimatedTotal = Math.round(summary.shoppingSpend * 2.4);

  const categories =
    summary.categoryBreakdown.length > 0
      ? summary.categoryBreakdown.map((c, i) => ({
          category: c.category.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase()),
          spend: c.spend,
          count: c.transactionCount,
          color: CHART_COLORS[i % CHART_COLORS.length],
        }))
      : MOCK_DASHBOARD_DATA.categoryBreakdown;

  const merchants =
    summary.topMerchants.length > 0
      ? summary.topMerchants.map((m) => ({
          name: m.merchantName,
          spend: m.spend,
          count: m.transactionCount,
        }))
      : MOCK_DASHBOARD_DATA.topMerchants;

  const recentTxns =
    transactions.length > 0
      ? transactions.slice(0, 8).map((t) => ({
          id: t.id,
          merchant: t.merchantName,
          amount: t.amount,
          date: t.date,
          category: t.shoppingCategory ?? "Other",
        }))
      : MOCK_DASHBOARD_DATA.recentTransactions;

  return {
    ...MOCK_DASHBOARD_DATA,
    month: new Date(summary.month + "-02").toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
    fashionSpend: summary.shoppingSpend,
    totalSpend: estimatedTotal,
    budgetLimit: summary.budgetLimit,
    budgetRemaining: summary.budgetRemaining,
    budgetStatus: summary.budgetStatus,
    categoryBreakdown: categories,
    topMerchants: merchants,
    recentTransactions: recentTxns,
  };
}

/* ── Page ── */

export default function BudgetPage() {
  const { userId } = useUser();
  const router = useRouter();

  const [summary, setSummary] = useState<SpendingSummary | null>(null);
  const [recommendations, setRecommendations] = useState<BudgetShoppingRecommendation[]>([]);
  const [transactions, setTransactions] = useState<ShoppingTransaction[]>([]);
  const [isMock, setIsMock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const recRes = await api.getBudgetRecommendations({ userId, maxRecommendations: 5 });
      setSummary(recRes.spendingSummary);
      setRecommendations(recRes.recommendations ?? []);
      setIsMock(recRes.mode === "mock");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load budget data");
    } finally {
      setLoading(false);
    }

    try {
      const txRes = await api.getTransactions(userId);
      setTransactions((txRes.added ?? []).filter((t) => t.isShoppingRelated));
    } catch {
      // non-critical
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-cream px-4 py-8 max-w-2xl mx-auto space-y-4">
        <div className="h-10 w-56 bg-petal rounded-xl animate-pulse" />
        <div className="h-2 w-full bg-petal rounded-full animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-28 rounded-2xl bg-petal animate-pulse" />
          <div className="h-28 rounded-2xl bg-petal animate-pulse" />
        </div>
        <div className="h-16 rounded-2xl bg-petal animate-pulse" />
        <div className="h-48 rounded-2xl bg-petal animate-pulse" />
        <div className="h-36 rounded-2xl bg-petal animate-pulse" />
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="min-h-screen bg-cream px-4 py-8 max-w-2xl mx-auto flex items-center justify-center">
        <div className="bg-card border border-soft rounded-2xl p-10 text-center space-y-3">
          <p className="text-sm text-red-400">{error}</p>
          <button
            className="text-xs text-muted hover:text-warm-dark underline underline-offset-2"
            onClick={load}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  /* ── Always show dashboard; use mock data when not connected ── */
  const dashboardData = summary && !isMock
    ? buildDashboardData(summary, transactions)
    : MOCK_DASHBOARD_DATA;

  return (
    <div className="min-h-screen bg-cream px-4 py-8 max-w-2xl mx-auto">
      <MoneyDashboard data={dashboardData} onRefresh={load} isMockPreview={isMock || !summary} />

      {/* Connect prompt sits below the dashboard when not connected */}
      {(isMock || !summary) && (
        <div className="mt-6">
          <PlaidConnectPrompt onConnect={() => router.push("/settings")} />
        </div>
      )}

      {/* Recommendations below the dashboard */}
      {recommendations.length > 0 && (
        <div className="mt-8 space-y-4">
          <div>
            <h2 className="font-display text-xl font-light text-warm-dark">What to do with your wishlist</h2>
            <p className="text-xs text-muted mt-1">
              Based on your budget, wishlist, and material quality
            </p>
          </div>
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.productId} rec={rec} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
