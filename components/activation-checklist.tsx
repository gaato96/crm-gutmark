"use client";

import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight, Rocket } from "lucide-react";
import type { ActivationStep } from "@/lib/activation";

// Va en Inicio mientras quede algún paso. El paso "Nueva venta" no navega:
// abre el modal con la misma tecla que usa el resto del panel.
export function ActivationChecklist({ steps }: { steps: ActivationStep[] }) {
  const done = steps.filter((s) => s.done).length;
  const pct = Math.round((done / steps.length) * 100);
  const next = steps.find((s) => !s.done);

  return (
    <section aria-labelledby="activacion" className="card mb-4 overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-line-soft px-5 py-3.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500/12 text-brand-700 dark:text-brand-300">
          <Rocket className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="activacion" className="font-display text-sm font-bold text-ink">
            Dejá tu cuenta lista
          </h2>
          <p className="text-xs text-ink-muted">
            {done} de {steps.length} pasos. Con los cuatro hechos, el sistema ya te dice a quién escribirle cada día.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-28 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-bold tabular-nums text-ink-soft">{pct}%</span>
        </div>
      </div>
      <ol className="grid sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => {
          const isNext = s.code === next?.code;
          const content = (
            <>
              {s.done ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              ) : (
                <Circle className={`mt-0.5 h-5 w-5 shrink-0 ${isNext ? "text-accent-600 dark:text-accent-300" : "text-ink-faint"}`} />
              )}
              <span className="min-w-0">
                <span className={`block text-sm font-semibold ${s.done ? "text-ink-muted line-through" : "text-ink"}`}>
                  {i + 1}. {s.title}
                </span>
                {!s.done && <span className="mt-0.5 block text-xs text-ink-muted">{s.detail}</span>}
                {isNext && (
                  <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-brand-700 dark:text-brand-300">
                    Hacerlo ahora <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                )}
              </span>
            </>
          );
          const cls = `flex h-full gap-3 border-line-soft px-5 py-4 transition sm:border-r ${
            isNext ? "bg-accent-500/5" : ""
          } ${s.done ? "" : "hover:bg-surface-2"}`;
          return (
            <li key={s.code} className="border-b border-line-soft lg:border-b-0">
              {s.done ? (
                <div className={cls}>{content}</div>
              ) : s.code === "venta" ? (
                <button
                  type="button"
                  className={`${cls} w-full text-left`}
                  onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "n" }))}
                >
                  {content}
                </button>
              ) : (
                <Link href={s.href} className={cls}>
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
