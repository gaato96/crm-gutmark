"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export interface SalesPoint {
  label: string;
  total: number;
}

function money(n: number) {
  if (n >= 1000) return `$${Math.round(n / 1000)}k`;
  return `$${n}`;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 shadow-pop">
      <div className="text-xs font-medium text-ink-muted">{label}</div>
      <div className="text-sm font-bold tabular-nums text-ink">
        {new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: "ARS",
          maximumFractionDigits: 0,
        }).format(payload[0].value)}
      </div>
    </div>
  );
}

export function SalesChart({ data }: { data: SalesPoint[] }) {
  const hasSales = data.some((d) => d.total > 0);

  if (!hasSales) {
    return (
      <div className="grid h-56 place-items-center text-sm text-ink-muted">
        Todavía no hay ventas registradas en este período.
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00BE86" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#00BE86" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-line" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "currentColor" }}
            className="text-ink-faint"
            axisLine={false}
            tickLine={false}
            interval={Math.ceil(data.length / 7) - 1}
          />
          <YAxis
            tickFormatter={money}
            tick={{ fontSize: 11, fill: "currentColor" }}
            className="text-ink-faint"
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#00BE86", strokeWidth: 1, strokeDasharray: "3 3" }} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#008860"
            strokeWidth={2.5}
            fill="url(#salesFill)"
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
