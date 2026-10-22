"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { markTourDone } from "@/app/tour-actions";
import { buildTours, type TourContext, type TourId, type TourStep } from "@/lib/tours";

// Recorrido guiado: oscurece la pantalla, recorta un hueco sobre el elemento
// del paso y pone al lado una tarjeta con la explicación. Las definiciones
// viven en lib/tours.ts; acá solo está cómo se muestran.

interface TourApi {
  start: (id: TourId) => void;
}

const TourCtx = createContext<TourApi | null>(null);

export function useTour(): TourApi {
  const ctx = useContext(TourCtx);
  if (!ctx) throw new Error("useTour fuera de TourProvider");
  return ctx;
}

export function TourProvider({
  children,
  context,
  toursDone,
  autoStart,
}: {
  children: React.ReactNode;
  context: TourContext;
  toursDone: string[];
  // En false no arranca nada solo (superadmin viendo la cuenta de un negocio).
  autoStart: boolean;
}) {
  const pathname = usePathname();
  const { catalogMode, modules } = context;
  const modulesKey = modules.join(",");
  const tours = useMemo(
    () => buildTours({ catalogMode, modules: modulesKey.split(",") }),
    [catalogMode, modulesKey]
  );

  // El layout no se vuelve a renderizar al navegar entre pantallas, así que
  // `toursDone` llega una sola vez: lo que se completa en esta visita se
  // anota acá además de en la base.
  const [done, setDone] = useState(() => new Set(toursDone));
  const [active, setActive] = useState<{ id: TourId; step: number } | null>(null);
  // Ruta en la que ya se evaluó el arranque automático. Evita que al cerrar
  // el de bienvenida en /caja arranque encima el de la caja.
  const checkedPath = useRef<string | null>(null);

  const start = useCallback((id: TourId) => setActive({ id, step: 0 }), []);

  const finish = useCallback((id: TourId) => {
    setActive(null);
    setDone((prev) => new Set(prev).add(id));
    markTourDone(id).catch(() => {});
  }, []);

  useEffect(() => {
    if (!autoStart || active || checkedPath.current === pathname) return;

    const next: TourId | undefined = !done.has("bienvenida")
      ? "bienvenida"
      : Object.values(tours).find((t) => t.route === pathname && !done.has(t.id))?.id;
    if (!next) {
      checkedPath.current = pathname;
      return;
    }

    // Un respiro para que la pantalla termine de pintarse antes de medir. La
    // ruta se marca recién al arrancar: si el efecto se limpia antes (React lo
    // monta dos veces en desarrollo), la próxima corrida lo vuelve a intentar.
    const timer = window.setTimeout(() => {
      checkedPath.current = pathname;
      start(next);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [autoStart, active, pathname, done, tours, start]);

  const api = useMemo(() => ({ start }), [start]);
  const tour = active ? tours[active.id] : null;

  return (
    <TourCtx.Provider value={api}>
      {children}
      {tour && active && (
        <TourOverlay
          key={tour.id}
          steps={tour.steps}
          index={active.step}
          onStep={(step) => setActive({ id: tour.id, step })}
          onClose={() => finish(tour.id)}
        />
      )}
    </TourCtx.Provider>
  );
}

// Botón para volver a hacer un recorrido (Guía, encabezado de Caja).
export function StartTourButton({
  tour,
  className,
  children,
}: {
  tour: TourId;
  className?: string;
  children: React.ReactNode;
}) {
  const { start } = useTour();
  return (
    <button type="button" onClick={() => start(tour)} className={className}>
      {children}
    </button>
  );
}

// --- Superposición ----------------------------------------------------------

const PAD = 6; // aire alrededor del elemento resaltado
const GAP = 14; // distancia entre el resaltado y la tarjeta
const MARGIN = 12; // distancia mínima a los bordes de la pantalla

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

// Primer candidato que esté a la vista. El sidebar en el celular y la barra
// inferior en la compu existen en el DOM pero con display:none, y eso deja
// getClientRects() vacío.
function findTarget(target: TourStep["target"]): HTMLElement | null {
  if (!target) return null;
  const names = Array.isArray(target) ? target : [target];
  for (const name of names) {
    const els = document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`);
    for (const el of els) {
      if (el.getClientRects().length > 0 && el.offsetWidth > 0) return el;
    }
  }
  return null;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(v, max));
}

// Dónde va la tarjeta: al costado si entra (el sidebar), si no abajo, si no
// arriba. Si no entra en ningún lado (un bloque más alto que la pantalla), se
// apoya contra el borde opuesto al elemento.
function placeCard(hole: Box | null, w: number, h: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (!hole) return { left: (vw - w) / 2, top: Math.max(MARGIN, (vh - h) / 2) };

  const cx = hole.left + hole.width / 2;
  const cy = hole.top + hole.height / 2;
  const fitX = (x: number) => clamp(x, MARGIN, vw - w - MARGIN);
  const fitY = (y: number) => clamp(y, MARGIN, vh - h - MARGIN);

  if (hole.left + hole.width + GAP + w <= vw - MARGIN && hole.height < vh * 0.5) {
    return { left: hole.left + hole.width + GAP, top: fitY(cy - h / 2) };
  }
  if (hole.top + hole.height + GAP + h <= vh - MARGIN) {
    return { left: fitX(cx - w / 2), top: hole.top + hole.height + GAP };
  }
  if (hole.top - GAP - h >= MARGIN) {
    return { left: fitX(cx - w / 2), top: hole.top - GAP - h };
  }
  return { left: fitX(cx - w / 2), top: cy > vh / 2 ? MARGIN : vh - h - MARGIN };
}

function TourOverlay({
  steps,
  index,
  onStep,
  onClose,
}: {
  steps: TourStep[];
  index: number;
  onStep: (i: number) => void;
  onClose: () => void;
}) {
  const step = steps[index];
  const last = index === steps.length - 1;
  const [hole, setHole] = useState<Box | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  // En el celular las pantallas que no están en la barra inferior se señalan
  // con "Más": hay que decirlo, porque el resaltado solo no alcanza.
  const [viaMenu, setViaMenu] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const targetRef = useRef<HTMLElement | null>(null);

  // Al cerrar, el foco vuelve a donde estaba antes de abrir el recorrido. Va
  // antes del efecto de abajo, que mueve el foco al botón "Siguiente".
  useLayoutEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    return () => previous?.focus?.({ preventScroll: true });
  }, []);

  // Al cambiar de paso: buscar el elemento, traerlo a la vista y medirlo.
  useLayoutEffect(() => {
    const el = findTarget(step.target);
    targetRef.current = el;
    const names = Array.isArray(step.target) ? step.target : [];
    setViaMenu(el?.dataset.tour === "nav-mas" && names[0] !== "nav-mas");
    if (el) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // "nearest": solo se mueve si el elemento está fuera de la vista.
      el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduce ? "auto" : "smooth" });
    }
    measure();
    nextRef.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function measure() {
    const el = targetRef.current;
    const r = el?.getBoundingClientRect();
    const box = r
      ? { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 }
      : null;
    setHole(box);
    const card = cardRef.current;
    if (card) setPos(placeCard(box, card.offsetWidth, card.offsetHeight));
  }

  // El scroll suave y los cambios de tamaño mueven el elemento: se vuelve a
  // medir en el siguiente cuadro.
  useEffect(() => {
    let frame = 0;
    const onChange = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Teclado: Esc cierra, flechas avanzan y retroceden. Va en captura para
  // frenar el atajo "N" de Nueva venta mientras el recorrido está abierto.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (last) onClose();
        else onStep(index + 1);
      } else if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        onStep(index - 1);
      } else if (e.key.toLowerCase() === "n") {
        e.stopImmediatePropagation();
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [index, last, onClose, onStep]);


  return createPortal(
    <div className="fixed inset-0 z-[70]" role="presentation">
      {/* Captura los clics: durante el recorrido la pantalla de atrás no se
          toca. Con hueco, el oscurecido lo pone la sombra del recorte. */}
      <div className={`absolute inset-0 ${hole ? "" : "bg-slate-950/60"}`} aria-hidden="true" />
      {hole && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-2xl ring-2 ring-brand-500 motion-safe:transition-all motion-safe:duration-300"
          style={{
            ...hole,
            boxShadow: "0 0 0 9999px rgb(2 6 23 / 0.6)",
          }}
        />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        className="absolute w-[min(360px,calc(100vw-24px))] rounded-2xl bg-surface p-5 shadow-pop ring-1 ring-line motion-safe:transition-[top,left] motion-safe:duration-300"
        style={pos ?? { left: -9999, top: 0 }}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="font-display text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
            Paso {index + 1} de {steps.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-muted transition hover:bg-surface-2 hover:text-ink"
            aria-label="Cerrar recorrido"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 flex gap-1" aria-hidden="true">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= index ? "bg-brand-500" : "bg-surface-3"}`}
            />
          ))}
        </div>

        <h2 id="tour-title" className="font-display text-lg font-bold leading-snug text-ink">
          {step.title}
        </h2>
        <p id="tour-body" className="mt-2 text-sm leading-relaxed text-ink-soft">
          {step.body}
        </p>
        {viaMenu && (
          <p className="mt-2 text-sm font-semibold text-ink">Lo encontrás tocando “Más”.</p>
        )}

        {step.cta && (
          <Link href={step.cta.href} onClick={onClose} className="btn-accent mt-4 w-full">
            {step.cta.label}
          </Link>
        )}

        <div className="mt-5 flex items-center justify-between gap-2">
          {last ? (
            <span />
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1.5 text-sm font-semibold text-ink-muted transition hover:text-ink"
            >
              Saltar
            </button>
          )}
          <div className="flex gap-2">
            {index > 0 && (
              <button type="button" onClick={() => onStep(index - 1)} className="btn-secondary">
                Anterior
              </button>
            )}
            <button
              ref={nextRef}
              type="button"
              onClick={() => (last ? onClose() : onStep(index + 1))}
              className="btn-primary"
            >
              {last ? "Listo" : "Siguiente"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
