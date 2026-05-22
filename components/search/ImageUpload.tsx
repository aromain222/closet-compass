"use client";

import { useRef, useState, type DragEvent } from "react";
import { Upload, X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  onUpload: (base64: string, file: File) => void;
  loading?: boolean;
}

export function ImageUpload({ onUpload, loading }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function processFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64 = result.split(",")[1];
      setPreview(result);
      onUpload(base64, file);
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function clear() {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (preview) {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-soft card-shadow">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="Upload preview" className="w-full max-h-64 object-contain bg-petal" />
        <button
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-card/90 flex items-center justify-center text-muted hover:text-warm-dark transition-colors"
          onClick={clear}
        >
          <X size={14} />
        </button>
        {loading && (
          <div className="absolute inset-0 bg-cream/70 flex items-center justify-center">
            <p className="text-sm text-warm-mid font-medium">Analyzing image…</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border-2 border-dashed transition-colors cursor-pointer ${
        dragging ? "border-mauve bg-lavender/10" : "border-border-strong hover:border-mauve hover:bg-petal/50"
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
      />
      <div className="flex flex-col items-center justify-center gap-3 py-10 px-6 text-center">
        <div className="w-12 h-12 rounded-full bg-petal flex items-center justify-center">
          <Camera size={22} className="text-muted" strokeWidth={1.5} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-warm-mid">Drop a screenshot here</p>
          <p className="text-xs text-muted">or tap to browse your photos</p>
        </div>
        <Button variant="secondary" size="sm">
          <Upload size={13} /> Choose photo
        </Button>
      </div>
    </div>
  );
}
