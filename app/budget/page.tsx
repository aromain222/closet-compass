"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Wallet, RefreshCw } from "lucide-react";
import { SpendingCard } from "@/components/budget/SpendingCard";
import { RecommendationCard } from "@/components/budget/RecommendationCard";
import { PageSpinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { useUser } from "@/lib/context/user";
import type { BudgetShoppingRecommendation, SpendingSummary } from "@/lib/products/types";

export default function BudgetPage() {
  const { userId } = useUser();
  const router = useRouter();

  const [summary, setSummary] = useState<SpendingSummary | null>(null);
  const [recommendations, setRecommendations] = useState<BudgetShoppingRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, recRes] = await Promise.all([
        api.getSpendingSummary({ userId }),
        api.getBudgetRecommendations({ userId, maxRecommendations: 5 }),
      ]);
      setSummary(summaryRes);
      setRecommendations(recRes.recommendations ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load budget data");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-cream px-4 py-8 max-w-2xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-warm-dark mb-1">Budget</h1>
          <p className="text-sm text-muted">Your shopping spend this month</p>
        </div>
        {!loading && (
          <Button variant="ghost" size="sm" onClick={load}>
            <RefreshCw size={13} />
          </Button>
        )}
      </div>

      {loading && <PageSpinner />}

      {!loading && error && (
        <div className="text-center py-12">
          <p className="text-sm text-red-500 mb-3">{error}</p>
          <Button variant="secondary" size="sm" onClick={load}>Try again</Button>
        </div>
      )}

      {!loading && !error && !summary && (
        <EmptyState
          icon={Wallet}
          title="No spending data yet"
          description="Connect your bank via Plaid in Settings to see your shopping spend here."
          action={{ label: "Go to Settings", onClick: () => router.push("/settings") }}
        />
      )}

      {!loading && !error && summary && (
        <div className="space-y-6">
          {/* Spending summary */}
          <SpendingCard summary={summary} />

          {/* Plaid connect prompt (subtle, shown when in mock mode) */}
          <div className="bg-petal/60 rounded-2xl border border-soft p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-warm-dark">Connect your bank</p>
              <p className="text-xs text-muted mt-0.5">See real spending data from your accounts via Plaid</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/settings")}
            >
              Connect
            </Button>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div>
              <h2 className="font-display text-xl font-light text-warm-dark mb-4">Shopping recommendations</h2>
              <p className="text-xs text-muted mb-4">Based on your wishlist, budget status, and material quality scores</p>
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <RecommendationCard key={rec.productId} rec={rec} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
