"use client";

import { useEffect, useRef } from "react";

/**
 * Fondo animado de toda la landing: una red de puntos que flotan despacio y se
 * conectan con líneas finas cuando se acercan — clientes que se vinculan con
 * el negocio. Va fijo detrás de todas las secciones, así el fondo se mueve en
 * cada pantalla y no solo en el hero.
 *
 * Canvas 2D y no DOM: son decenas de partículas por cuadro, y con elementos
 * HTML el navegador recalcularía estilos en cada frame. Se pausa con la
 * pestaña oculta, se adapta al tamaño de la ventana y con reduced-motion se
 * dibuja una sola vez, quieto.
 */
export function AmbientCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // Violeta y verde de marca, apagados: es fondo, no protagonista.
    const COLORS = ["151, 122, 238", "0, 190, 134", "178, 156, 243"];
    const LINK = 170;

    type P = { x: number; y: number; vx: number; vy: number; r: number; c: string };
    let w = 0;
    let h = 0;
    let points: P[] = [];
    let raf = 0;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Densidad proporcional al área: un celular no necesita 90 puntos.
      const count = Math.round(Math.min(90, Math.max(28, (w * h) / 16000)));
      points = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.8 + 0.8,
        c: COLORS[Math.floor(Math.random() * COLORS.length)],
      }));
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      for (let i = 0; i < points.length; i++) {
        const a = points[i];
        for (let j = i + 1; j < points.length; j++) {
          const b = points[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) {
            ctx!.strokeStyle = `rgba(${a.c}, ${0.32 * (1 - d / LINK)})`;
            ctx!.lineWidth = 0.7;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
        ctx!.fillStyle = `rgba(${a.c}, 0.8)`;
        ctx!.beginPath();
        ctx!.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function step() {
      for (const p of points) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;
      }
      draw();
      raf = requestAnimationFrame(step);
    }

    function start() {
      cancelAnimationFrame(raf);
      if (!reduced && !document.hidden) raf = requestAnimationFrame(step);
    }

    resize();
    draw();
    start();

    const onResize = () => {
      resize();
      draw();
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", start);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", start);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
