"use client";

import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { Camera, Link2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadZoneProps {
  onFile: (base64: string, dataUrl: string, file: File) => void;
  onUrl: (url: string) => void;
}

const HINTS = [
  "Screenshot from Instagram or Pinterest",
  "A photo from a retail site",
  "A saved inspo image from your camera roll",
  "A runway or editorial look",
];

export function UploadZone({ onFile, onUrl }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function processFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const base64 = dataUrl.split(",")[1];
      onFile(base64, dataUrl, file);
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) { processFile(file); return; }
    const url = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
    if (url?.startsWith("http")) onUrl(url);
  }

  function handleUrlSubmit(e: FormEvent) {
    e.preventDefault();
    if (urlValue.trim()) onUrl(urlValue.trim());
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-12">
      {/* Wordmark */}
      <div className="flex items-center gap-2 mb-12">
        <Sparkles size={15} className="text-blush-dark" strokeWidth={1.5} />
        <span className="font-display text-lg font-light tracking-wide text-warm-dark">Material Muse</span>
      </div>

      {/* Headline */}
      <div className="text-center mb-10 space-y-2 max-w-md">
        <h1 className="font-display text-4xl md:text-5xl font-light text-warm-dark leading-tight">
          Drop a screenshot.<br />We&rsquo;ll find it.
        </h1>
        <p className="text-sm text-muted max-w-xs mx-auto text-balance">
          Upload any fashion image and we&rsquo;ll find similar pieces — ranked by material quality.
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={`w-full max-w-md rounded-3xl border-2 border-dashed transition-all cursor-pointer ${
          dragging
            ? "border-mauve bg-lavender/15 scale-[1.01]"
            : "border-border-strong hover:border-mauve hover:bg-petal/60"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !urlMode && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
        />

        <div className="flex flex-col items-center justify-center gap-5 py-14 px-8">
          {/* Icon */}
          <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center transition-colors ${dragging ? "bg-lavender/30" : "bg-petal"}`}>
            <Camera size={34} className="text-muted" strokeWidth={1.5} />
            {dragging && (
              <div className="absolute inset-0 rounded-2xl border-2 border-mauve animate-pulse" />
            )}
          </div>

          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-warm-dark">
              {dragging ? "Drop it here" : "Drag and drop an image"}
            </p>
            <p className="text-xs text-muted">or</p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
          >
            Choose photo
          </Button>

          {/* URL toggle */}
          <button
            className="flex items-center gap-1.5 text-xs text-muted hover:text-warm-dark transition-colors"
            onClick={(e) => { e.stopPropagation(); setUrlMode((v) => !v); }}
          >
            <Link2 size={12} /> Paste an image link instead
          </button>

          {urlMode && (
            <form
              className="w-full"
              onSubmit={(e) => { e.stopPropagation(); handleUrlSubmit(e); }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://…"
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  className="flex-1 rounded-xl border border-soft bg-card px-3 py-2 text-sm text-warm-dark placeholder:text-muted/50 focus:outline-none focus:border-mauve transition-colors"
                  autoFocus
                />
                <Button type="submit" variant="secondary" size="sm">Go</Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Hints */}
      <div className="mt-10 text-center space-y-3">
        <p className="text-xs text-muted uppercase tracking-wider font-medium">Works great with</p>
        <div className="flex flex-wrap justify-center gap-2">
          {HINTS.map((h) => (
            <span key={h} className="text-xs text-warm-mid bg-card border border-soft rounded-full px-3 py-1.5">
              {h}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
