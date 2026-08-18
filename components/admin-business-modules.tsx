"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { setBusinessModule, setBusinessModulePrice } from "@/app/admin-actions";
import { formatMoney } from "@/lib/format";
import { isModuleImplemented } from "@/lib/modules";

export interface CatalogModule {
  code: string;
  name: string;
  monthlyPrice: number;
  available: boolean;
}

export interface CurrentModule {
  moduleCode: string;
  enabled: boolean;
  priceOverride: number | null;
}

export function AdminBusinessModules({
  businessId,
  catalog,
  current,
}: {
  businessId: string;
  catalog: CatalogModule[];
  current: CurrentModule[];
}) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line-soft bg-surface-2/60 text-left">
              <th className="px-5 py-3 font-semibold text-ink-soft">Módulo</th>
              <th className="px-5 py-3 font-semibold text-ink-soft">Precio de lista</th>
              <th className="px-5 py-3 font-semibold text-ink-soft">Precio especial</th>
              <th className="px-5 py-3 font-semibold text-ink-soft">Activo</th>
            </tr>
          </thead>
          <tbody>
            {catalog.map((m) => {
              const cur = current.find((c) => c.moduleCode === m.code);
              return (
                <ModuleRow
                  key={m.code}
                  businessId={businessId}
                  module={m}
                  enabled={cur?.enabled ?? false}
                  priceOverride={cur?.priceOverride ?? null}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ModuleRow({
  businessId,
  module: m,
  enabled,
  priceOverride,
}: {
  businessId: string;
  module: CatalogModule;
  enabled: boolean;
  priceOverride: number | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [isPendingPrice, startPriceTransition] = useTransition();

  return (
    <tr className="border-b border-line-soft last:border-0">
      <td className="px-5 py-3.5">
        <div className="font-semibold text-ink">{m.name}</div>
        {!m.available && (
          <div className="text-xs text-ink-muted">No disponible en catálogo</div>
        )}
        {!isModuleImplemented(m.code) && (
          <div className="text-xs text-ink-muted">
            Sin construir — activarlo se cobra pero no habilita ninguna pantalla.
          </div>
        )}
      </td>
      <td className="px-5 py-3.5 tabular-nums text-ink-soft">{formatMoney(m.monthlyPrice)}</td>
      <td className="px-5 py-3.5">
        <form
          action={(fd) => startPriceTransition(() => setBusinessModulePrice(businessId, m.code, fd))}
          className="flex items-center gap-2"
        >
          <input
            name="price"
            type="number"
            min="0"
            step="any"
            defaultValue={priceOverride ?? ""}
            placeholder={String(m.monthlyPrice)}
            className="input !w-28 !py-1.5 text-sm"
          />
          <button type="submit" disabled={isPendingPrice} className="btn-ghost !p-1.5">
            {isPendingPrice ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Guardar"}
          </button>
        </form>
      </td>
      <td className="px-5 py-3.5">
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => setBusinessModule(businessId, m.code, !enabled))}
          role="switch"
          aria-checked={enabled}
          aria-label={`${enabled ? "Desactivar" : "Activar"} ${m.name}`}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
            enabled ? "bg-brand-600" : "bg-surface-3"
          } ${isPending ? "opacity-60" : ""}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </td>
    </tr>
  );
}
