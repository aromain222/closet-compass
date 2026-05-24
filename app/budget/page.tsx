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

export default function BudgetPage() {
  const { userId } = useUser();
  const router = useRouter();

  // Start rendering with mock data immediately — real data loads in behind
  const [dashboardData, setDashboardData] = useState<DashboardData>(MOCK_DASHBOARD_DATA);
  const [recommendations, setRecommendations] = useState<BudgetShoppingRecommendation[]>([]);
  const [isPlaidConnected, setIsPlaidConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const recRes = await api.getBudgetRecommendations({ userId, maxRecommendations: 5 });
      const connected = recRes.mode !== "mock";
      setIsPlaidConnected(connected);
      setRecommendations(recRes.recommendations ?? []);

      if (connected && recRes.spendingSummary) {
        let txns: ShoppingTransaction[] = [];
        try {
          const txRes = await api.getTransactions(userId);
          txns = (txRes.added ?? []).filter((t) => t.isShoppingRelated);
        } catch {
          // non-critical
        }
        setDashboardData(buildDashboardData(recRes.spendingSummary, txns));
      }
    } catch {
      // API failure — keep showing mock data, don't block the UI
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-cream px-4 py-8 max-w-2xl mx-auto">
      <MoneyDashboard
        data={dashboardData}
        onRefresh={() => load(true)}
        isMockPreview={!isPlaidConnected}
        refreshing={refreshing}
      />

      {!isPlaidConnected && (
        <div className="mt-6">
          <PlaidConnectPrompt onConnect={() => router.push("/settings")} />
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="mt-8 space-y-4">
          <div>
            <h2 className="font-display text-xl font-light text-warm-dark">Worth buying from your saved items?</h2>
            <p className="text-xs text-muted mt-1">Based on your budget, material quality, and what you&rsquo;ve set aside</p>
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
