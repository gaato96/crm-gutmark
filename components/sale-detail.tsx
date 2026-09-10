"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Receipt } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { itemsSummary, type SaleDetail } from "@/lib/cash";

// El detalle de una venta, compartido por Caja y Reportes: la misma venta tiene
// que leerse igual en las dos pantallas.

// Una venta como fila desplegable de una lista. `meta` es la línea chica de
// abajo, que cada pantalla arma con lo suyo (Caja pone la hora, Reportes la
// fecha).
export function SaleRow({
  venta,
  meta,
  icon,
}: {
  venta: SaleDetail;
  meta: React.ReactNode;
  icon?: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <li className="py-1">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="flex w-full items-center justify-between gap-3 rounded-lg py-1.5 text-left transition hover:bg-surface-2"
      >
        {/* Todo spans: el contenido de un <button> es contenido de frase. */}
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-500/10 text-brand-600">
            {icon ?? <Receipt className="h-3.5 w-3.5" />}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-ink">
              {venta.customerName}
            </span>
            <span className="block truncate text-xs text-ink-muted">{meta}</span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="text-sm font-semibold tabular-nums text-ink">
            {formatMoney(venta.total)}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-ink-faint transition-transform ${abierto ? "rotate-180" : ""}`}
            aria-hidden
          />
        </span>
      </button>
      {abierto && <SaleDetailPanel venta={venta} />}
    </li>
  );
}

// Resumen de los ítems para la línea chica, o null si la venta se cargó sin
// ítems (las anteriores a que existieran).
export function saleItemsLine(venta: SaleDetail): string | null {
  return venta.items.length > 0 ? itemsSummary(venta.items) : null;
}

export function SaleDetailPanel({ venta }: { venta: SaleDetail }) {
  return (
    <div className="mb-2 ml-9 rounded-xl bg-surface-2 p-3 text-sm">
      {venta.items.length === 0 ? (
        <p className="text-ink-muted">
          Esta venta se cargó sin detalle de ítems, solo con el importe.
        </p>
      ) : (
        <ul className="space-y-1">
          {venta.items.map((i) => (
            <li key={i.id} className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 text-ink-soft">
                <span className="tabular-nums text-ink-muted">{i.quantity}×</span> {i.name}
                {i.quantity > 1 && (
                  <span className="text-xs text-ink-faint"> ({formatMoney(i.unitPrice)} c/u)</span>
                )}
              </span>
              <span className="shrink-0 tabular-nums text-ink">{formatMoney(i.subtotal)}</span>
            </li>
          ))}
        </ul>
      )}

      {venta.discount > 0 && (
        <div className="mt-2 border-t border-line pt-2">
          <DetailRow label="Subtotal" value={formatMoney(venta.subtotal)} />
          <DetailRow
            label={venta.discountNote ? `Descuento (${venta.discountNote})` : "Descuento"}
            value={`- ${formatMoney(venta.discount)}`}
          />
        </div>
      )}

      <div className="mt-2 border-t border-line pt-2">
        <DetailRow label="Total cobrado" value={formatMoney(venta.total)} strong />
      </div>

      {venta.employeeName && (
        <p className="mt-2 text-xs text-ink-muted">Atendió {venta.employeeName}</p>
      )}
      {venta.note && <p className="mt-1 text-xs text-ink-muted">{venta.note}</p>}

      <Link
        href={`/clientes/${venta.customerId}`}
        className="mt-2 inline-block text-xs font-semibold text-brand-700 underline dark:text-brand-300"
      >
        Ver ficha de {venta.customerName}
      </Link>
    </div>
  );
}

function DetailRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className={strong ? "font-bold text-ink" : "text-ink-soft"}>{value}</span>
    </div>
  );
}
