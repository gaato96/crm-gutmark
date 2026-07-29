"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "./gsap-setup";

// Espacio duro. Un espacio normal al final de un inline-block lo colapsa el
// navegador y las palabras del párrafo terminan pegadas entre sí.
const NBSP = " ";

/**
 * Revela una frase palabra por palabra atada al scroll.
 *
 * Por qué este motion: la frase es el argumento central de la sección y el
 * scrub obliga a leerla al ritmo del scroll en vez de saltearla. Es el único
 * lugar de la página donde el scroll maneja la lectura.
 */
export function WordScrub({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const scope = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Con prefers-reduced-motion activo no se crea nada y el párrafo queda
      // legible al 100% de opacidad, que es su estado en el marcado.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const words = scope.current?.querySelectorAll("[data-word]");
        if (!words?.length) return;

        gsap.fromTo(
          words,
          { opacity: 0.16 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.4,
            scrollTrigger: {
              trigger: scope.current,
              start: "top 80%",
              end: "bottom 60%",
              scrub: 0.5,
            },
          }
        );
      });

      return () => mm.revert();
    },
    { scope }
  );

  return (
    <p ref={scope} className={className}>
      {text.split(" ").map((word, i) => (
        <span key={`${word}-${i}`} data-word className="inline-block">
          {word + NBSP}
        </span>
      ))}
    </p>
  );
}
