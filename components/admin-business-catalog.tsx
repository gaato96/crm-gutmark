"use client";

import { useActionState, useState } from "react";
import { Store, Check } from "lucide-react";
import { setBusinessCatalog, type AdminFormState } from "@/app/admin-actions";
import {
  RUBROS,
  CATALOG_MODES,
  catalogWords,
  modeForRubro,
  rubroLabel,
} from "@/lib/rubros";
import { SubmitButton } from "./submit-button";

const EMPTY: AdminFormState = {};

export function AdminBusinessCatalog({
  businessId,
  rubro,
  catalogMode,
}: {
  businessId: string;
  rubro: string;
  catalogMode: string;
}) {
  const [state, action] = useActionState(setBusinessCatalog.bind(null, businessId), EMPTY);
  const [rubroSel, setRubroSel] = useState(rubro);
  const [modeSel, setModeSel] = useState(catalogMode);

  const sugerido = modeForRubro(rubroSel);
  const forzado = modeSel !== sugerido;
  const words = catalogWords(modeSel);

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-500/10 text-accent-600">
          <Store className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-display font-bold text-ink">Rubro y catálogo</h2>
          <p className="text-sm text-ink-muted">
            Decide cómo se llama todo lo que el negocio vende, en toda su interfaz.
          </p>
        </div>
      </div>

      <form action={action} className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="admin-rubro">
            Rubro
          </label>
          <select
            id="admin-rubro"
            name="rubro"
            value={rubroSel}
            onChange={(e) => {
              const next = e.target.value;
              setRubroSel(next);
              // Al cambiar de rubro se propone su modo: lo habitual es que el
              // superadmin esté corrigiendo una clasificación mal hecha, no
              // armando una excepción.
              setModeSel(modeForRubro(next));
            }}
            className="input"
          >
            {RUBROS.map((r) => (
              <option key={r.code} value={r.code}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="admin-mode">
            Qué vende
          </label>
          <select
            id="admin-mode"
            name="catalogMode"
            value={modeSel}
            onChange={(e) => setModeSel(e.target.value)}
            className="input"
          >
            {CATALOG_MODES.map((m) => (
              <option key={m} value={m}>
                {m === "productos"
                  ? "Solo productos"
                  : m === "servicios"
                  ? "Solo servicios"
                  : "Productos y servicios"}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-ink-muted">
            {forzado ? (
              <>
                Forzado. Lo normal para {rubroLabel(rubroSel)} sería{" "}
                <strong>{sugerido}</strong>.
              </>
            ) : (
              <>Es lo que corresponde al rubro elegido.</>
            )}
          </p>
        </div>

        <div className="sm:col-span-2">
          <div className="rounded-xl bg-surface-2 p-3.5 text-sm">
            <p className="mb-1 font-semibold text-ink-soft">Con esto, el dueño va a ver:</p>
            <ul className="space-y-0.5 text-ink-muted">
              <li>
                · En el menú: <strong className="text-ink">{words.nav}</strong>
              </li>
              <li>
                · Al vender: <strong className="text-ink">{words.sellerLabel}</strong>
              </li>
              <li>
                · En campañas:{" "}
                <strong className="text-ink">{words.triggerLabel}</strong>
              </li>
              <li>
                · En reportes: <strong className="text-ink">{words.reportBreakdown}</strong>
              </li>
            </ul>
          </div>
        </div>

        {state.error && (
          <p className="rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-700 dark:text-rose-300 sm:col-span-2">
            {state.error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 sm:col-span-2">
          {state.ok && (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 dark:text-brand-300">
              <Check className="h-4 w-4" /> Guardado
            </span>
          )}
          <SubmitButton className="btn-primary">Guardar</SubmitButton>
        </div>
      </form>
    </div>
  );
}
