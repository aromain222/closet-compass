"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { CategoryItem } from "@/lib/mock/spendingData";
import { formatCurrency } from "@/lib/mock/spendingData";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as CategoryItem;
  return (
    <div className="bg-card border border-soft rounded-xl px-3 py-2 card-shadow">
      <p className="text-xs font-semibold text-warm-dark">{d?.category}</p>
      <p className="text-xs text-muted font-mono">{formatCurrency(d?.spend ?? 0)}</p>
    </div>
  );
}

interface Props {
  data: CategoryItem[];
}

export function SpendingBreakdownChart({ data }: Props) {
  const total = data.reduce((s, d) => s + d.spend, 0);

  return (
    <div className="flex items-center gap-5">
      {/* Donut */}
      <div className="w-[110px] h-[110px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="spend"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={34}
              outerRadius={52}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2">
        {data.map((d) => {
          const pct = Math.round((d.spend / total) * 100);
          return (
            <div key={d.category} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-xs text-warm-mid flex-1 truncate">{d.category}</span>
              <span className="text-[10px] text-muted w-7 text-right">{pct}%</span>
              <span className="text-xs font-semibold text-warm-dark font-mono w-12 text-right">
                {formatCurrency(d.spend)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
