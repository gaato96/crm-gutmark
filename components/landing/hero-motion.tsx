"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "./gsap-setup";

/**
 * Motion del hero. Envuelve marcado server y lo ubica con atributos data-*:
 *
 * - data-hero-word: el titular entra palabra por palabra, en el orden en que
 *   se lee. Las imágenes del titular entran con un pequeño giro.
 * - data-hero-fade: bajada y botones, después del titular.
 * - data-hero-frame: el marco de producto arranca chico e inclinado y se
 *   endereza a tamaño completo mientras sube; al irse, se oscurece. Es lo que
 *   convierte el panel de ejemplo en "la pantalla que vas a usar".
 * - data-depth: las tarjetas flotantes se mueven a distinta velocidad que el
 *   marco (parallax), así se despegan del video de fondo.
 *
 * Todo vive dentro de un matchMedia de movimiento: con reduced-motion no se
 * crea nada y el marcado queda en su estado final visible.
 */
export function HeroMotion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
        tl.from("[data-hero-word]", {
          yPercent: 110,
          opacity: 0,
          duration: 0.8,
          stagger: 0.035,
        })
          .from(
            "[data-hero-pill]",
            { scale: 0.4, rotate: -12, opacity: 0, duration: 0.7, stagger: 0.08, ease: "back.out(1.8)" },
            "-=0.6"
          )
          // Los botones no esperan a que termine todo: en menos de un
          // segundo y medio ya se puede hacer clic.
          .from("[data-hero-fade]", { y: 20, opacity: 0, duration: 0.6, stagger: 0.06 }, "-=0.75");

        const frame = scope.current?.querySelector("[data-hero-frame]");
        if (frame) {
          gsap.fromTo(
            frame,
            { scale: 0.86, rotateX: 14, y: 40, transformPerspective: 1400, transformOrigin: "50% 0%" },
            {
              scale: 1,
              rotateX: 0,
              y: 0,
              ease: "none",
              scrollTrigger: { trigger: frame, start: "top 95%", end: "top 25%", scrub: 0.6 },
            }
          );
          gsap.to(frame, {
            opacity: 0.35,
            ease: "none",
            scrollTrigger: { trigger: frame, start: "bottom 45%", end: "bottom top", scrub: true },
          });
        }

        gsap.utils.toArray<HTMLElement>("[data-depth]").forEach((el) => {
          const depth = Number(el.dataset.depth) || 1;
          // Rango centrado (de +40 a -40): si solo subiera, las tarjetas de
          // arriba terminaban cortadas por el borde del marco.
          gsap.fromTo(el, { y: 36 * depth }, {
            y: -36 * depth,
            ease: "none",
            scrollTrigger: { trigger: frame ?? el, start: "top bottom", end: "bottom top", scrub: true },
          });
        });
      });
      return () => mm.revert();
    },
    { scope }
  );

  return <div ref={scope}>{children}</div>;
}
