"use client";

import type { PriceHistoryPoint } from "@/lib/products/types";

interface PriceHistoryChartProps {
  history: PriceHistoryPoint[];
  targetPrice?: number | null;
}

function fmtPrice(p: number) {
  return `$${p % 1 === 0 ? p.toFixed(0) : p.toFixed(2)}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function PriceHistoryChart({ history, targetPrice }: PriceHistoryChartProps) {
  const sorted = [...history].sort(
    (a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime()
  );

  if (sorted.length < 2) {
    return (
      <p className="text-xs text-muted italic text-center py-3">
        Not enough price history to chart yet.
      </p>
    );
  }

  const prices = sorted.map((p) => p.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const currentP = prices.at(-1)!;
  const firstP = prices[0];
  const priceDrop = parseFloat((firstP - currentP).toFixed(2));

  const W = 300;
  const H = 56;
  const PAD = 6;

  const t0 = new Date(sorted[0].observedAt).getTime();
  const t1 = new Date(sorted.at(-1)!.observedAt).getTime();
  const tRange = t1 - t0 || 1;
  const pRange = maxP - minP || 1;

  function toX(iso: string) {
    return PAD + ((new Date(iso).getTime() - t0) / tRange) * (W - PAD * 2);
  }
  function toY(p: number) {
    return PAD + (1 - (p - minP) / pRange) * (H - PAD * 2);
  }

  const pts = sorted.map((p) => ({ x: toX(p.observedAt), y: toY(p.price) }));
  const linePath = pts
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(" ");

  const targetY =
    targetPrice != null && targetPrice >= minP && targetPrice <= maxP
      ? toY(targetPrice)
      : null;

  const atTarget = targetPrice != null && currentP <= targetPrice;

  return (
    <div className="space-y-3">
      {/* Stats row */}
      <div className="flex items-center gap-4 flex-wrap text-xs">
        <span className="font-semibold text-warm-dark">Now {fmtPrice(currentP)}</span>
        <span className="text-muted">High {fmtPrice(maxP)}</span>
        <span className="text-muted">Low {fmtPrice(minP)}</span>
        {priceDrop > 0 && (
          <span className="text-green-700 font-medium">↓ {fmtPrice(priceDrop)} from start</span>
        )}
        {priceDrop < 0 && (
          <span className="text-muted">↑ {fmtPrice(-priceDrop)} from start</span>
        )}
      </div>

      {/* Target price status */}
      {targetPrice != null && (
        <div className={`text-xs font-medium px-2.5 py-1 rounded-full inline-flex w-fit ${
          atTarget
            ? "bg-success-soft/20 text-green-700 border border-success-soft/40"
            : "bg-mauve/10 text-mauve-dark border border-mauve/20"
        }`}>
          Target {fmtPrice(targetPrice)}
          {atTarget
            ? " · At your target price!"
            : ` · ${fmtPrice(currentP - targetPrice)} to go`}
        </div>
      )}

      {/* Chart */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
        style={{ height: 56 }}
      >
        {/* Target price dashed line */}
        {targetY != null && (
          <line
            x1={PAD}
            y1={targetY}
            x2={W - PAD}
            y2={targetY}
            stroke="#C49A9A"
            strokeWidth="0.8"
            strokeDasharray="3 2"
          />
        )}
        {/* Price line */}
        <path
          d={linePath}
          fill="none"
          stroke="#C89080"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Data point circles */}
        {pts.map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r="2.5" fill="#C89080" />
        ))}
        {/* Price labels at first and last */}
        <text x={pts[0].x} y={pts[0].y - 5} textAnchor="middle" fontSize="7" fill="#9A8A80">
          {fmtPrice(firstP)}
        </text>
        <text x={pts.at(-1)!.x} y={pts.at(-1)!.y - 5} textAnchor="middle" fontSize="7" fill="#5A3A2A" fontWeight="600">
          {fmtPrice(currentP)}
        </text>
      </svg>

      {/* Date range */}
      <div className="flex justify-between text-[10px] text-muted">
        <span>{fmtDate(sorted[0].observedAt)}</span>
        <span>{fmtDate(sorted.at(-1)!.observedAt)}</span>
      </div>
    </div>
  );
}
