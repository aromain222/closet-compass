"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Shuffle, Wallet, Sparkles } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";

const QUICK_SEARCHES = [
  "silk slip skirt",
  "linen trousers",
  "cashmere cardigan",
  "organic cotton blouse",
];

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  href: string;
  color: string;
}

function QuickAction({ icon, label, sublabel, href, color }: QuickActionProps) {
  return (
    <a
      href={href}
      className={`flex flex-col gap-2 p-4 rounded-2xl border border-soft card-shadow hover:card-shadow-hover transition-all ${color}`}
    >
      <div className="w-10 h-10 rounded-full bg-card/60 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-warm-dark">{label}</p>
        <p className="text-xs text-warm-mid leading-snug">{sublabel}</p>
      </div>
    </a>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function handleSearch(query: string) {
    setLoading(true);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <div className="min-h-screen bg-cream px-4 pt-10 pb-6 max-w-2xl mx-auto">
      {/* Hero */}
      <div className="mb-10 space-y-2">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} className="text-blush-dark" strokeWidth={1.5} />
          <span className="text-xs text-muted uppercase tracking-widest font-medium">Material Muse</span>
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-light text-warm-dark leading-tight text-balance">
          What are we shopping for today?
        </h1>
        <p className="text-base text-muted max-w-sm text-balance">
          Search by feel, material, or vibe — or upload a screenshot to find it.
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-8">
        <SearchBar
          onSearch={handleSearch}
          loading={loading}
          placeholder={'Describe an item… "soft linen trousers under $100"'}
        />
      </div>

      {/* Quick searches */}
      <div className="mb-10">
        <p className="text-xs text-muted uppercase tracking-wider font-medium mb-3">Try searching</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_SEARCHES.map((s) => (
            <button
              key={s}
              className="text-sm text-warm-mid bg-card border border-soft rounded-full px-3 py-1.5 hover:border-mauve hover:text-warm-dark transition-colors"
              onClick={() => handleSearch(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-xs text-muted uppercase tracking-wider font-medium mb-3">Or start here</p>
        <div className="grid grid-cols-2 gap-3">
          <QuickAction
            icon={<Camera size={18} className="text-warm-mid" strokeWidth={1.5} />}
            label="Upload a screenshot"
            sublabel="Find items from saved photos"
            href="/upload"
            color="bg-petal"
          />
          <QuickAction
            icon={<Shuffle size={18} className="text-warm-mid" strokeWidth={1.5} />}
            label="Find a dupe"
            sublabel="Same look, better materials, less money"
            href="/dupes"
            color="bg-lavender/20"
          />
          <QuickAction
            icon={<Sparkles size={18} className="text-warm-mid" strokeWidth={1.5} />}
            label="Wishlist"
            sublabel="Saved pieces, price drops, and tracking"
            href="/wishlist"
            color="bg-mauve/15"
          />
          <QuickAction
            icon={<Wallet size={18} className="text-warm-mid" strokeWidth={1.5} />}
            label="This month"
            sublabel="Where your shopping spend went"
            href="/budget"
            color="bg-blush/20"
          />
        </div>
      </div>
    </div>
  );
}
