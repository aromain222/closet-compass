"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Wallet, RefreshCw, Link2, ShoppingBag } from "lucide-react";
import { SpendingCard } from "@/components/budget/SpendingCard";
import { RecommendationCard } from "@/components/budget/RecommendationCard";
import { EmptyState } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api/client";
import { useUser } from "@/lib/context/user";
import type {
  BudgetShoppingRecommendation,
  SpendingSummary,
} from "@/lib/products/types";
import type { ShoppingTransaction } from "@/lib/api/client";

/* ── Category formatter ── */
function formatCategory(cat: string) {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── Category badge variant ── */
function categoryVariant(cat: string): "lavender" | "blush" | "mauve" | "taupe" | "warm" {
  const map: Record<string, "lavender" | "blush" | "mauve" | "taupe" | "warm"> = {
    clothing: "lavender",
    beauty: "blush",
    sportswear: "mauve",
    accessories: "taupe",
    department_store: "warm",
    home: "warm",
    other_shopping: "warm",
  };
  return map[cat] ?? "warm";
}

/* ── Plaid connect card ── */
function PlaidConnectCard({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="bg-petal rounded-2xl border border-soft p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center shrink-0">
          <Link2 size={16} className="text-warm-mid" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-sm font-medium text-warm-dark">Connect your bank</p>
          <p className="text-xs text-muted mt-0.5">
            Plaid securely links your accounts — we never see your login credentials.
          </p>
        </div>
      </div>
      <p className="text-sm text-warm-mid leading-relaxed">
        See exactly where your shopping spend is going. No judgment — just a clear picture
        so you can buy the things you actually love.
      </p>
      <Button variant="secondary" size="sm" onClick={onConnect}>
        Connect in Settings
      </Button>
    </div>
  );
}

/* ── Transaction row ── */
function TransactionRow({ tx }: { tx: ShoppingTransaction }) {
  const date = new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-soft last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-petal flex items-center justify-center shrink-0">
          <ShoppingBag size={12} className="text-muted" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-warm-dark font-medium truncate">{tx.merchantName}</p>
          <p className="text-xs text-muted">{date}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        {tx.shoppingCategory && tx.shoppingCategory !== "not_shopping" && (
          <Badge variant={categoryVariant(tx.shoppingCategory)}>
            {formatCategory(tx.shoppingCategory)}
          </Badge>
        )}
        <span className="text-sm font-semibold text-warm-dark">${tx.amount.toFixed(0)}</span>
      </div>
    </div>
  );
}

/* ── Budget remaining callout ── */
function RemainingCallout({
  remaining,
  status,
}: {
  remaining: number;
  status: SpendingSummary["budgetStatus"];
}) {
  if (status === "over_budget") return null;

  const tone =
    status === "near_limit"
      ? `You're getting close to your budget. Good time to save a few things for later.`
      : remaining >= 100
      ? `You still have room for one great piece — or a few smaller finds.`
      : `You have a little left. A small treat could still work.`;

  return (
    <div className="rounded-2xl bg-lavender/10 border border-lavender/25 px-5 py-4">
      <p className="text-sm text-warm-dark">
        <span className="font-semibold">${remaining.toFixed(0)} left</span>
        {" "}this month.{" "}
        <span className="text-muted">{tone}</span>
      </p>
    </div>
  );
}

/* ──────────────────────────────────────────── */
/*  Main page                                  */
/* ──────────────────────────────────────────── */

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

    // Load transactions separately — failure is non-critical
    try {
      const txRes = await api.getTransactions(userId);
      setTransactions((txRes.added ?? []).filter((t) => t.isShoppingRelated));
    } catch {
      // best effort
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-cream px-4 py-8 max-w-2xl mx-auto space-y-4">
        <div className="h-8 w-32 bg-petal rounded-xl animate-pulse" />
        <div className="h-56 rounded-2xl bg-petal animate-pulse" />
        <div className="h-20 rounded-2xl bg-petal animate-pulse" />
        <div className="h-40 rounded-2xl bg-petal animate-pulse" />
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="min-h-screen bg-cream px-4 py-8 max-w-2xl mx-auto">
        <div className="rounded-2xl bg-card border border-soft p-10 text-center space-y-3">
          <p className="text-sm text-red-400">{error}</p>
          <Button variant="secondary" size="sm" onClick={load}>Try again</Button>
        </div>
      </div>
    );
  }

  /* ── Plaid not connected (no data at all) ── */
  if (!summary) {
    return (
      <div className="min-h-screen bg-cream px-4 py-8 max-w-2xl mx-auto space-y-6">
        <h1 className="font-display text-3xl font-light text-warm-dark">Budget</h1>
        <EmptyState
          icon={Wallet}
          title="No spending data yet"
          description="Connect your bank in Settings to see where your shopping budget is going."
          action={{ label: "Go to Settings", onClick: () => router.push("/settings") }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream px-4 py-8 max-w-2xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-light text-warm-dark">Budget</h1>
          <p className="text-sm text-muted">Your shopping this month</p>
        </div>
        <Button variant="ghost" size="sm" onClick={load}>
          <RefreshCw size={13} />
        </Button>
      </div>

      {/* ── Demo mode notice ── */}
      {isMock && (
        <div className="mb-6 flex items-center gap-2.5 bg-taupe/10 border border-taupe/20 rounded-xl px-4 py-2.5">
          <span className="text-xs text-warm-mid">
            Showing demo data —{" "}
            <button
              className="underline underline-offset-2 hover:text-warm-dark transition-colors"
              onClick={() => router.push("/settings")}
            >
              connect your bank
            </button>{" "}
            to see real spend.
          </span>
        </div>
      )}

      <div className="space-y-6">
        {/* ── Spending summary card ── */}
        <SpendingCard summary={summary} />

        {/* ── Budget remaining callout ── */}
        {summary.budgetRemaining !== undefined && (
          <RemainingCallout
            remaining={summary.budgetRemaining}
            status={summary.budgetStatus}
          />
        )}

        {/* ── Recent transactions ── */}
        {transactions.length > 0 && (
          <div className="bg-card rounded-2xl border border-soft card-shadow p-5">
            <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1">
              Recent shopping
            </p>
            <p className="text-xs text-muted mb-4">
              {transactions.length} shopping transaction{transactions.length !== 1 ? "s" : ""} this month
            </p>
            <div>
              {transactions.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </div>
          </div>
        )}

        {/* ── Plaid connect card ── */}
        {isMock && (
          <PlaidConnectCard onConnect={() => router.push("/settings")} />
        )}

        {/* ── Shopping recommendations ── */}
        {recommendations.length > 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-xl font-light text-warm-dark">
                What to do with your wishlist
              </h2>
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

        {/* ── No recommendations ── */}
        {recommendations.length === 0 && (
          <div className="rounded-2xl bg-card border border-soft p-6 text-center space-y-2">
            <p className="font-display text-lg font-light text-warm-dark">No recommendations yet</p>
            <p className="text-xs text-muted max-w-xs mx-auto text-balance">
              Save items to your wishlist and we&rsquo;ll tell you when the timing is right to buy.
            </p>
            <Button variant="secondary" size="sm" onClick={() => router.push("/")}>
              Start shopping
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
