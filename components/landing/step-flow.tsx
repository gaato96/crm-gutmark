"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "./gsap-setup";

/**
 * Columna de pasos con línea de progreso que se dibuja con el scroll.
 *
 * Por qué este motion: los cuatro pasos son una secuencia, no una lista suelta.
 * La línea que avanza muestra en qué punto del recorrido está el lector, y cada
 * paso entra al llegar para que se lean de a uno.
 *
 * El título de la sección se mantiene fijo con `position: sticky` de CSS, sin
 * pinning de ScrollTrigger: no hace falta JavaScript para eso y evita los
 * saltos de layout que trae el pin cuando cambia el alto del contenido.
 */
export function StepFlow({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const steps = gsap.utils.toArray<HTMLElement>("[data-step]");

        steps.forEach((step) => {
          gsap.from(step, {
            y: 32,
            opacity: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: { trigger: step, start: "top 85%" },
          });
        });

        if (rail.current) {
          gsap.fromTo(
            rail.current,
            { scaleY: 0 },
            {
              scaleY: 1,
              ease: "none",
              transformOrigin: "top center",
              scrollTrigger: {
                trigger: scope.current,
                start: "top 65%",
                end: "bottom 80%",
                scrub: 0.4,
              },
            }
          );
        }
      });

      return () => mm.revert();
    },
    { scope }
  );

  return (
    <div ref={scope} className="relative">
      {/* Riel de fondo y línea que avanza. Decorativos, fuera del árbol de
          accesibilidad: el orden de los pasos ya lo da el marcado. */}
      <span
        aria-hidden="true"
        className="absolute left-[19px] top-2 hidden h-[calc(100%-1rem)] w-px bg-line sm:block"
      />
      <span
        ref={rail}
        aria-hidden="true"
        className="absolute left-[19px] top-2 hidden h-[calc(100%-1rem)] w-px origin-top bg-brand-500 sm:block"
      />
      <ol className="space-y-9 sm:space-y-11">{children}</ol>
    </div>
  );
}
