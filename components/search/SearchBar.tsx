"use client";

import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading?: boolean;
  placeholder?: string;
  initialValue?: string;
  size?: "sm" | "lg";
}

export function SearchBar({ onSearch, loading, placeholder, initialValue = "", size = "lg" }: SearchBarProps) {
  const [value, setValue] = useState(initialValue);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (value.trim()) onSearch(value.trim());
  }

  const inputClass =
    size === "lg"
      ? "flex-1 bg-transparent border-none outline-none text-base text-warm-dark placeholder:text-muted/60 py-4 pl-5 pr-2"
      : "flex-1 bg-transparent border-none outline-none text-sm text-warm-dark placeholder:text-muted/60 py-3 pl-4 pr-2";

  return (
    <form onSubmit={handleSubmit} className="flex items-center bg-card border border-soft rounded-2xl card-shadow focus-within:border-mauve focus-within:ring-1 focus-within:ring-mauve transition-all">
      <Search size={size === "lg" ? 18 : 16} className="ml-4 text-muted shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder ?? "Describe what you're looking for…"}
        className={inputClass}
      />
      <div className="pr-2">
        <Button
          type="submit"
          variant="primary"
          size={size === "lg" ? "md" : "sm"}
          loading={loading}
          disabled={!value.trim()}
        >
          Search
        </Button>
      </div>
    </form>
  );
}
