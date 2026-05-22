"use client";

import { useState, type KeyboardEvent } from "react";
import { X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FilterState {
  maxPrice: string;
  preferredMaterials: string[];
  avoidMaterials: string[];
  occasion: string;
  stylePreferences: string[];
}

export const EMPTY_FILTERS: FilterState = {
  maxPrice: "",
  preferredMaterials: [],
  avoidMaterials: [],
  occasion: "",
  stylePreferences: [],
};

export function activeFilterCount(f: FilterState): number {
  return (
    (f.maxPrice ? 1 : 0) +
    f.preferredMaterials.length +
    f.avoidMaterials.length +
    (f.occasion ? 1 : 0) +
    f.stylePreferences.length
  );
}

interface TagInputProps {
  tags: string[];
  placeholder: string;
  onChange: (tags: string[]) => void;
  colorClass?: string;
}

function TagInput({ tags, placeholder, onChange, colorClass = "bg-lavender/30 text-warm-dark" }: TagInputProps) {
  const [input, setInput] = useState("");

  function addTag(value: string) {
    const trimmed = value.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput("");
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-soft bg-card min-h-[42px] focus-within:border-mauve transition-colors cursor-text"
      onClick={(e) => (e.currentTarget.querySelector("input") as HTMLInputElement | null)?.focus()}
    >
      {tags.map((tag) => (
        <span key={tag} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${colorClass}`}>
          {tag}
          <button onClick={() => onChange(tags.filter((t) => t !== tag))} className="hover:opacity-60 transition-opacity">
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => input.trim() && addTag(input)}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[80px] bg-transparent text-sm text-warm-dark placeholder:text-muted/50 outline-none py-0.5"
      />
    </div>
  );
}

interface SearchFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onApply: () => void;
  onClear: () => void;
}

export function SearchFilters({ filters, onChange, onApply, onClear }: SearchFiltersProps) {
  const [open, setOpen] = useState(false);
  const count = activeFilterCount(filters);

  function set<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div>
      {/* Toggle button */}
      <button
        className={`flex items-center gap-2 text-sm font-medium transition-colors rounded-full px-3 py-1.5 border ${
          open || count > 0
            ? "bg-petal border-mauve text-warm-dark"
            : "border-border-soft text-muted hover:text-warm-dark hover:border-warm"
        }`}
        onClick={() => setOpen((v) => !v)}
      >
        <SlidersHorizontal size={13} />
        Filters
        {count > 0 && (
          <span className="bg-mauve text-card text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {count}
          </span>
        )}
      </button>

      {/* Filter panel */}
      {open && (
        <div className="mt-3 bg-card rounded-2xl border border-soft card-shadow p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Max price */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-warm-mid uppercase tracking-wider">Max price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  placeholder="e.g. 120"
                  value={filters.maxPrice}
                  onChange={(e) => set("maxPrice", e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-soft bg-card text-sm text-warm-dark placeholder:text-muted/50 focus:outline-none focus:border-mauve transition-colors"
                />
              </div>
            </div>

            {/* Occasion */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-warm-mid uppercase tracking-wider">Occasion</label>
              <input
                type="text"
                placeholder="e.g. office, date night, gym…"
                value={filters.occasion}
                onChange={(e) => set("occasion", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-soft bg-card text-sm text-warm-dark placeholder:text-muted/50 focus:outline-none focus:border-mauve transition-colors"
              />
            </div>

            {/* Preferred materials */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-warm-mid uppercase tracking-wider">Preferred materials</label>
              <TagInput
                tags={filters.preferredMaterials}
                placeholder="silk, modal, linen… press Enter"
                onChange={(tags) => set("preferredMaterials", tags)}
                colorClass="bg-lavender/30 text-warm-dark"
              />
            </div>

            {/* Avoid materials */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-warm-mid uppercase tracking-wider">Avoid materials</label>
              <TagInput
                tags={filters.avoidMaterials}
                placeholder="acrylic, polyester… press Enter"
                onChange={(tags) => set("avoidMaterials", tags)}
                colorClass="bg-blush/30 text-warm-dark"
              />
            </div>
          </div>

          {/* Style preferences */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-warm-mid uppercase tracking-wider">Style preferences</label>
            <TagInput
              tags={filters.stylePreferences}
              placeholder="minimal, oversized, fitted, Y2K… press Enter"
              onChange={(tags) => set("stylePreferences", tags)}
              colorClass="bg-taupe/20 text-warm-dark"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            <button
              className="text-sm text-muted hover:text-warm-dark transition-colors"
              onClick={() => { onClear(); setOpen(false); }}
            >
              Clear all
            </button>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={() => { onApply(); setOpen(false); }}>
                Apply filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
