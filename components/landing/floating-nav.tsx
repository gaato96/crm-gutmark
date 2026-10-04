"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogIn, Menu, MessageCircle, X } from "lucide-react";
import { Logo, LogoMark } from "@/components/logo";

const LINKS = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#por-rubro", label: "Por rubro" },
  { href: "#que-incluye", label: "Qué incluye" },
  { href: "#preguntas", label: "Preguntas" },
];

/**
 * Navegación en píldora flotante.
 *
 * Arriba de todo queda despegada y transparente, para que el hero respire. Al
 * hacer scroll se compacta y toma fondo de vidrio: sigue a mano sin tapar el
 * contenido. En mobile, "Ingresar" y "Pedir acceso" están siempre a la vista
 * — antes el login quedaba escondido y quien ya tenía cuenta no podía entrar
 * desde el celular — y los anclas van en una hoja aparte.
 */
export function FloatingNav({ ctaHref, ctaLabel }: { ctaHref: string; ctaLabel: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <div
        className={`pointer-events-auto mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-full border px-3 transition-[padding,background-color,box-shadow,border-color] duration-300 sm:px-4 ${
          scrolled
            ? "border-white/10 bg-[#0b0d16]/85 py-2 shadow-pop backdrop-blur-xl"
            : "border-white/10 bg-[#0b0d16]/45 py-2.5 backdrop-blur-md sm:py-3"
        }`}
      >
        {/* En pantallas chicas va solo la marca: con el nombre completo, el
            botón de menú se salía de la píldora a 375px. */}
        <Link href="/" className="shrink-0 rounded-full pl-1" aria-label="Vuelvo CRM, inicio">
          <span className="sm:hidden">
            <LogoMark size={32} />
          </span>
          <span className="hidden sm:block">
            <Logo size="sm" />
          </span>
        </Link>

        <nav aria-label="Secciones" className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/login"
            className="btn min-h-[44px] whitespace-nowrap rounded-full !px-3 text-sm font-semibold text-white/85 hover:bg-white/10 hover:text-white"
          >
            <LogIn aria-hidden="true" className="hidden h-4 w-4 min-[420px]:block" />
            <span className="sm:hidden">Ingresar</span>
            <span className="hidden sm:inline">Iniciar sesión</span>
          </Link>
          <a
            href={ctaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary min-h-[44px] whitespace-nowrap rounded-full !px-4 text-sm"
          >
            <MessageCircle aria-hidden="true" className="hidden h-4 w-4 sm:block" />
            {ctaLabel}
          </a>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-full text-white/80 transition hover:bg-white/10 lg:hidden"
            aria-label="Abrir menú"
            aria-expanded={open}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {open && (
        <div className="pointer-events-auto fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú">
          <button
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-3 top-3 rounded-3xl border border-line bg-surface p-4 shadow-pop animate-scale-in">
            <div className="flex items-center justify-between">
              <Logo size="sm" />
              <button
                onClick={() => setOpen(false)}
                className="grid h-11 w-11 place-items-center rounded-full text-ink-soft hover:bg-surface-2"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-3 grid gap-1" aria-label="Secciones">
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-2xl px-4 py-3.5 font-display text-lg font-semibold text-ink hover:bg-surface-2"
                >
                  {l.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
