import { ReactNode } from "react";
import { SEGMENT_META, Segment } from "@/lib/segmentation";
import { initials, avatarColor } from "@/lib/format";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-[1.75rem] leading-tight tracking-tight text-ink sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 gap-2">{action}</div>}
    </div>
  );
}

export function SegmentBadge({ segment }: { segment: Segment }) {
  const m = SEGMENT_META[segment];
  return (
    <span className={`badge ${m.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const dims =
    size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-14 w-14 text-lg" : "h-10 w-10 text-sm";
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-full font-bold ${dims} ${avatarColor(name)}`}
    >
      {initials(name)}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/10 text-brand-600">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Pill({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "brand" | "gold" | "rose";
}) {
  const tones = {
    slate: "bg-surface-2 text-ink-soft",
    brand: "bg-brand-500/10 text-brand-700 dark:text-brand-400",
    gold: "bg-gold-500/10 text-gold-700 dark:text-gold-400",
    rose: "bg-rose-500/10 text-rose-600",
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-ink-muted">{children}</h2>
      {hint && <span className="text-xs text-ink-muted">{hint}</span>}
    </div>
  );
}
