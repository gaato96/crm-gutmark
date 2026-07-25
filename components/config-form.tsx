"use client";

import { useState } from "react";
import { Check, Store, SlidersHorizontal } from "lucide-react";
import { updateBusiness } from "@/app/actions";
import { SubmitButton } from "./submit-button";

export interface BusinessData {
  name: string;
  rubro: string;
  inactivityDays: number;
  recompraDays: number;
  vipMinSpend: number;
}

export function ConfigForm({ business }: { business: BusinessData }) {
  const [saved, setSaved] = useState(false);

  return (
    <form
      action={async (fd) => {
        await updateBusiness(fd);
        setSaved(true);
        setTimeout(() => setSaved(false), 2200);
      }}
      className="space-y-6"
    >
      <div className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Store className="h-5 w-5 text-brand-600" />
          <h2 className="font-bold text-ink">Datos del negocio</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label">Nombre del negocio</label>
            <input name="name" defaultValue={business.name} className="input" required />
          </div>
          <div>
            <label className="label">Rubro</label>
            <input name="rubro" defaultValue={business.rubro} className="input" />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="mb-1 flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-brand-600" />
          <h2 className="font-bold text-ink">Reglas de segmentación</h2>
        </div>
        <p className="mb-4 text-sm text-ink-muted">
          Ajustá estos valores según tu tipo de negocio. Definen cómo se clasifican tus clientes.
        </p>
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className="label">Días para "inactivo"</label>
            <input
              name="inactivityDays"
              type="number"
              min="1"
              defaultValue={business.inactivityDays}
              className="input"
            />
            <p className="mt-1 text-xs text-ink-muted">Sin comprar más de estos días.</p>
          </div>
          <div>
            <label className="label">Días para recompra</label>
            <input
              name="recompraDays"
              type="number"
              min="1"
              defaultValue={business.recompraDays}
              className="input"
            />
            <p className="mt-1 text-xs text-ink-muted">Tiempo esperado entre compras.</p>
          </div>
          <div>
            <label className="label">Gasto mínimo VIP</label>
            <input
              name="vipMinSpend"
              type="number"
              min="0"
              step="any"
              defaultValue={business.vipMinSpend}
              className="input"
            />
            <p className="mt-1 text-xs text-ink-muted">Gasto acumulado para ser VIP.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-600">
            <Check className="h-4 w-4" /> Cambios guardados
          </span>
        )}
        <SubmitButton>Guardar configuración</SubmitButton>
      </div>
    </form>
  );
}
