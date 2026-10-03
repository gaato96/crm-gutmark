"use client";

import { useId, useState } from "react";

// La cuenta que ningún negocio chico hace: cuánta plata se va con los clientes
// que compran una vez y no vuelven. Con tres números que el dueño sabe de
// memoria, el problema deja de ser abstracto.
//
// Los supuestos están a la vista a propósito (un cliente perdido = las compras
// que te hubiera hecho en un año). Un número inflado en una landing se nota y
// hace dudar del resto.

const money = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(
    Math.max(0, Math.round(n))
  );

export function LossCalculator() {
  const [clientes, setClientes] = useState(60);
  const [ticket, setTicket] = useState(12000);
  const [noVuelven, setNoVuelven] = useState(30);
  const [vecesAlAnio, setVecesAlAnio] = useState(4);

  // Clientes nuevos por mes que no vuelven nunca, y lo que hubieran gastado
  // en un año si volvían al ritmo de un cliente habitual.
  const perdidosPorMes = (clientes * noVuelven) / 100;
  const perdidaAnual = perdidosPorMes * 12 * ticket * vecesAlAnio;
  // Recuperar apenas uno de cada cinco.
  const recuperable = perdidaAnual * 0.2;

  return (
    <div className="card grid overflow-hidden lg:grid-cols-[1fr_0.9fr]">
      <div className="space-y-6 p-6 sm:p-8">
        <Slider
          label="Clientes nuevos por mes"
          value={clientes}
          min={10}
          max={600}
          step={10}
          onChange={setClientes}
          format={(v) => `${v}`}
        />
        <Slider
          label="Ticket promedio"
          value={ticket}
          min={2000}
          max={150000}
          step={1000}
          onChange={setTicket}
          format={money}
        />
        <Slider
          label="De cada 100, cuántos no vuelven nunca"
          value={noVuelven}
          min={5}
          max={80}
          step={5}
          onChange={setNoVuelven}
          format={(v) => `${v}%`}
        />
        <Slider
          label="Veces por año que vuelve un cliente fiel"
          value={vecesAlAnio}
          min={1}
          max={24}
          step={1}
          onChange={setVecesAlAnio}
          format={(v) => `${v} ${v === 1 ? "vez" : "veces"}`}
        />
      </div>

      <div className="grain relative flex flex-col justify-center overflow-hidden bg-gradient-to-br from-accent-700 to-accent-900 p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-rose-400/15 blur-3xl" />
        <div className="relative" aria-live="polite">
          <p className="text-sm font-semibold text-accent-100">Lo que se te va por año</p>
          <p className="mt-2 font-display text-4xl font-bold tabular-nums sm:text-5xl">{money(perdidaAnual)}</p>
          <p className="mt-3 text-sm leading-relaxed text-accent-100">
            {Math.round(perdidosPorMes)} clientes por mes compran una vez y no vuelven. Cada uno
            te hubiera comprado unas {vecesAlAnio} veces más en el año.
          </p>
          <div className="mt-6 rounded-2xl bg-white/10 p-4 ring-1 ring-inset ring-white/15">
            <p className="text-sm text-accent-100">Si recuperás solo 1 de cada 5</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-brand-300">
              +{money(recuperable)} al año
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink-soft">
          {label}
        </label>
        <span className="font-display text-base font-bold tabular-nums text-ink">{format(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range-brand w-full"
        style={{ "--pct": `${pct}%` } as React.CSSProperties}
      />
    </div>
  );
}
