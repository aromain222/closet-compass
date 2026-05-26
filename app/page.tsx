"use client";

import Link from "next/link";
import { Shuffle, Heart, Wallet, ArrowRight, ShieldCheck, Lock, Eye } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    href: "/dupes",
    icon: Shuffle,
    iconBg: "bg-blush/20",
    iconColor: "text-blush-dark",
    title: "Dupes",
    body: "Paste any product link or name. Get ranked alternatives with real material breakdowns — fragrance, clothing, bags, and jewelry.",
    border: "hover:border-blush",
  },
  {
    href: "/wishlist",
    icon: Heart,
    iconBg: "bg-lavender/30",
    iconColor: "text-lavender-dark",
    title: "Saved",
    body: "Save your favorite finds and dupes to revisit later. Build a wishlist sorted by savings and quality.",
    border: "hover:border-lavender",
  },
  {
    href: "/budget",
    icon: Wallet,
    iconBg: "bg-mauve/20",
    iconColor: "text-mauve-dark",
    title: "Spending",
    body: "Track your fashion budget and see exactly how much you've saved choosing dupes over originals.",
    border: "hover:border-mauve",
  },
];

const steps = [
  { n: "01", title: "Search any product", body: "Paste a URL, type a product name, or describe what you want — fragrance, clothing, bag, or jewelry." },
  { n: "02", title: "Get ranked alternatives", body: "Scored by material match, price savings, and community-vetted fidelity. Not just the cheapest option." },
  { n: "03", title: "Shop with confidence", body: "See material breakdowns, quality comparisons, and real ratings before committing." },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* Floating blobs */}
      <motion.div
        className="pointer-events-none fixed -top-24 -right-16 w-96 h-96 rounded-full bg-blush/25 blur-3xl"
        animate={{ y: [0, -18, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none fixed top-60 -left-16 w-64 h-64 rounded-full bg-lavender/20 blur-3xl"
        animate={{ y: [0, 14, 0], scale: [1, 1.04, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="pointer-events-none fixed bottom-32 right-8 w-48 h-48 rounded-full bg-mauve/15 blur-3xl"
        animate={{ y: [0, -10, 0], x: [0, 8, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />

      {/* Hero */}
      <section className="relative px-6 pt-12 pb-10 md:pt-20 md:pb-14">
        <div className="max-w-lg">

          {/* Personalized greeting */}
          <motion.div {...fadeUp(0)} className="flex items-center gap-2 mb-6">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blush" />
            <span className="text-xs font-medium tracking-[0.18em] text-mauve uppercase">
              Hi, Nisa
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            {...fadeUp(0.1)}
            className="font-display text-[2.75rem] md:text-[3.75rem] font-light text-warm-dark leading-[1.08] tracking-tight mb-5"
          >
            Find what you love.<br />
            <motion.span
              className="italic text-mauve-dark inline-block"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              Pay less for it.
            </motion.span>
          </motion.h1>

          {/* Subtext */}
          <motion.p {...fadeUp(0.25)} className="text-sm text-muted leading-relaxed mb-9 max-w-sm">
            Material Muse surfaces designer dupes for clothing, fragrance, jewelry, and bags — ranked by what actually matters for each category.
          </motion.p>

          {/* CTAs */}
          <motion.div {...fadeUp(0.35)} className="flex flex-wrap gap-3">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/dupes"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-warm-dark text-cream text-sm font-medium hover:bg-warm-mid transition-colors"
              >
                Find a dupe <ArrowRight size={13} />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/wishlist"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-border-strong text-warm-mid text-sm font-medium hover:bg-petal transition-colors"
              >
                View saved
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="px-6 pb-14">
        <motion.p {...fadeUp(0.45)} className="text-[10px] text-muted uppercase tracking-[0.15em] font-semibold mb-5">
          What&apos;s inside
        </motion.p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
          {features.map(({ href, icon: Icon, iconBg, iconColor, title, body, border }, i) => (
            <motion.div
              key={href}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.5 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Link
                href={href}
                className={`group block p-5 rounded-2xl bg-card border border-soft ${border} hover:shadow-card transition-all h-full`}
              >
                <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center mb-4`}>
                  <Icon size={16} className={iconColor} />
                </div>
                <h3 className="font-display text-lg font-medium text-warm-dark mb-1.5">{title}</h3>
                <p className="text-[11px] text-muted leading-relaxed">{body}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Plaid bank connect */}
      <section className="px-6 pb-14 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-soft bg-card overflow-hidden"
        >
          {/* Top bar */}
          <div className="px-6 py-5 border-b border-soft flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-success-soft/30 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={16} className="text-green-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-warm-dark">Connect your bank</p>
              <p className="text-[11px] text-muted">Powered by Plaid — trusted by 12,000+ apps</p>
            </div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="ml-auto">
              <Link
                href="/settings"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-warm-dark text-cream text-xs font-medium hover:bg-warm-mid transition-colors whitespace-nowrap"
              >
                Connect <ArrowRight size={11} />
              </Link>
            </motion.div>
          </div>

          {/* Trust bullets */}
          <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: Eye, label: "Read-only access", body: "We can see transactions — never move money." },
              { icon: Lock, label: "256-bit encryption", body: "The same security used by your bank's own app." },
              { icon: ShieldCheck, label: "Used by Chase & Venmo", body: "Plaid powers the apps 100M+ people already trust." },
            ].map(({ icon: Icon, label, body }) => (
              <div key={label} className="flex gap-3 items-start">
                <Icon size={13} className="text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-warm-dark mb-0.5">{label}</p>
                  <p className="text-[10px] text-muted leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="px-6 py-3 bg-petal/60 border-t border-soft">
            <p className="text-[10px] text-muted">
              Connecting your bank lets Material Muse automatically track fashion spending and show you how much you&apos;ve saved by choosing dupes over originals.
            </p>
          </div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="px-6 pb-16 max-w-lg">
        <motion.p {...fadeUp(0.75)} className="text-[10px] text-muted uppercase tracking-[0.15em] font-semibold mb-6">
          How it works
        </motion.p>
        <div className="space-y-5">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.8 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="flex gap-5 items-start"
            >
              <span className="font-display text-[2rem] font-light text-blush leading-none mt-0.5 min-w-[2.5rem]">
                {s.n}
              </span>
              <div>
                <p className="text-sm font-medium text-warm-dark mb-1">{s.title}</p>
                <p className="text-[11px] text-muted leading-relaxed">{s.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="mx-6 mb-10 rounded-2xl bg-petal border border-soft px-6 py-8 max-w-2xl flex flex-col sm:flex-row sm:items-center gap-4"
      >
        <div className="flex-1">
          <p className="font-display text-xl font-light text-warm-dark mb-1">
            Ready to start saving?
          </p>
          <p className="text-xs text-muted">Search any product and find your first dupe in seconds.</p>
        </div>
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
          <Link
            href="/dupes"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-warm-dark text-cream text-sm font-medium hover:bg-warm-mid transition-colors whitespace-nowrap"
          >
            Get started <ArrowRight size={13} />
          </Link>
        </motion.div>
      </motion.section>

    </div>
  );
}
