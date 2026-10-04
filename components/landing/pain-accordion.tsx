"use client";

import { useState } from "react";
import Image from "next/image";

export interface PainSlice {
  title: string;
  detail: string;
  src: string;
  alt: string;
}

/**
 * Acordeón horizontal: cuatro franjas con foto que se abren al pasar el mouse
 * o al recibir foco. Cada dolor tiene su imagen y su texto, pero solo uno
 * ocupa la escena a la vez — se leen de a uno, como una conversación.
 *
 * En mobile no hay hover: las franjas pasan a ser tarjetas apiladas, todas con
 * su texto visible.
 *
 * El texto va siempre sobre un degradado negro propio (no sobre tokens de
 * tema), porque el fondo es una foto: el contraste se calcula contra el negro
 * del degradado y vale igual en modo claro y oscuro.
 */
export function PainAccordion({ items }: { items: PainSlice[] }) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-3 md:h-[30rem] md:flex-row">
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
            className={`group relative h-64 overflow-hidden rounded-[1.75rem] text-left ring-1 ring-line transition-[flex-grow] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 md:h-auto md:min-w-0 ${
              on ? "md:flex-[3.2]" : "md:flex-1"
            }`}
          >
            <Image
              src={it.src}
              alt={it.alt}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className={`object-cover transition-[transform,filter] duration-1000 ease-out ${
                on ? "scale-105 saturate-100" : "scale-100 saturate-[0.6] md:grayscale"
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
            <div className="absolute inset-0 bg-accent-900/25 mix-blend-multiply" />

            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
              <h3
                className={`font-display font-bold leading-snug text-white transition-all duration-500 ${
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
