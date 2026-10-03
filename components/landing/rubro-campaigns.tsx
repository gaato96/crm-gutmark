"use client";

import { useState } from "react";
import { Clock, MessageCircle } from "lucide-react";

// Muestra, por rubro, las campañas con las que arranca una cuenta nueva. El
// contenido viene de lib/rubro-presets.ts (lo arma la landing, que es server):
// lo que se promete acá es exactamente lo que el negocio encuentra al entrar.

export interface RubroShowcase {
  rubro: string;
  label: string;
  businessName: string;
  campaigns: { name: string; when: string; message: string }[];
}

export function RubroCampaigns({ items }: { items: RubroShowcase[] }) {
  const [active, setActive] = useState(items[0]?.rubro ?? "");
  const current = items.find((i) => i.rubro === active) ?? items[0];
  if (!current) return null;

  return (
    <div>
      <div
        className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:px-0"
        role="tablist"
        aria-label="Elegí tu rubro"
      >
        {items.map((it) => {
          const on = it.rubro === current.rubro;
          return (
            <button
              key={it.rubro}
              role="tab"
              aria-selected={on}
              aria-controls="rubro-panel"
              onClick={() => setActive(it.rubro)}
              className={`min-h-[44px] shrink-0 rounded-full px-4 text-sm font-semibold transition ${
                on
                  ? "bg-accent-600 text-white shadow-sm shadow-accent-600/25"
                  : "bg-surface text-ink-soft ring-1 ring-inset ring-line hover:bg-surface-2"
              }`}
            >
              {it.label}
            </button>
          );
        })}
      </div>

      <div id="rubro-panel" role="tabpanel" className="mt-6 grid gap-4 md:grid-cols-3" key={current.rubro}>
        {current.campaigns.map((c) => (
          <article key={c.name} className="card flex flex-col p-5 animate-fade-in">
            <h3 className="font-display text-lg font-bold text-ink">{c.name}</h3>
            <p className="mt-1.5 flex items-start gap-1.5 text-sm text-ink-muted">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
              {c.when}
            </p>
            {/* Burbuja de WhatsApp: el mensaje real, con un nombre de ejemplo. */}
            <div className="mt-4 flex-1 rounded-2xl rounded-tl-md bg-[#e7ffdb] p-3.5 text-[13px] leading-relaxed text-[#111b21] shadow-sm dark:bg-[#005c4b] dark:text-[#e9edef]">
              {c.message}
            </div>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted">
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /> Sale con un toque, por WhatsApp
            </p>
          </article>
        ))}
      </div>
      <p className="mt-4 text-sm text-ink-muted">
        Ejemplo de <strong className="text-ink-soft">{current.businessName}</strong>. Cada texto se
        edita, y podés crear todas las campañas que quieras.
      </p>
    </div>
  );
}
