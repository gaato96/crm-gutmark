"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "./gsap-setup";

/**
 * Botón que se acerca levemente al cursor.
 *
 * Por qué este motion: es feedback, no decoración. El CTA principal se vuelve
 * el único elemento de la página que responde antes del clic, y eso lo separa
 * del resto de los enlaces.
 *
 * Usa `gsap.quickTo`, que escribe la transform directo en el DOM. Nada de
 * estado de React: el puntero dispara decenas de eventos por segundo y un
 * `useState` re-renderizaría el árbol en cada uno.
 */
export function MagneticCta({
  href,
  className = "",
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();

      // Solo con puntero fino: en touch no hay hover y el efecto sobra.
      mm.add(
        "(prefers-reduced-motion: no-preference) and (pointer: fine)",
        () => {
          const toX = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" });
          const toY = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });

          const onMove = (e: PointerEvent) => {
            const r = el.getBoundingClientRect();
            toX((e.clientX - (r.left + r.width / 2)) * 0.22);
            toY((e.clientY - (r.top + r.height / 2)) * 0.32);
          };
          const onLeave = () => {
            toX(0);
            toY(0);
          };

          el.addEventListener("pointermove", onMove);
          el.addEventListener("pointerleave", onLeave);
          return () => {
            el.removeEventListener("pointermove", onMove);
            el.removeEventListener("pointerleave", onLeave);
          };
        }
      );

      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <a
      ref={ref}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}
