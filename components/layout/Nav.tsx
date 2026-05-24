"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shuffle, Heart, Wallet, Settings } from "lucide-react";

const links = [
  { href: "/dupes", label: "Dupes", icon: Shuffle },
  { href: "/wishlist", label: "Saved", icon: Heart },
  { href: "/budget", label: "Spending", icon: Wallet },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-60 flex-col bg-card border-r border-soft pt-8 pb-6 z-40">
        <div className="px-6 mb-10">
          <span className="font-display text-2xl font-light tracking-wide text-warm-dark">
            Material Muse
          </span>
        </div>
        <nav className="flex flex-col gap-1 px-3 flex-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-petal text-warm-dark"
                    : "text-muted hover:text-warm-dark hover:bg-petal/50"
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2 : 1.5} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-6 mt-auto">
          <p className="text-xs text-muted/70">Demo mode</p>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-soft flex items-center justify-around px-2 pb-safe">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 py-3 px-3 min-w-0 transition-colors ${
                active ? "text-warm-dark" : "text-muted"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2 : 1.5} />
              <span className="text-[10px] font-medium truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
