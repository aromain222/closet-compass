"use client";

import { useState, useCallback, useEffect } from "react";
import { Link2, CreditCard, User, ChevronRight, CheckCircle, AlertCircle } from "lucide-react";
import { usePlaidLink } from "react-plaid-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api/client";
import { useUser } from "@/lib/context/user";

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">{title}</h2>
      {children}
    </div>
  );
}

function SettingsRow({
  icon,
  label,
  sublabel,
  action,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 bg-card rounded-2xl border border-soft px-4 py-3.5 card-shadow">
      <div className="w-9 h-9 rounded-xl bg-petal flex items-center justify-center text-muted shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-warm-dark">{label}</p>
          {badge}
        </div>
        {sublabel && <p className="text-xs text-muted mt-0.5">{sublabel}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export default function SettingsPage() {
  const { userId } = useUser();

  const [plaidConnected, setPlaidConnected] = useState(false);
  const [plaidLoading, setPlaidLoading] = useState(false);
  const [plaidError, setPlaidError] = useState<string | null>(null);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [budgetInput, setBudgetInput] = useState("400");
  const [budgetSaved, setBudgetSaved] = useState(false);

  const onPlaidSuccess = useCallback(async (publicToken: string) => {
    try {
      await api.exchangePlaidToken(userId, publicToken);
      setPlaidConnected(true);
      setLinkToken(null);
    } catch {
      setPlaidError("Bank connected but token exchange failed. Try again.");
    }
  }, [userId]);

  const { open: openPlaidLink, ready: plaidReady } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: () => { setPlaidLoading(false); setLinkToken(null); },
  });

  async function handlePlaidConnect() {
    setPlaidLoading(true);
    setPlaidError(null);
    try {
      const res = await api.createPlaidLinkToken(userId);
      if (res.mode === "mock") {
        // No real Plaid credentials — simulate connection
        await new Promise((r) => setTimeout(r, 800));
        setPlaidConnected(true);
        setPlaidLoading(false);
      } else {
        setLinkToken(res.linkToken);
        // plaidReady will become true once token is set, then open
      }
    } catch {
      setPlaidError("Could not start bank connection. Check your Plaid credentials.");
      setPlaidLoading(false);
    }
  }

  // Open Plaid Link as soon as the token is ready
  useEffect(() => {
    if (plaidReady && linkToken) openPlaidLink();
  }, [plaidReady, linkToken, openPlaidLink]);

  async function handleStripeCheckout() {
    setStripeLoading(true);
    try {
      const res = await api.createStripeCheckout({
        userId,
        successUrl: `${window.location.origin}/settings?premium=success`,
        cancelUrl: `${window.location.origin}/settings`,
      });
      if (res.checkoutUrl && !res.checkoutUrl.includes("example")) {
        window.location.href = res.checkoutUrl;
      }
    } catch {
      // best effort
    } finally {
      setStripeLoading(false);
    }
  }

  function saveBudget() {
    setBudgetSaved(true);
    setTimeout(() => setBudgetSaved(false), 2500);
  }

  return (
    <div className="min-h-screen bg-cream px-4 py-8 max-w-lg mx-auto">
      <h1 className="font-display text-3xl font-light text-warm-dark mb-8">Settings</h1>

      <div className="space-y-8">
        {/* Account */}
        <SettingsSection title="Account">
          <SettingsRow
            icon={<User size={16} />}
            label="Demo account"
            sublabel={`User ID: ${userId.slice(0, 8)}…`}
            badge={<Badge variant="muted">Demo</Badge>}
            action={<ChevronRight size={14} className="text-muted" />}
          />
        </SettingsSection>

        {/* Budget */}
        <SettingsSection title="Shopping budget">
          <Card padding="md">
            <p className="text-sm font-medium text-warm-dark mb-3">Monthly shopping limit</p>
            <div className="flex gap-2">
              <Input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                icon={<span className="text-xs">$</span>}
                className="flex-1"
              />
              <Button variant="primary" size="sm" onClick={saveBudget}>
                {budgetSaved ? <><CheckCircle size={13} /> Saved</> : "Save"}
              </Button>
            </div>
            <p className="text-xs text-muted mt-2">
              Used on your Budget page to track spending and flag recommendations.
            </p>
          </Card>
        </SettingsSection>

        {/* Plaid */}
        <SettingsSection title="Bank connection">
          <SettingsRow
            icon={<Link2 size={16} />}
            label="Connect via Plaid"
            sublabel={
              plaidConnected
                ? "Connected — pulling shopping transactions"
                : "See real spending data from your accounts"
            }
            badge={plaidConnected ? <Badge variant="success">Connected</Badge> : undefined}
            action={
              plaidConnected ? (
                <Badge variant="success">Active</Badge>
              ) : (
                <Button variant="blush" size="sm" loading={plaidLoading} onClick={handlePlaidConnect}>
                  Connect
                </Button>
              )
            }
          />
          {plaidError && (
            <p className="text-xs text-red-400 pl-1 flex items-center gap-1">
              <AlertCircle size={11} /> {plaidError}
            </p>
          )}
          {!plaidConnected && !plaidError && (
            <p className="text-xs text-muted pl-1">
              Material Muse reads transactions read-only to calculate your shopping spend. Credentials are never stored.
            </p>
          )}
        </SettingsSection>

        {/* Stripe */}
        <SettingsSection title="Premium">
          <SettingsRow
            icon={<CreditCard size={16} />}
            label="Go Premium"
            sublabel="Unlimited tracked products, advanced dupe search"
            action={
              <Button variant="outline" size="sm" loading={stripeLoading} onClick={handleStripeCheckout}>
                Upgrade
              </Button>
            }
          />
          <p className="text-xs text-muted pl-1">Stripe test mode — no real charge will occur.</p>
        </SettingsSection>

        {/* About */}
        <SettingsSection title="About">
          <Card padding="md">
            <p className="text-sm font-display font-light text-warm-dark mb-1">Material Muse</p>
            <p className="text-xs text-muted leading-relaxed">
              A fashion-first shopping and budgeting companion. Materials are scored for softness, breathability, opacity, and durability so you can shop smarter, not just cheaper.
            </p>
            <p className="text-xs text-muted/60 mt-3">v0.1.0 · Demo mode · {new Date().getFullYear()}</p>
          </Card>
        </SettingsSection>
      </div>
    </div>
  );
}
