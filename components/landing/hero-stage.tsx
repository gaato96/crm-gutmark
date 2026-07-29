"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "./gsap-setup";

/**
 * Orquesta la entrada del hero y el parallax de la tarjeta.
 *
 * Por qué existe este motion: la línea de tiempo escalona volanta → titular →
 * bajada → botones, que es exactamente el orden en que queremos que se lea.
 * El parallax hace que la tarjeta baje más lento que el video de fondo, que es
 * lo que la despega de él.
 *
 * Los hijos se marcan con `data-anim`; así el hero sigue siendo un Server
 * Component y este envoltorio client no tiene que conocer su contenido.
 */
export function HeroStage({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Todo el motion vive dentro de este matchMedia: con
      // prefers-reduced-motion activo nunca se crea, así que el hero queda
      // estático y visible sin necesidad de un camino alternativo.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from('[data-anim="hero-item"]', {
            y: 26,
            opacity: 0,
            duration: 0.85,
            stagger: 0.08,
          })
          .from(
            '[data-anim="hero-visual"]',
            { y: 44, opacity: 0, scale: 0.97, duration: 1.05 },
            "-=0.6"
          );

        gsap.to('[data-anim="hero-photo"]', {
          yPercent: 10,
          ease: "none",
          scrollTrigger: {
            trigger: scope.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      });

      return () => mm.revert();
    },
    { scope }
  );

  return <div ref={scope}>{children}</div>;
}
