import { Sparkles, Star } from "lucide-react";

const STAMPS = 10;
const FILLED = 7;

/**
 * Ilustración de marca del hero: la tarjeta de fidelidad de toda la vida, la
 * que el negocio hoy sella a mano. No pretende ser una captura del panel.
 *
 * Los avisos flotantes (cumpleaños, mensaje listo) ya no viven acá: se
 * posicionaban contra la tarjeta y terminaban tapando la foto del hero. Ahora
 * los coloca el hero, que es el único que sabe dónde hay lugar libre.
 *
 * Los datos son de la cuenta demo (Perfumería Bella) y no afirman resultados:
 * muestran qué hace el producto, no cuánto rinde.
 */
export function LoyaltyCard() {
  return (
    <div className="grain relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-5 shadow-pop ring-1 ring-white/10">
      <div className="pointer-events-none absolute -right-8 -top-12 h-36 w-36 rounded-full bg-gold-400/20 blur-3xl" />

      <div className="relative flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-white/15">
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-display text-base text-white">GUTMARK</span>
        </div>
        <span className="truncate rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-brand-100">
          Perfumería Bella
        </span>
      </div>

      <p className="relative mt-4 text-[11px] font-medium text-brand-200">
        Tarjeta de Valentina López
      </p>

      <div className="relative mt-2.5 grid grid-cols-5 gap-2">
        {Array.from({ length: STAMPS }).map((_, i) => {
          const filled = i < FILLED;
          const isNext = i === FILLED;
          return (
            <div
              key={i}
              className={`grid aspect-square place-items-center rounded-full border ${
                filled
                  ? "border-gold-400/40 bg-gold-400/90 shadow-[0_0_12px_-2px_rgba(251,191,36,0.6)]"
                  : isNext
                  ? "border-dashed border-white/50 bg-white/5"
                  : "border-white/15 bg-white/5"
              }`}
            >
              {filled && (
                <Star
                  aria-hidden="true"
                  className="h-3 w-3 fill-brand-900 text-brand-900"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="relative mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3.5">
        <div className="min-w-0">
          <div className="text-xs font-bold tabular-nums text-white">
            {FILLED} de {STAMPS} compras
          </div>
          <div className="truncate text-[11px] text-brand-200">
            Próximo premio: 15% OFF
          </div>
        </div>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-xs font-bold tabular-nums text-brand-700">
          {Math.round((FILLED / STAMPS) * 100)}%
        </div>
      </div>
    </div>
  );
}
