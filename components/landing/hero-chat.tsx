"use client";

import { useRef } from "react";
import { Cake, Check, CheckCheck } from "lucide-react";
import { gsap, useGSAP } from "./gsap-setup";

/**
 * Chat animado del hero: cuenta la historia completa del producto en diez
 * segundos. Vuelvo avisa que cumple María, el mensaje sale escrito, ella lo
 * lee, contesta, y vuelve a comprar.
 *
 * Es una línea de tiempo que se repite. Con prefers-reduced-motion no se crea
 * y queda el chat completo, quieto — que es su estado en el marcado.
 *
 * Los colores del chat son los de WhatsApp a propósito (es lo que el dueño ve
 * en su teléfono), fijos en los dos temas porque el hero es oscuro siempre.
 */
export function HeroChat() {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(scope);
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.5, delay: 1 });

        // Estado inicial de cada vuelta.
        tl.set(q("[data-step]"), { autoAlpha: 0, y: 14, scale: 0.96 })
          .set(q("[data-typing]"), { display: "none" })
          .set(q("[data-read]"), { autoAlpha: 0 })
          .set(q("[data-sent]"), { autoAlpha: 1 })

          .to(q('[data-step="alert"]'), { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.6)" })
          .set(q('[data-typing="out"]'), { display: "flex" }, "+=0.5")
          .set(q('[data-typing="out"]'), { display: "none" }, "+=1.1")
          .to(q('[data-step="out"]'), { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "power3.out" }, "<")
          .to(q("[data-sent]"), { autoAlpha: 0, duration: 0.2 }, "+=0.9")
          .to(q("[data-read]"), { autoAlpha: 1, duration: 0.2 }, "<")
          .set(q('[data-typing="in"]'), { display: "flex" }, "+=0.4")
          .set(q('[data-typing="in"]'), { display: "none" }, "+=1.2")
          .to(q('[data-step="in"]'), { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "power3.out" }, "<")
          .to(q('[data-step="sale"]'), { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(1.6)" }, "+=0.8")
          .to(q("[data-step]"), { autoAlpha: 0, duration: 0.5 }, "+=3");
      });
      return () => mm.revert();
    },
    { scope }
  );

  return (
    <div ref={scope} className="relative">
      {/* Aviso de Vuelvo arriba del chat: el disparador de toda la historia. */}
      <div
        data-step="alert"
        className="absolute -left-3 -top-14 z-10 flex items-center gap-2.5 rounded-2xl bg-white px-3 py-2 shadow-pop ring-1 ring-black/5 sm:-left-8"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-500/20 text-accent-700">
          <Cake aria-hidden="true" className="h-4 w-4" />
        </span>
        <span className="leading-tight">
          <span className="block text-xs font-bold text-brand-950">María cumple el viernes</span>
          <span className="block text-[11px] text-brand-900/60">Mensaje listo para enviar</span>
        </span>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] bg-[#0b141a] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] ring-1 ring-white/10">
        <div className="flex items-center gap-3 bg-[#202c33] px-4 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-500 font-display text-sm font-bold text-white">
            MG
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-[#e9edef]">María González</p>
            <p className="text-[11px] text-[#8696a0]">en línea</p>
          </div>
        </div>

        <div className="relative min-h-[15.5rem] space-y-2.5 bg-[#0b141a] p-4">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(#fff_1px,transparent_1.2px)] [background-size:18px_18px]"
          />

          <Typing kind="out" />
          <div
            data-step="out"
            className="relative ml-auto max-w-[88%] rounded-2xl rounded-tr-md bg-[#005c4b] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#e9edef]"
          >
            ¡Hola María! Se viene tu cumple: esta semana tenés 15% off en Perfumería Bella. ¡Te esperamos!
            <span className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[#8696a0]">
              10:24
              <span className="relative inline-block h-3.5 w-3.5">
                <Check data-sent aria-hidden="true" className="absolute inset-0 h-3.5 w-3.5 text-[#8696a0] opacity-0" />
                <CheckCheck data-read aria-hidden="true" className="absolute inset-0 h-3.5 w-3.5 text-[#53bdeb]" />
              </span>
            </span>
          </div>

          <Typing kind="in" />
          <div
            data-step="in"
            className="relative max-w-[70%] rounded-2xl rounded-tl-md bg-[#202c33] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#e9edef]"
          >
            ¡Qué lindo! Paso el jueves a la tarde.
          </div>
        </div>
      </div>

      {/* El cierre: la venta que vino después del mensaje. */}
      <div
        data-step="sale"
        className="absolute -bottom-6 -right-3 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-pop ring-1 ring-black/5 sm:-right-8"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-500 text-brand-950">
          <Check aria-hidden="true" className="h-5 w-5" strokeWidth={3} />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-bold text-brand-950">María volvió</span>
          <span className="block text-xs text-brand-900/60">Compró $ 18.500 el jueves</span>
        </span>
      </div>
    </div>
  );
}

function Typing({ kind }: { kind: "in" | "out" }) {
  return (
    <div
      data-typing={kind}
      aria-hidden="true"
      className={`hidden w-fit gap-1 rounded-2xl px-3.5 py-3 ${
        kind === "out" ? "ml-auto rounded-tr-md bg-[#005c4b]" : "rounded-tl-md bg-[#202c33]"
      }`}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8696a0]"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}
