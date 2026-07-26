import { Sparkles, Star, Cake, TrendingUp } from "lucide-react";

const STAMPS = 10;
const FILLED = 7;

export function LoyaltyCard() {
  return (
    <div className="relative mx-auto w-full max-w-sm sm:max-w-md">
      {/* Badge flotante: recordatorio de cumpleaños */}
      <div className="absolute -left-4 -top-5 z-20 flex items-center gap-2 rounded-2xl bg-surface px-3.5 py-2.5 shadow-pop ring-1 ring-line animate-fade-in sm:-left-8">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold-500/15 text-gold-600 dark:text-gold-400">
          <Cake className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <div className="text-xs font-bold text-ink">Cumple hoy 🎉</div>
          <div className="text-[11px] text-ink-muted">María González</div>
        </div>
      </div>

      {/* Badge flotante: ticket promedio en alza */}
      <div className="absolute -bottom-4 -right-3 z-20 flex items-center gap-2 rounded-2xl bg-surface px-3.5 py-2.5 shadow-pop ring-1 ring-line animate-fade-in sm:-right-6">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-400">
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <div className="text-xs font-bold text-ink">+18% recompra</div>
          <div className="text-[11px] text-ink-muted">este mes</div>
        </div>
      </div>

      {/* La tarjeta */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-6 shadow-pop sm:p-7">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1.5px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-gold-400/20 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/15">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-lg text-white">GUTMARK</span>
          </div>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-brand-100">
            Perfumería Bella
          </span>
        </div>

        <p className="relative mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-brand-200">
          Tarjeta de fidelidad · Valentina López
        </p>

        <div className="relative mt-3 grid grid-cols-5 gap-2.5 sm:gap-3">
          {Array.from({ length: STAMPS }).map((_, i) => {
            const filled = i < FILLED;
            const isNext = i === FILLED;
            return (
              <div
                key={i}
                className={`grid aspect-square place-items-center rounded-full border transition-colors ${
                  filled
                    ? "border-gold-400/40 bg-gold-400/90 shadow-[0_0_16px_-2px_rgba(251,191,36,0.6)]"
                    : isNext
                    ? "border-dashed border-white/50 bg-white/5"
                    : "border-white/15 bg-white/5"
                }`}
              >
                {filled && <Star className="h-4 w-4 fill-brand-900 text-brand-900" />}
              </div>
            );
          })}
        </div>

        <div className="relative mt-5 flex items-center justify-between border-t border-white/10 pt-4">
          <div>
            <div className="text-sm font-bold tabular-nums text-white">{FILLED}/{STAMPS} compras</div>
            <div className="text-xs text-brand-200">Próximo premio: 15% OFF</div>
          </div>
          <div className="grid h-11 w-11 place-items-center rounded-full bg-white text-sm font-bold tabular-nums text-brand-700">
            {Math.round((FILLED / STAMPS) * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
}
