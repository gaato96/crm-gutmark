"use client";

import { useState } from "react";
import { Cake, HelpCircle, Receipt, Search, Users } from "lucide-react";

export type PainVisual = "ticket" | "calendar" | "ranking" | "contacts";

export interface PainSlice {
  title: string;
  detail: string;
  visual: PainVisual;
}

// Fondos de marca de cada franja: violetas y verdes oscuros, siempre con texto
// blanco encima. Fijos (no siguen el tema) porque son ilustraciones.
const TONES = [
  "from-accent-700 to-accent-900",
  "from-brand-800 to-brand-950",
  "from-accent-600 to-accent-800",
  "from-[#0d3b2e] to-brand-900",
];

/**
 * Acordeón horizontal de los dolores del negocio.
 *
 * Antes cada franja tenía una foto de stock que no tenía nada que ver con el
 * texto (un frasco de vidrio para "se te pasó un cumpleaños"). Ahora cada una
 * tiene su ilustración dibujada con la misma interfaz del producto: un ticket
 * suelto, un calendario con el cumpleaños pasado, un ranking sin datos, una
 * lista de contactos sin saber por dónde empezar.
 *
 * En desktop se abre la franja con el mouse o el foco; en mobile son tarjetas
 * apiladas con todo visible.
 */
export function PainAccordion({ items }: { items: PainSlice[] }) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-3 md:h-[26rem] md:flex-row">
      {items.map((it, i) => {
        const on = i === active;
        return (
          <button
            key={it.title}
            type="button"
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
            aria-expanded={on}
            className={`group relative min-h-[17rem] overflow-hidden rounded-[1.75rem] bg-gradient-to-br text-left ring-1 ring-white/10 transition-[flex-grow] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 md:min-h-0 md:min-w-0 ${
              TONES[i % TONES.length]
            } ${on ? "md:flex-[3]" : "md:flex-1"}`}
          >
            <div aria-hidden="true" className="bg-grid-move pointer-events-none absolute inset-0 opacity-60" />
            <div
              aria-hidden="true"
              className="animate-drift-a pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-400/20 blur-3xl"
            />

            {/* Ilustración: arriba, se achica en las franjas cerradas. */}
            <div
              aria-hidden="true"
              className={`absolute inset-x-5 top-5 transition-[opacity,transform] duration-700 sm:inset-x-6 sm:top-6 ${
                on ? "scale-100 opacity-100" : "opacity-100 md:origin-top-left md:scale-[0.8] md:opacity-40"
              }`}
            >
              <Visual kind={it.visual} on={on} />
            </div>

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/40 to-transparent p-5 pt-10 sm:p-6">
              <h3
                className={`font-display font-bold leading-snug text-white transition-[font-size] duration-500 ${
                  on ? "text-xl sm:text-2xl" : "text-lg md:text-base"
                }`}
              >
                {it.title}
              </h3>
              <p
                className={`mt-2 max-w-md text-sm leading-relaxed text-white/80 transition-[opacity,max-height] duration-500 ${
                  on ? "max-h-40 opacity-100" : "max-h-40 opacity-100 md:max-h-0 md:opacity-0"
                }`}
              >
                {it.detail}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function Visual({ kind, on }: { kind: PainVisual; on: boolean }) {
  const card = "rounded-2xl bg-white/10 ring-1 ring-inset ring-white/15 backdrop-blur";

  if (kind === "ticket") {
    return (
      <div className="flex max-w-xs items-center gap-3">
        <div className={`${card} w-40 shrink-0 p-3`}>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-white/80">
            <Receipt className="h-3.5 w-3.5" /> Ticket #0231
          </div>
          <div className="mt-2 font-display text-lg font-bold text-white">$ 18.500</div>
          <div className="mt-1 h-1.5 w-20 rounded-full bg-white/20" />
          <div className="mt-1.5 h-1.5 w-14 rounded-full bg-white/15" />
        </div>
        <div className={`hidden flex-1 border-t-2 border-dashed border-white/25 sm:block ${on ? "" : "md:hidden"}`} />
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/10 text-white/70 ring-1 ring-white/20 ${on ? "" : "md:hidden"}`}>
          <HelpCircle className="h-6 w-6" />
        </div>
      </div>
    );
  }

  if (kind === "calendar") {
    const missed = 12;
    return (
      <div className={`${card} w-52 p-3`}>
        <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-white/80">
          <span>Marzo</span>
          <Cake className="h-3.5 w-3.5 text-brand-300" />
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 21 }).map((_, d) => (
            <span
              key={d}
              className={`grid aspect-square place-items-center rounded-md text-[9px] font-semibold ${
                d + 1 === missed
                  ? "bg-brand-400 text-brand-950 ring-2 ring-brand-200"
                  : d + 1 < 16
                  ? "bg-white/5 text-white/30 line-through"
                  : "bg-white/10 text-white/70"
              }`}
            >
              {d + 1}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[10px] font-medium text-white/70">El cumple de Laura fue hace 4 días</p>
      </div>
    );
  }

  if (kind === "ranking") {
    return (
      <div className={`${card} w-56 space-y-2 p-3`}>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-white/80">
          <Users className="h-3.5 w-3.5" /> Mis mejores clientes
        </div>
        {[0, 1, 2, 3].map((r) => (
          <div key={r} className="flex items-center gap-2">
            <span className="h-6 w-6 shrink-0 rounded-full bg-white/15" />
            <span className="h-2 flex-1 rounded-full bg-white/15" />
            <span className="font-display text-sm font-bold text-white/50">?</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`${card} w-56 p-3`}>
      <div className="flex items-center gap-2 rounded-xl bg-white/10 px-2.5 py-1.5 text-[11px] text-white/60">
        <Search className="h-3.5 w-3.5" /> Buscar entre 312 contactos
      </div>
      <div className="mt-2 space-y-1.5">
        {["Ana", "Bruno", "Carla", "Diego", "Eli"].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <span className="h-5 w-5 shrink-0 rounded-full bg-white/15" />
            <span className="text-[11px] text-white/60">{n}</span>
            <span className="ml-auto h-1.5 w-10 rounded-full bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
