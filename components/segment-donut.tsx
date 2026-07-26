"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { SEGMENT_META, Segment } from "@/lib/segmentation";

const COLORS: Record<Segment, string> = {
  vip: "#f59e0b",
  frecuente: "#10b981",
  ocasional: "#0ea5e9",
  nuevo: "#8b5cf6",
  inactivo: "#94a3b8",
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) {
  if (!active || !payload?.length) return null;
  const seg = payload[0].name as Segment;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 shadow-pop">
      <div className="text-xs font-medium text-ink-muted">{SEGMENT_META[seg].label}</div>
      <div className="text-sm font-bold tabular-nums text-ink">{payload[0].value} clientes</div>
    </div>
  );
}

export function SegmentDonut({ counts }: { counts: Record<Segment, number> }) {
  const segments = Object.keys(SEGMENT_META) as Segment[];
  const total = segments.reduce((s, seg) => s + counts[seg], 0);
  const data = segments
    .filter((seg) => counts[seg] > 0)
    .map((seg) => ({ name: seg, value: counts[seg] }));

  if (total === 0) {
    return (
      <div className="grid h-48 place-items-center text-sm text-ink-muted">
        Todavía no hay clientes para mostrar.
      </div>
    );
  }

  return (
    <div className="relative h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="100%"
            paddingAngle={3}
            stroke="none"
            animationDuration={500}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name as Segment]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-2xl font-bold tabular-nums text-ink">{total}</div>
          <div className="text-xs text-ink-muted">clientes</div>
        </div>
      </div>
    </div>
  );
}
