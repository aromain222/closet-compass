"use client";

import { useState } from "react";
import { X, Sparkles, Eye, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ImageSearchAnalysis } from "@/lib/products/types";

/* ── Notes form (step 2) ── */

const QUICK_PICKS = [
  { label: "Find a cheaper version", append: "find a cheaper version" },
  { label: "Same material", append: "same material quality" },
  { label: "Less cropped", append: "less cropped longer length" },
  { label: "Under $80", append: "under $80" },
  { label: "More coverage", append: "more coverage" },
  { label: "Work-appropriate", append: "office appropriate" },
];

interface ImagePreviewFormProps {
  dataUrl: string;
  onSearch: (notes: string) => void;
  onReset: () => void;
  loading?: boolean;
}

export function ImagePreviewForm({ dataUrl, onSearch, onReset, loading }: ImagePreviewFormProps) {
  const [notes, setNotes] = useState("");

  function appendNote(text: string) {
    setNotes((prev) => (prev.trim() ? `${prev.trim()}, ${text}` : text));
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col px-4 py-8 max-w-2xl mx-auto">
      {/* Back */}
      <button
        className="flex items-center gap-1.5 text-sm text-muted hover:text-warm-dark transition-colors mb-8"
        onClick={onReset}
      >
        <X size={14} /> Upload a different image
      </button>

      <h1 className="font-display text-3xl font-light text-warm-dark mb-8">
        What should I look for?
      </h1>

      <div className="flex flex-col sm:flex-row gap-6 flex-1">
        {/* Image preview */}
        <div className="sm:w-48 shrink-0">
          <div className="rounded-2xl overflow-hidden border border-soft card-shadow bg-petal aspect-[3/4] relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={dataUrl}
              alt="Your upload"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-xs text-muted text-center mt-2">Your image</p>
        </div>

        {/* Notes */}
        <div className="flex-1 flex flex-col gap-5">
          {/* Quick picks */}
          <div>
            <p className="text-xs font-semibold text-warm-mid uppercase tracking-wider mb-3">Quick picks</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PICKS.map((qp) => (
                <button
                  key={qp.label}
                  className="text-xs font-medium px-3 py-1.5 rounded-full border border-border-strong text-warm-mid hover:border-mauve hover:bg-lavender/10 hover:text-warm-dark transition-all"
                  onClick={() => appendNote(qp.append)}
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes textarea */}
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-xs font-semibold text-warm-mid uppercase tracking-wider">
              Add context (optional)
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={'e.g. "find a cheaper version in linen under $90, not see-through"'}
              className="w-full flex-1 rounded-xl border border-soft bg-card px-4 py-3 text-sm text-warm-dark placeholder:text-muted/50 focus:outline-none focus:border-mauve resize-none transition-colors"
            />
            <p className="text-xs text-muted">
              Notes help us find better matches — describe material, price, fit, or occasion.
            </p>
          </div>

          {/* CTA */}
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            loading={loading}
            onClick={() => onSearch(notes)}
          >
            <Sparkles size={15} />
            {loading ? "Analyzing image…" : "Find similar pieces"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Visual signals panel (step 3) ── */

interface VisualSignalsPanelProps {
  dataUrl: string;
  analysis: ImageSearchAnalysis;
  onReset: () => void;
}

export function VisualSignalsPanel({ dataUrl, analysis, onReset }: VisualSignalsPanelProps) {
  const { visualSignals, inferredQuery, confidence, note } = analysis;
  const isMock = analysis.mode === "mock";

  return (
    <div className="bg-card rounded-2xl border border-soft card-shadow overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-0">
        {/* Thumbnail */}
        <div className="sm:w-32 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dataUrl}
            alt="Searched image"
            className="w-full h-40 sm:h-full object-cover"
          />
        </div>

        {/* Analysis */}
        <div className="flex-1 p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Eye size={14} className="text-blush-dark shrink-0" />
              <p className="text-xs font-semibold text-warm-mid uppercase tracking-wider">What I noticed</p>
            </div>
            <button
              className="text-xs text-muted hover:text-warm-dark transition-colors shrink-0"
              onClick={onReset}
            >
              Search again
            </button>
          </div>

          {/* Inferred query */}
          <div>
            <p className="text-xs text-muted mb-1">Searching for</p>
            <p className="text-sm font-medium text-warm-dark">&ldquo;{inferredQuery}&rdquo;</p>
          </div>

          {/* Visual signals grid */}
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {visualSignals.category && (
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider font-medium mb-1">Category</p>
                <Badge variant="blush">{visualSignals.category}</Badge>
              </div>
            )}
            {visualSignals.colors.length > 0 && (
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider font-medium mb-1">Colors</p>
                <div className="flex flex-wrap gap-1">
                  {visualSignals.colors.map((c) => (
                    <Badge key={c} variant="warm">{c}</Badge>
                  ))}
                </div>
              </div>
            )}
            {visualSignals.silhouette && (
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider font-medium mb-1">Silhouette</p>
                <Badge variant="lavender">{visualSignals.silhouette}</Badge>
              </div>
            )}
            {visualSignals.materialHints.length > 0 && (
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider font-medium mb-1">Material hints</p>
                <div className="flex flex-wrap gap-1">
                  {visualSignals.materialHints.map((m) => (
                    <Badge key={m} variant="taupe">{m}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confidence */}
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              confidence === "medium"
                ? "bg-mauve/20 text-mauve-dark"
                : "bg-petal text-muted"
            }`}>
              {confidence === "medium" ? "Medium confidence" : "Low confidence"}
            </span>
            {isMock && (
              <span className="flex items-center gap-1 text-[10px] text-muted">
                <AlertCircle size={10} /> Mock analysis
              </span>
            )}
          </div>

          {/* Note */}
          {note && (
            <p className="text-xs text-muted italic">{note}</p>
          )}
        </div>
      </div>
    </div>
  );
}
