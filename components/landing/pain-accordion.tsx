"use client";

import { useState } from "react";
import { Cake, HelpCircle, Receipt, Search, Users, type LucideIcon } from "lucide-react";

export type PainVisual = "ticket" | "calendar" | "ranking" | "contacts";

export interface PainSlice {
  title: string;
  detail: string;
  visual: PainVisual;
}

const ICONS: Record<PainVisual, LucideIcon> = {
  ticket: Receipt,
  calendar: Cake,
  ranking: Users,
  contacts: Search,
};

/**
 * Acordeón horizontal de los dolores del negocio.
 *
 * Cada franja tiene su ilustración dibujada con la misma interfaz del
 * producto (un ticket suelto, un calendario con el cumpleaños pasado, un
 * ranking sin datos, una lista de contactos), no fotos de stock que no tenían
 * relación con el texto.
 *
 * Todas comparten la misma base oscura; la abierta se distingue por el brillo
 * violeta y el borde, no por un color de fondo distinto en cada una.
 *
 * En desktop se abre con el mouse o el foco y las cerradas muestran solo su
 * ícono; en mobile son tarjetas apiladas con todo visible.
 */
export function PainAccordion({ items }: { items: PainSlice[] }) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-3 md:h-[30rem] md:flex-row">
      {items.map((it, i) => {
        const on = i === active;
        const Icon = ICONS[it.visual];
        return (
          <button
            key={it.title}
            type="button"
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
            aria-expanded={on}
            className={`group relative flex min-h-[26rem] flex-col overflow-hidden rounded-[1.75rem] border bg-gradient-to-b from-[#14121f] to-[#0b0b12] text-left transition-[flex-grow,border-color] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 md:min-h-0 md:min-w-0 ${
              on ? "border-accent-500/40 md:flex-[2.6]" : "border-white/10 md:flex-1"
            }`}
          >
            <div aria-hidden="true" className="bg-grid-move pointer-events-none absolute inset-0 opacity-40" />
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-accent-500/25 blur-3xl transition-opacity duration-700 ${
                on ? "opacity-100" : "opacity-30"
              }`}
            />

            {/* Ilustración: ocupa la parte de arriba de la franja abierta. */}
            <div
              aria-hidden="true"
              className={`relative flex flex-1 items-center justify-center p-6 pb-0 transition-opacity duration-500 ${
                on ? "opacity-100" : "md:opacity-0"
              }`}
            >
              <Visual kind={it.visual} />
            </div>

            {/* Franja cerrada (desktop): solo el ícono. */}
            <div
              aria-hidden="true"
              className={`absolute left-1/2 top-10 hidden -translate-x-1/2 transition-opacity duration-500 md:block ${
                on ? "opacity-0" : "opacity-100"
              }`}
            >
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.06] text-accent-300 ring-1 ring-inset ring-white/10">
                <Icon className="h-6 w-6" />
              </span>
            </div>

            <div className="relative p-6">
              <h3
                className={`font-display font-bold leading-snug text-white transition-[font-size] duration-500 ${
                  on ? "text-xl sm:text-2xl" : "text-lg md:line-clamp-5 md:text-sm"
                }`}
              >
                {it.title}
              </h3>
              <p
                className={`mt-2 max-w-md text-sm leading-relaxed text-white/70 transition-[opacity,max-height] duration-500 ${
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

// Las ilustraciones van grandes (casi el ancho de la franja abierta): en
// miniatura no se entendía qué mostraban.
function Visual({ kind }: { kind: PainVisual }) {
  const card = "rounded-2xl bg-white/[0.06] ring-1 ring-inset ring-white/10 shadow-pop backdrop-blur";

  if (kind === "ticket") {
    return (
      <div className="flex w-full max-w-xl items-center gap-5">
        <div className={`${card} w-full max-w-[17rem] shrink-0 p-6`}>
          <div className="flex items-center gap-2 text-sm font-semibold text-white/75">
            <Receipt className="h-5 w-5" /> Ticket #0231
          </div>
          <div className="mt-4 font-display text-4xl font-bold text-white">$ 18.500</div>
          <div className="mt-4 space-y-2">
            {["Perfume importado", "Crema facial"].map((n) => (
              <div key={n} className="flex justify-between text-sm text-white/60">
                <span>{n}</span>
                <span className="h-2 w-12 self-center rounded-full bg-white/15" />
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-white/10 pt-3 text-xs text-white/50">12 de marzo · Única compra</div>
        </div>
        <div className="hidden flex-1 border-t-2 border-dashed border-white/20 sm:block" />
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-accent-500/15 text-accent-300 ring-1 ring-accent-400/30">
          <HelpCircle className="h-10 w-10" />
        </div>
      </div>
    );
  }

  if (kind === "calendar") {
    const missed = 12;
    return (
      <div className={`${card} w-full max-w-sm p-6`}>
        <div className="mb-3 flex items-center justify-between text-sm font-semibold text-white/80">
          <span>Marzo</span>
          <Cake className="h-4 w-4 text-brand-400" />
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 28 }).map((_, d) => (
            <span
              key={d}
              className={`grid aspect-square place-items-center rounded-lg text-xs font-semibold ${
                d + 1 === missed
                  ? "bg-brand-500 text-brand-950 ring-2 ring-brand-300/60"
                  : d + 1 < 16
                  ? "bg-white/[0.04] text-white/25 line-through"
                  : "bg-white/[0.08] text-white/65"
              }`}
            >
              {d + 1}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs font-medium text-white/60">El cumple de Laura fue hace 4 días. Nadie la saludó.</p>
      </div>
    );
  }

  if (kind === "ranking") {
    return (
      <div className={`${card} w-full max-w-sm space-y-3.5 p-6`}>
        <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
          <Users className="h-4 w-4" /> Mis mejores clientes
        </div>
        {[0, 1, 2, 3, 4].map((r) => (
          <div key={r} className="flex items-center gap-3">
            <span className="w-4 text-xs font-bold text-white/30">{r + 1}</span>
            <span className="h-8 w-8 shrink-0 rounded-full bg-white/10" />
            <span className="h-2.5 flex-1 rounded-full bg-white/10" />
            <span className="font-display text-lg font-bold text-accent-300/70">?</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`${card} w-full max-w-sm p-6`}>
      <div className="flex items-center gap-2 rounded-xl bg-white/[0.08] px-3 py-2.5 text-sm text-white/55">
        <Search className="h-4 w-4" /> Buscar entre 312 contactos
      </div>
      <div className="mt-3 space-y-2.5">
        {["Ana", "Bruno", "Carla", "Diego", "Elena", "Franco"].map((n) => (
          <div key={n} className="flex items-center gap-3">
            <span className="h-8 w-8 shrink-0 rounded-full bg-white/10" />
            <span className="text-sm text-white/65">{n}</span>
            <span className="ml-auto h-2 w-12 rounded-full bg-white/[0.08]" />
          </div>
        ))}
      </div>
    </div>
  );
}
