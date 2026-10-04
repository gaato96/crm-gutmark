"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "./gsap-setup";

/**
 * Tarjetas que se apilan con el scroll.
 *
 * Cada tarjeta es `sticky` (CSS, sin pin de ScrollTrigger: no hay saltos de
 * layout) y queda un poco más abajo que la anterior. GSAP solo se ocupa de
 * que la de atrás retroceda — se achica y se apaga — cuando llega la
 * siguiente. Los cuatro pasos se leen como una secuencia que se va armando,
 * no como una lista.
 *
 * Los hijos se marcan con `data-stack-card`; el contenido lo arma el Server
 * Component padre.
 */
export function StackCards({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-stack-card]");
        cards.forEach((card, i) => {
          const next = cards[i + 1];
          if (!next) return;
          const inner = card.querySelector("[data-stack-inner]") ?? card;
          // fromTo con el filtro de partida explícito: desde "none" GSAP
          // interpolaba como si fuera brightness(0) y las tarjetas arrancaban
          // casi negras.
          gsap.fromTo(inner, { scale: 1, filter: "brightness(1) blur(0px)" }, {
            scale: 0.9 + i * 0.02,
            // Oscurecer y no bajar la opacidad: con opacidad, el texto de la
            // tarjeta de atrás se transparentaba a través de la de adelante.
            filter: "brightness(0.72) blur(1px)",
            ease: "none",
            scrollTrigger: { trigger: next, start: "top 85%", end: "top 20%", scrub: true },
          });
        });
      });
      return () => mm.revert();
    },
    { scope }
  );

  return (
    <div ref={scope} className="relative">
      {children}
    </div>
  );
}
