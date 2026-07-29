"use client";

import { useEffect, useRef } from "react";

/**
 * Video de fondo del hero.
 *
 * Es decorativo: va con `aria-hidden` y fuera del orden de tabulación, porque
 * no aporta nada que el texto del hero no diga ya. Todo el contraste del
 * titular lo dan las capas de scrim que están encima, nunca el video.
 *
 * Tres frenos deliberados, en vez de un autoplay a ciegas:
 *
 * 1. `prefers-reduced-motion`: no arranca. Queda el primer cuadro quieto.
 * 2. `saveData`: tampoco arranca. Son 1,5 MB que alguien con datos medidos no
 *    pidió, y el hero se entiende igual sin movimiento.
 * 3. Fuera de pantalla o pestaña oculta: se pausa. Un loop corriendo debajo del
 *    fold gasta batería y CPU sin que nadie lo mire.
 */
export function HeroVideo({
  src,
  className = "",
}: {
  src: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    const saveData = connection?.saveData === true;

    if (prefersReduced || saveData) {
      video.pause();
      // Adelantamos un pelín para que el navegador pinte un cuadro en vez de
      // dejar el hueco en negro.
      try {
        video.currentTime = 0.1;
      } catch {
        /* algunos navegadores no dejan buscar antes de tener metadata */
      }
      return;
    }

    // Arranca en `true` a propósito: el hero es lo primero de la página, así
    // que al montar está a la vista. Si empezara en `false` y el
    // IntersectionObserver no llegara a disparar, el primer cambio de pestaña
    // pausaría el video para siempre.
    let onScreen = true;

    const sync = () => {
      if (onScreen && !document.hidden) video.play().catch(() => {});
      else video.pause();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
      },
      { threshold: 0.05 }
    );
    observer.observe(video);

    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      tabIndex={-1}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
