"use client";

import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import type { WeeklyPoint } from "@/lib/mock/spendingData";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-soft rounded-xl px-3 py-2 card-shadow space-y-1">
      <p className="text-[10px] text-muted font-medium">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any) => (
        <p key={p.name} className="text-xs font-semibold font-mono" style={{ color: p.stroke }}>
          {p.name} — ${p.value}
        </p>
      ))}
    </div>
  );
}

interface Props {
  data: WeeklyPoint[];
}

export function SpendingTrendChart({ data }: Props) {
  const trimmed = data.slice(-8);

  return (
    <div className="h-[160px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={trimmed} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EDE8E3" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 10, fill: "#8C7B70" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#8C7B70" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="total"
            name="Total"
            stroke="#C5B8D8"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#C5B8D8", strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="fashion"
            name="Fashion"
            stroke="#E8B4A8"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={false}
            activeDot={{ r: 4, fill: "#E8B4A8", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
