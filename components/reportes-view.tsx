"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  UserPlus,
  Repeat,
  Tags,
  Users,
  CreditCard,
  Minus,
} from "lucide-react";
import { formatMoney, formatDateShort, formatTime } from "@/lib/format";
import type { ReportComparison, ReportRow } from "@/lib/reports";
import { paymentLabel } from "@/lib/sales";
import type { PeriodKind, SaleDetail } from "@/lib/cash";
import { catalogWords } from "@/lib/rubros";
import { SaleRow, saleItemsLine } from "./sale-detail";

export function ReportesView({
  kind,
  periodLabel,
  anteriorLabel,
  data,
  comisiones,
  ventas,
  ventasLimite,
  catalogMode,
}: {
  kind: PeriodKind;
  periodLabel: string;
  anteriorLabel: string;
  data: ReportComparison;
  comisiones: { employeeId: string | null; name: string; amount: number; ventas: number }[];
  ventas: SaleDetail[];
  ventasLimite: number;
  catalogMode: string;
}) {
  const words = catalogWords(catalogMode);
  const a = data.actual;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl bg-surface-2 p-1">
          <PeriodTab href="/reportes?p=semana" on={kind === "semana"}>
            Semana
          </PeriodTab>
          <PeriodTab href="/reportes?p=mes" on={kind === "mes"}>
            Mes
          </PeriodTab>
        </div>
        <p className="text-sm text-ink-muted">
          <span className="font-semibold text-ink-soft">{periodLabel}</span> · comparado con{" "}
          {anteriorLabel.toLowerCase()}
        </p>
      </div>

      {a.ventas === 0 ? (
        <div className="card flex flex-col items-center px-6 py-16 text-center">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/10 text-brand-600">
            <Receipt className="h-7 w-7" />
          </div>
          <h3 className="font-display text-base font-bold text-ink">
            Todavía no hay ventas en este período
          </h3>
          <p className="mt-1 max-w-sm text-sm text-ink-muted">
            Registrá ventas y acá vas a ver la facturación, el ticket promedio y qué servicio
            te deja más.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi
              label="Facturación"
              value={formatMoney(a.facturacion)}
              delta={data.deltaFacturacion}
              icon={<Wallet className="h-5 w-5" />}
              hint={`${a.ventas} ${a.ventas === 1 ? "venta" : "ventas"}`}
            />
            <Kpi
              label="Costos"
              value={formatMoney(a.costos)}
              icon={<Minus className="h-5 w-5" />}
              hint="Comisiones e impuestos"
              tone="rose"
            />
            <Kpi
              label="Neto"
              value={formatMoney(a.neto)}
              delta={data.deltaNeto}
              icon={<TrendingUp className="h-5 w-5" />}
              hint="Lo que te queda"
              tone="brand"
            />
            <Kpi
              label="Ticket promedio"
              value={formatMoney(a.ticketPromedio)}
              delta={data.deltaTicket}
              icon={<Receipt className="h-5 w-5" />}
              hint={a.descuentos > 0 ? `${formatMoney(a.descuentos)} en descuentos` : undefined}
            />
          </div>

          {/* Nuevos vs recurrentes: el número que conecta la caja con fidelizar */}
          <div className="card p-5">
            <h2 className="mb-1 font-display font-bold text-ink">¿Quién te compró?</h2>
            <p className="mb-4 text-sm text-ink-muted">
              Si facturás bien pero siempre con gente nueva, estás vendiendo, no fidelizando.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <MiniStat
                icon={<UserPlus className="h-4 w-4" />}
                tone="accent"
                label="Clientes nuevos"
                value={a.clientesNuevos.toString()}
                hint="Compraron por primera vez"
              />
              <MiniStat
                icon={<Repeat className="h-4 w-4" />}
                tone="brand"
                label="Volvieron"
                value={a.clientesRecurrentes.toString()}
                hint={
                  a.clientes > 0
                    ? `${Math.round((a.clientesRecurrentes / a.clientes) * 100)}% de los que compraron`
                    : undefined
                }
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Breakdown
              title={words.reportBreakdown}
              icon={<Tags className="h-4 w-4" />}
              rows={a.porServicio}
              empty={`Las ventas de este período no tienen ${words.plural} cargados.`}
            />
            <Breakdown
              title="Por quién atendió"
              icon={<Users className="h-4 w-4" />}
              rows={a.porEmpleado}
              empty="Todavía no asignás las ventas a nadie."
            />
            <Breakdown
              title="Por método de pago"
              icon={<CreditCard className="h-4 w-4" />}
              rows={a.porMetodoPago.map((r) => ({ ...r, label: paymentLabel(r.label) }))}
              empty=""
            />
            <Breakdown
              title="Costos por concepto"
              icon={<Minus className="h-4 w-4" />}
              rows={a.costosPorConcepto}
              empty="Sin costos cargados en este período."
            />
          </div>

          {comisiones.length > 0 && (
            <div className="card p-5">
              <h2 className="mb-1 font-display font-bold text-ink">Comisiones a pagar</h2>
              <p className="mb-3 text-sm text-ink-muted">
                Lo que le corresponde a cada uno por las ventas del período.
              </p>
              <ul className="divide-y divide-line-soft">
                {comisiones.map((c) => (
                  <li
                    key={c.employeeId ?? c.name}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div>
                      <div className="text-sm font-semibold text-ink">{c.name}</div>
                      <div className="text-xs text-ink-muted">
                        {c.ventas} {c.ventas === 1 ? "venta" : "ventas"}
                      </div>
                    </div>
                    <span className="font-display font-bold text-accent-700 dark:text-accent-300">
                      {formatMoney(c.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <VentasDelPeriodo ventas={ventas} total={a.ventas} limite={ventasLimite} />

          <div className="grid gap-4 lg:grid-cols-2">
            <Bars title="Por día de la semana" rows={a.porDiaSemana} />
            <Bars title="Por hora" rows={a.porHora} />
          </div>
        </>
      )}
    </div>
  );
}

// --- Ventas del período -----------------------------------------------------
//
// Los cortes de arriba responden "cuánto entró"; esta lista responde "a quién y
// qué", que es lo que se mira cuando un número no cierra.

const PASO = 25;

// La línea chica de cada venta: cuándo fue, qué se llevó y cómo pagó. En Caja
// alcanza con la hora porque todo es del mismo turno; acá el período abarca
// varios días, así que va también la fecha.
function ventaMeta(v: SaleDetail): string {
  const items = saleItemsLine(v);
  return [`${formatDateShort(v.date)} ${formatTime(v.date)}`, items, paymentLabel(v.paymentMethod)]
    .filter(Boolean)
    .join(" · ");
}

function VentasDelPeriodo({
  ventas,
  total,
  limite,
}: {
  ventas: SaleDetail[];
  total: number;
  limite: number;
}) {
  const [visibles, setVisibles] = useState(PASO);
  if (ventas.length === 0) return null;

  const mostradas = ventas.slice(0, visibles);
  // El período puede tener más ventas de las que se traen; conviene decirlo en
  // vez de dejar creer que la lista está completa.
  const recortado = total > ventas.length;

  return (
    <div className="card p-5">
      <h2 className="mb-1 font-display font-bold text-ink">Ventas del período</h2>
      <p className="mb-3 text-sm text-ink-muted">
        {recortado
          ? `Las últimas ${limite} de ${total} ventas. Tocá una para ver el detalle.`
          : "Tocá una venta para ver el detalle."}
      </p>

      <ul className="divide-y divide-line-soft">
        {mostradas.map((v) => (
          <SaleRow key={v.purchaseId} venta={v} meta={ventaMeta(v)} />
        ))}
      </ul>

      {visibles < ventas.length && (
        <button
          type="button"
          onClick={() => setVisibles((n) => n + PASO)}
          className="btn-secondary mt-3 w-full"
        >
          Ver {Math.min(PASO, ventas.length - visibles)} más
        </button>
      )}
    </div>
  );
}

function PeriodTab({
  href,
  on,
  children,
}: {
  href: string;
  on: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
        on ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink-soft"
      }`}
    >
      {children}
    </Link>
  );
}

function Kpi({
  label,
  value,
  delta,
  icon,
  hint,
  tone = "slate",
}: {
  label: string;
  value: string;
  delta?: number | null;
  icon: React.ReactNode;
  hint?: string;
  tone?: "slate" | "brand" | "rose";
}) {
  const tones = {
    slate: "bg-surface-2 text-ink-muted",
    brand: "bg-brand-500/10 text-brand-600",
    rose: "bg-rose-500/10 text-rose-600",
  };

  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}>{icon}</span>
        {delta !== undefined && delta !== null && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-bold tabular-nums ${
              delta >= 0 ? "text-brand-700 dark:text-brand-300" : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {delta >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {delta >= 0 ? "+" : ""}
            {Math.round(delta)}%
          </span>
        )}
      </div>
      <div className="font-display text-xl font-bold text-ink">{value}</div>
      <div className="text-sm text-ink-muted">{label}</div>
      {hint && <div className="mt-0.5 text-xs text-ink-faint">{hint}</div>}
    </div>
  );
}

function MiniStat({
  icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  tone: "brand" | "accent";
  label: string;
  value: string;
  hint?: string;
}) {
  const tones = {
    brand: "bg-brand-500/10 text-brand-600",
    accent: "bg-accent-500/10 text-accent-600",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl bg-surface-2 p-3.5">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="font-display text-lg font-bold text-ink">{value}</div>
        <div className="text-sm text-ink-soft">{label}</div>
        {hint && <div className="text-xs text-ink-muted">{hint}</div>}
      </div>
    </div>
  );
}

function Breakdown({
  title,
  icon,
  rows,
  empty,
}: {
  title: string;
  icon: React.ReactNode;
  rows: ReportRow[];
  empty: string;
}) {
  const total = rows.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="card p-5">
      <h2 className="mb-3 flex items-center gap-2 font-display font-bold text-ink">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-surface-2 text-ink-muted">
          {icon}
        </span>
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-muted">
          {empty || "Sin datos."}
        </p>
      ) : (
        <ul className="space-y-2.5">
          {rows.slice(0, 8).map((r) => {
            const pct = total > 0 ? (r.amount / total) * 100 : 0;
            return (
              <li key={r.label}>
                <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate text-ink-soft">{r.label}</span>
                  <span className="shrink-0 font-semibold tabular-nums text-ink">
                    {formatMoney(r.amount)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// "09:00" → "09" y "Miércoles" → "Mié". Un slice ciego dejaba las horas como
// "09:", con los dos puntos colgando.
function shortLabel(label: string): string {
  return label.includes(":") ? label.split(":")[0] : label.slice(0, 3);
}

function Bars({ title, rows }: { title: string; rows: ReportRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.amount));
  const conDatos = rows.some((r) => r.amount > 0);

  return (
    <div className="card p-5">
      <h2 className="mb-1 font-display font-bold text-ink">{title}</h2>
      <p className="mb-4 text-sm text-ink-muted">Para saber cuándo conviene tener más gente.</p>
      {!conDatos ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-muted">
          Sin ventas en este período.
        </p>
      ) : (
        <div className="flex h-32 items-end gap-1.5">
          {rows.map((r) => (
            <div key={r.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-brand-500/70"
                style={{ height: `${Math.max((r.amount / max) * 100, 2)}%` }}
                title={`${r.label}: ${formatMoney(r.amount)}`}
              />
              <span className="w-full truncate text-center text-[10px] text-ink-faint">
                {shortLabel(r.label)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
