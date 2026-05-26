"use client";

import Link from "next/link";
import { Shuffle, Heart, Wallet, ArrowRight } from "lucide-react";

const features = [
  {
    href: "/dupes",
    icon: Shuffle,
    iconBg: "bg-blush/20",
    iconColor: "text-blush-dark",
    title: "Dupes",
    body: "Paste any product link or name. Get ranked alternatives with real material breakdowns — fragrance, clothing, bags, and jewelry.",
    accent: "group-hover:border-blush",
  },
  {
    href: "/wishlist",
    icon: Heart,
    iconBg: "bg-lavender/30",
    iconColor: "text-lavender-dark",
    title: "Saved",
    body: "Save your favorite finds and dupes to revisit later. Build a wishlist sorted by savings and quality.",
    accent: "group-hover:border-lavender",
  },
  {
    href: "/budget",
    icon: Wallet,
    iconBg: "bg-mauve/20",
    iconColor: "text-mauve-dark",
    title: "Spending",
    body: "Track your fashion budget and see exactly how much you've saved choosing dupes over originals.",
    accent: "group-hover:border-mauve",
  },
];

const steps = [
  {
    n: "01",
    title: "Search any product",
    body: "Paste a URL, type a product name, or describe what you want — fragrance, clothing, bag, or jewelry.",
  },
  {
    n: "02",
    title: "Get ranked alternatives",
    body: "Scored by material match, price savings, and community-vetted fidelity. Not just the cheapest option.",
  },
  {
    n: "03",
    title: "Shop with confidence",
    body: "See material breakdowns, quality comparisons, and real ratings before committing.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">

      {/* Hero */}
      <section className="relative px-6 pt-14 pb-12 md:pt-20 md:pb-14 overflow-hidden">
        <div className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 rounded-full bg-blush/20 blur-3xl" />
        <div className="pointer-events-none absolute top-40 -left-10 w-56 h-56 rounded-full bg-lavender/15 blur-3xl" />

        <div className="relative max-w-lg">
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-mauve mb-5">
            Fashion intelligence
          </p>
          <h1 className="font-display text-[2.75rem] md:text-[3.5rem] font-light text-warm-dark leading-[1.1] tracking-tight mb-5">
            Find what you love.<br />
            <span className="italic text-mauve-dark">Pay less for it.</span>
          </h1>
          <p className="text-sm text-muted leading-relaxed mb-9 max-w-sm">
            Material Muse surfaces designer dupes for clothing, fragrance, jewelry, and bags — ranked by what actually matters for each category.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dupes"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-warm-dark text-cream text-sm font-medium hover:bg-warm-mid transition-colors"
            >
              Find a dupe <ArrowRight size={13} />
            </Link>
            <Link
              href="/wishlist"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-border-strong text-warm-mid text-sm font-medium hover:bg-petal transition-colors"
            >
              View saved
            </Link>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="px-6 pb-14">
        <p className="text-[10px] text-muted uppercase tracking-[0.15em] font-semibold mb-5">What&apos;s inside</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
          {features.map(({ href, icon: Icon, iconBg, iconColor, title, body, accent }) => (
            <Link
              key={href}
              href={href}
              className={`group p-5 rounded-2xl bg-card border border-soft ${accent} hover:shadow-card transition-all`}
            >
              <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center mb-4`}>
                <Icon size={16} className={iconColor} />
              </div>
              <h3 className="font-display text-lg font-medium text-warm-dark mb-1.5">{title}</h3>
              <p className="text-[11px] text-muted leading-relaxed">{body}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 pb-16 max-w-lg">
        <p className="text-[10px] text-muted uppercase tracking-[0.15em] font-semibold mb-6">How it works</p>
        <div className="space-y-5">
          {steps.map((s) => (
            <div key={s.n} className="flex gap-5 items-start">
              <span className="font-display text-[2rem] font-light text-blush leading-none mt-0.5 min-w-[2.5rem]">
                {s.n}
              </span>
              <div>
                <p className="text-sm font-medium text-warm-dark mb-1">{s.title}</p>
                <p className="text-[11px] text-muted leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section className="mx-6 mb-10 rounded-2xl bg-petal border border-soft px-6 py-8 max-w-2xl flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <p className="font-display text-xl font-light text-warm-dark mb-1">Ready to start saving?</p>
          <p className="text-xs text-muted">Search any product and find your first dupe in seconds.</p>
        </div>
        <Link
          href="/dupes"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-warm-dark text-cream text-sm font-medium hover:bg-warm-mid transition-colors whitespace-nowrap"
        >
          Get started <ArrowRight size={13} />
        </Link>
      </section>

    </div>
  );
}
