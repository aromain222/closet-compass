export const CHART_COLORS = [
  "#E8B4A8", // blush — clothing
  "#C49A9A", // mauve — dining
  "#C5B8D8", // lavender — beauty
  "#B8A99A", // taupe — grocery
  "#9C9C9C", // neutral — other
];

export interface WeeklyPoint {
  week: string;
  total: number;
  fashion: number;
}

export interface CategoryItem {
  category: string;
  spend: number;
  count: number;
  color: string;
}

export interface MerchantItem {
  name: string;
  spend: number;
  count: number;
}

export interface TransactionItem {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  category: string;
}

export interface DashboardData {
  userName: string;
  month: string;
  totalSpend: number;
  fashionSpend: number;
  prevTotalSpend: number;
  prevFashionSpend: number;
  budgetLimit: number;
  budgetRemaining: number;
  budgetStatus: "under_budget" | "near_limit" | "over_budget";
  categoryBreakdown: CategoryItem[];
  topMerchants: MerchantItem[];
  weeklyTrend: WeeklyPoint[];
  recentTransactions: TransactionItem[];
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function formatCurrency(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

export function percentChange(current: number, prev: number): number {
  if (prev === 0) return 0;
  return Math.round(((current - prev) / prev) * 100);
}

export function generateInsights(data: DashboardData): Array<{ symbol: string; text: string }> {
  const results: Array<{ symbol: string; text: string }> = [];

  const pct = percentChange(data.totalSpend, data.prevTotalSpend);
  if (pct < 0) results.push({ symbol: "↓", text: `You spent ${Math.abs(pct)}% less than last month.` });
  else if (pct > 0) results.push({ symbol: "↑", text: `You spent ${pct}% more than last month.` });

  const sorted = [...data.categoryBreakdown].sort((a, b) => b.spend - a.spend);
  const fashionIdx = sorted.findIndex(c => c.category.toLowerCase().includes("clothing"));
  if (fashionIdx >= 0) {
    results.push({ symbol: "✦", text: `Clothing is your #${fashionIdx + 1} spend category this month.` });
  }

  const biggest = [...data.recentTransactions].sort((a, b) => b.amount - a.amount)[0];
  if (biggest) {
    results.push({ symbol: "◆", text: `Biggest purchase this week: ${formatCurrency(biggest.amount)} at ${biggest.merchant}.` });
  }

  if (data.budgetRemaining > 0) {
    results.push({ symbol: "◎", text: `You're pacing ${formatCurrency(data.budgetRemaining)} under your style budget.` });
  } else if (data.budgetRemaining < 0) {
    results.push({ symbol: "!", text: `You're ${formatCurrency(Math.abs(data.budgetRemaining))} over your style budget.` });
  }

  const dining = sorted.find(c => c.category.toLowerCase().includes("dining") || c.category.toLowerCase().includes("food"));
  const clothing = sorted.find(c => c.category.toLowerCase().includes("clothing"));
  if (dining && clothing && dining.spend > clothing.spend) {
    results.push({ symbol: "~", text: "Dining is quietly taking more budget than fashion this month." });
  }

  const fashionTxns = data.recentTransactions.filter(t => t.category.toLowerCase().includes("clothing"));
  if (fashionTxns.length > 0) {
    results.push({ symbol: "✦", text: `${fashionTxns.length} fashion-related transactions this month.` });
    const avg = fashionTxns.reduce((s, t) => s + t.amount, 0) / fashionTxns.length;
    results.push({ symbol: "◈", text: `Your average clothing purchase is ${formatCurrency(Math.round(avg))}.` });
  }

  return results;
}

export const MOCK_DASHBOARD_DATA: DashboardData = {
  userName: "Nisa",
  month: "May 2025",
  totalSpend: 843,
  fashionSpend: 387,
  prevTotalSpend: 1031,
  prevFashionSpend: 463,
  budgetLimit: 500,
  budgetRemaining: 113,
  budgetStatus: "under_budget",
  categoryBreakdown: [
    { category: "Clothing", spend: 387, count: 6,  color: "#E8B4A8" },
    { category: "Dining",   spend: 218, count: 14, color: "#C49A9A" },
    { category: "Beauty",   spend: 104, count: 3,  color: "#C5B8D8" },
    { category: "Grocery",  spend: 86,  count: 8,  color: "#B8A99A" },
    { category: "Other",    spend: 48,  count: 5,  color: "#9C9C9C" },
  ],
  topMerchants: [
    { name: "Zara",        spend: 134, count: 2 },
    { name: "ASOS",        spend: 98,  count: 1 },
    { name: "H&M",         spend: 81,  count: 3 },
    { name: "Glossier",    spend: 74,  count: 2 },
    { name: "Sweetgreen",  spend: 64,  count: 8 },
  ],
  weeklyTrend: [
    { week: "Mar 3",  total: 120, fashion: 60  },
    { week: "Mar 10", total: 89,  fashion: 40  },
    { week: "Mar 17", total: 210, fashion: 95  },
    { week: "Mar 24", total: 145, fashion: 80  },
    { week: "Mar 31", total: 180, fashion: 110 },
    { week: "Apr 7",  total: 95,  fashion: 45  },
    { week: "Apr 14", total: 260, fashion: 130 },
    { week: "Apr 28", total: 143, fashion: 85  },
    { week: "May 5",  total: 312, fashion: 156 },
    { week: "May 12", total: 289, fashion: 148 },
    { week: "May 19", total: 242, fashion: 83  },
  ],
  recentTransactions: [
    { id: "1", merchant: "Zara",          amount: 86, date: "2025-05-14", category: "Clothing" },
    { id: "2", merchant: "Sweetgreen",    amount: 18, date: "2025-05-13", category: "Dining"   },
    { id: "3", merchant: "ASOS",          amount: 98, date: "2025-05-11", category: "Clothing" },
    { id: "4", merchant: "Glossier",      amount: 42, date: "2025-05-10", category: "Beauty"   },
    { id: "5", merchant: "H&M",           amount: 54, date: "2025-05-08", category: "Clothing" },
    { id: "6", merchant: "Trader Joe's",  amount: 52, date: "2025-05-07", category: "Grocery"  },
    { id: "7", merchant: "Zara",          amount: 48, date: "2025-05-05", category: "Clothing" },
    { id: "8", merchant: "Coffee Bar",    amount: 12, date: "2025-05-04", category: "Dining"   },
  ],
};
