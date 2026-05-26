"use client";

import { useState, useEffect, useRef } from "react";
import { Pencil, Check, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/mock/spendingData";
import type { CategoryItem } from "@/lib/mock/spendingData";

const STORAGE_KEY = "mm-category-budgets";

interface CategoryBudget {
  category: string;
  budget: number;
  color: string;
}

function loadBudgets(categories: CategoryItem[]): CategoryBudget[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CategoryBudget[];
  } catch { /* ignore */ }
  // Default: seed from actual categories with no budget set (0 = unset)
  return categories.map((c) => ({ category: c.category, budget: 0, color: c.color }));
}

function saveBudgets(budgets: CategoryBudget[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets)); } catch { /* ignore */ }
}

function BudgetRow({
  item,
  spend,
  onSave,
  onRemove,
}: {
  item: CategoryBudget;
  spend: number;
  onSave: (budget: number) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.budget > 0 ? String(item.budget) : "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function commit() {
    const val = parseFloat(draft.replace(/[^0-9.]/g, ""));
    onSave(isNaN(val) ? 0 : Math.round(val));
    setEditing(false);
  }

  const budget = item.budget;
  const pct = budget > 0 ? Math.min(100, Math.round((spend / budget) * 100)) : 0;
  const over = budget > 0 && spend > budget;
  const unset = budget === 0;

  return (
    <div className="space-y-2 py-3 border-b border-soft last:border-0">
      <div className="flex items-center gap-3">
        {/* Color dot + name */}
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
        <span className="text-sm text-warm-dark flex-1 font-medium">{item.category}</span>

        {/* Spend / Budget */}
        <div className="flex items-center gap-1 text-xs font-mono">
          <span className="text-muted">{formatCurrency(spend)}</span>
          <span className="text-muted/50">/</span>
          {editing ? (
            <div className="flex items-center gap-1">
              <span className="text-muted">$</span>
              <input
                ref={inputRef}
                type="number"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
                onBlur={commit}
                placeholder="0"
                className="w-16 text-right bg-petal border border-blush/50 rounded-lg px-2 py-0.5 text-xs font-mono text-warm-dark outline-none focus:border-blush"
              />
              <button onClick={commit} className="text-green-600 hover:text-green-700">
                <Check size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setDraft(budget > 0 ? String(budget) : ""); setEditing(true); }}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg hover:bg-petal transition-colors ${unset ? "text-muted/50 italic" : over ? "text-red-400 font-semibold" : "text-warm-dark font-semibold"}`}
            >
              {unset ? "set budget" : formatCurrency(budget)}
              <Pencil size={9} className="text-muted/50" />
            </button>
          )}
        </div>

        {/* Remove */}
        <button onClick={onRemove} className="text-muted/30 hover:text-red-400 transition-colors">
          <Trash2 size={12} />
        </button>
      </div>

      {/* Progress bar */}
      {!unset && (
        <div className="flex items-center gap-2 pl-5">
          <div className="flex-1 h-1.5 rounded-full bg-petal overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: over ? "#F87171" : item.color }}
            />
          </div>
          <span className={`text-[10px] font-mono w-10 text-right shrink-0 ${over ? "text-red-400 font-semibold" : "text-muted"}`}>
            {over ? `+${formatCurrency(spend - budget)}` : `${pct}%`}
          </span>
        </div>
      )}
    </div>
  );
}

const DEFAULT_COLORS = ["#E8B4A8", "#C49A9A", "#C5B8D8", "#B8A99A", "#9C9C9C", "#A8C4A8"];

interface Props {
  categories: CategoryItem[];
}

export function CategoryBudgets({ categories }: Props) {
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const newInputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage once mounted
  useEffect(() => {
    const loaded = loadBudgets(categories);
    // Ensure any new categories from live data get added
    const existing = new Set(loaded.map((b) => b.category.toLowerCase()));
    const merged = [...loaded];
    for (const c of categories) {
      if (!existing.has(c.category.toLowerCase())) {
        merged.push({ category: c.category, budget: 0, color: c.color });
      }
    }
    setBudgets(merged);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (addingNew) newInputRef.current?.focus();
  }, [addingNew]);

  function update(i: number, budget: number) {
    const next = budgets.map((b, idx) => idx === i ? { ...b, budget } : b);
    setBudgets(next);
    saveBudgets(next);
  }

  function remove(i: number) {
    const next = budgets.filter((_, idx) => idx !== i);
    setBudgets(next);
    saveBudgets(next);
  }

  function addCategory() {
    const name = newName.trim();
    if (!name) { setAddingNew(false); return; }
    if (budgets.some((b) => b.category.toLowerCase() === name.toLowerCase())) {
      setAddingNew(false); setNewName(""); return;
    }
    const color = DEFAULT_COLORS[budgets.length % DEFAULT_COLORS.length];
    const next = [...budgets, { category: name, budget: 0, color }];
    setBudgets(next);
    saveBudgets(next);
    setNewName("");
    setAddingNew(false);
  }

  const totalBudgeted = budgets.filter((b) => b.budget > 0).reduce((s, b) => s + b.budget, 0);
  const totalSpend = budgets.reduce((s, b) => {
    const cat = categories.find((c) => c.category.toLowerCase() === b.category.toLowerCase());
    return s + (cat?.spend ?? 0);
  }, 0);

  return (
    <div className="bg-card rounded-2xl border border-soft p-5 card-shadow space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] text-muted uppercase tracking-wider font-medium">Category budgets</p>
        {totalBudgeted > 0 && (
          <p className="text-[10px] font-mono text-muted">
            {formatCurrency(totalSpend)} / {formatCurrency(totalBudgeted)} total
          </p>
        )}
      </div>

      {budgets.length === 0 && (
        <p className="text-xs text-muted italic py-2">No categories yet — add one below.</p>
      )}

      {budgets.map((b, i) => {
        const cat = categories.find((c) => c.category.toLowerCase() === b.category.toLowerCase());
        return (
          <BudgetRow
            key={b.category}
            item={b}
            spend={cat?.spend ?? 0}
            onSave={(val) => update(i, val)}
            onRemove={() => remove(i)}
          />
        );
      })}

      {/* Add new */}
      {addingNew ? (
        <div className="flex items-center gap-2 pt-2">
          <input
            ref={newInputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addCategory(); if (e.key === "Escape") setAddingNew(false); }}
            onBlur={addCategory}
            placeholder="Category name"
            className="flex-1 bg-petal border border-blush/50 rounded-xl px-3 py-1.5 text-xs text-warm-dark outline-none focus:border-blush"
          />
          <button onClick={addCategory} className="text-green-600 hover:text-green-700">
            <Check size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAddingNew(true)}
          className="flex items-center gap-1.5 text-[11px] text-muted hover:text-warm-dark transition-colors pt-2"
        >
          <Plus size={12} /> Add category
        </button>
      )}
    </div>
  );
}
