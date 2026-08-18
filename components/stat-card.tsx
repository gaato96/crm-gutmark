import { ReactNode } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

function DeltaBadge({ delta }: { delta: number }) {
  if (!Number.isFinite(delta)) return null;
  const rounded = Math.round(delta);
  const isUp = rounded > 0;
  const isFlat = rounded === 0;
  const Icon = isUp ? ArrowUp : ArrowDown;

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums ${
        isFlat
          ? "bg-surface-3 text-ink-muted"
          : isUp
          ? "bg-brand-500/15 text-brand-700 dark:text-brand-300"
          : "bg-rose-500/10 text-rose-600"
      }`}
    >
      {!isFlat && <Icon className="h-3 w-3" aria-hidden="true" strokeWidth={3} />}
      {isFlat ? "sin cambios" : `${Math.abs(rounded)}%`}
    </span>
  );
}

export function StatCard({
  label,
  value,
  icon,
  hint,
  tone = "brand",
  delta,
  deltaLabel = "vs. mes anterior",
}: {
  label: string;
  value: string;
  icon: ReactNode;
  hint?: string;
  tone?: "brand" | "accent" | "sky" | "slate";
  delta?: number;
  deltaLabel?: string;
}) {
  const tones = {
    brand: "bg-brand-500/10 text-brand-600 dark:text-brand-400",
    accent: "bg-accent-500/10 text-accent-600 dark:text-accent-400",
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    slate: "bg-surface-3 text-ink-muted",
  };
  const glows = {
    brand: "group-hover:shadow-brand-500/10",
    accent: "group-hover:shadow-accent-500/10",
    sky: "group-hover:shadow-sky-500/10",
    slate: "",
  };
  return (
    <div
      className={`card group relative overflow-hidden p-5 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-pop ${glows[tone]}`}
    >
      <div className="flex items-start justify-between">
        <div className="text-sm font-medium text-ink-muted">{label}</div>
        <div
          className={`grid h-10 w-10 place-items-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${tones[tone]}`}
        >
          {icon}
        </div>
      </div>
      <div className="mt-3.5 text-[1.75rem] font-bold leading-none tracking-tight text-ink tabular-nums">
        {value}
      </div>
      <div className="mt-2 flex items-center gap-2">
        {delta !== undefined && <DeltaBadge delta={delta} />}
        {hint && <span className="text-xs text-ink-muted">{delta !== undefined ? deltaLabel : hint}</span>}
      </div>
    </div>
  );
}
