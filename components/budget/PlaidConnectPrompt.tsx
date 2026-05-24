"use client";

import { Lock, TrendingDown, BarChart2, CircleDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: TrendingDown,     text: "See exactly where your money goes — broken down by category and merchant, not buried in a statement." },
  { icon: BarChart2,        text: "Know your real fashion spend at a glance so nothing catches you off guard." },
  { icon: CircleDollarSign, text: "Get honest buy / pass signals based on your actual numbers — not just gut feeling." },
];

interface Props {
  onConnect: () => void;
}

export function PlaidConnectPrompt({ onConnect }: Props) {
  return (
    <div className="min-h-[72dvh] flex flex-col items-center justify-center py-12">
      <div className="relative w-full max-w-sm mx-auto">

        {/* Soft glow backdrop */}
        <div
          className="absolute -inset-10 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, rgba(232,180,168,0.18) 0%, rgba(197,184,216,0.10) 50%, transparent 80%)",
          }}
        />

        <div className="relative bg-card rounded-3xl border border-soft card-shadow overflow-hidden">

          {/* Top color band */}
          <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #E8B4A8 0%, #C5B8D8 50%, #C49A9A 100%)" }} />

          <div className="p-8 space-y-7">

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="font-display text-[1.75rem] font-light text-warm-dark leading-tight text-balance">
                Know exactly where your fashion money goes.
              </h1>
              <p className="text-sm text-muted leading-relaxed text-balance">
                Connect your bank and see the full picture — what you&rsquo;re spending, where it&rsquo;s going, and whether any of it is actually worth it.
              </p>
            </div>

            {/* Feature list */}
            <div className="space-y-3.5">
              {FEATURES.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-petal border border-soft flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={13} className="text-warm-mid" strokeWidth={1.5} />
                  </div>
                  <p className="text-xs text-warm-mid leading-relaxed">{text}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="space-y-3">
              <Button variant="primary" size="md" className="w-full" onClick={onConnect}>
                Connect with Plaid
              </Button>
              <div className="flex items-center justify-center gap-1.5">
                <Lock size={10} className="text-muted" />
                <p className="text-[11px] text-muted text-center">
                  Secure bank connection powered by Plaid. We never see your credentials.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
