import { ReactNode } from "react";

export function StatCard({
  label,
  value,
  icon,
  hint,
  tone = "brand",
}: {
  label: string;
  value: string;
  icon: ReactNode;
  hint?: string;
  tone?: "brand" | "gold" | "sky" | "slate";
}) {
  const tones = {
    brand: "bg-brand-500/10 text-brand-600 dark:text-brand-400",
    gold: "bg-gold-500/10 text-gold-600 dark:text-gold-400",
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    slate: "bg-surface-3 text-ink-muted",
  };
  const glows = {
    brand: "group-hover:shadow-brand-500/10",
    gold: "group-hover:shadow-gold-500/10",
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
      {hint && <div className="mt-2 text-xs text-ink-muted">{hint}</div>}
    </div>
  );
}
