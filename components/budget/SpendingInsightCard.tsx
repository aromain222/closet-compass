interface Props {
  symbol: string;
  text: string;
}

export function SpendingInsightCard({ symbol, text }: Props) {
  return (
    <div className="shrink-0 bg-card border border-soft rounded-2xl px-4 py-3.5 min-w-[190px] max-w-[230px] space-y-2">
      <span className="block font-mono text-[11px] font-bold text-blush tracking-widest">{symbol}</span>
      <p className="text-xs text-warm-mid leading-snug">{text}</p>
    </div>
  );
}
