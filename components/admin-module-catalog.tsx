"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { AlertCircle, Check, Loader2, Pencil, RefreshCw } from "lucide-react";
import { updateModule, syncModuleCatalog, AdminFormState } from "@/app/admin-actions";
import { SubmitButton } from "./submit-button";
import { formatMoney } from "@/lib/format";
import { isModuleImplemented } from "@/lib/modules";

export interface CatalogRow {
  code: string;
  name: string;
  description: string;
  monthlyPrice: number;
  available: boolean;
  sortOrder: number;
  businessCount: number;
}

export function AdminModuleCatalog({ modules }: { modules: CatalogRow[] }) {
  const [isSyncing, startSync] = useTransition();
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line-soft bg-surface-2/60 px-5 py-3">
        <p className="text-xs text-ink-muted">
          {modules.length} módulos en el catálogo.
        </p>
        <button
          type="button"
          disabled={isSyncing}
          onClick={() => startSync(() => syncModuleCatalog())}
          className="btn-ghost !py-1.5 text-xs"
        >
          {isSyncing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          Sincronizar catálogo
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line-soft text-left">
              <th className="px-5 py-3 font-semibold text-ink-soft">Módulo</th>
              <th className="px-5 py-3 font-semibold text-ink-soft">Precio</th>
              <th className="px-5 py-3 font-semibold text-ink-soft">Disponible</th>
              <th className="px-5 py-3 font-semibold text-ink-soft">Negocios</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {modules.map((m) =>
              editing === m.code ? (
                <ModuleEditRow key={m.code} module={m} onDone={() => setEditing(null)} />
              ) : (
                <tr key={m.code} className="border-b border-line-soft last:border-0">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">{m.name}</span>
                      {!isModuleImplemented(m.code) && (
                        <span
                          className="badge bg-surface-3 text-ink-muted ring-line"
                          title="Sin página construida: activarlo no le da acceso a nada al negocio."
                        >
                          Sin construir
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-ink-muted">{m.description}</div>
                    <div className="mt-0.5 font-display text-[0.7rem] uppercase tracking-wide text-ink-faint">
                      {m.code}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 tabular-nums text-ink-soft">
                    {formatMoney(m.monthlyPrice)}
                  </td>
                  <td className="px-5 py-3.5">
                    {m.available ? (
                      <span className="badge bg-brand-500/15 text-brand-700 ring-brand-500/25 dark:text-brand-300">
                        <Check className="h-3 w-3" aria-hidden="true" /> Sí
                      </span>
                    ) : (
                      <span className="badge bg-surface-3 text-ink-muted ring-line">No</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 tabular-nums text-ink-soft">{m.businessCount}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => setEditing(m.code)}
                      className="btn-ghost !p-1.5"
                      aria-label={`Editar ${m.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ModuleEditRow({ module: m, onDone }: { module: CatalogRow; onDone: () => void }) {
  const [state, action] = useActionState<AdminFormState, FormData>(updateModule, {});
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current && !state.error) onDone();
  }, [state, onDone]);

  return (
    <tr className="border-b border-line-soft bg-surface-2/40 last:border-0">
      <td colSpan={5} className="px-5 py-4">
        <form
          action={(fd) => {
            submitted.current = true;
            action(fd);
          }}
          className="grid gap-3 sm:grid-cols-2"
        >
          <input type="hidden" name="code" value={m.code} />
          <div>
            <label className="label">Nombre</label>
            <input name="name" defaultValue={m.name} className="input" required />
          </div>
          <div>
            <label className="label">Precio mensual</label>
            <input
              name="monthlyPrice"
              type="number"
              min="0"
              step="any"
              defaultValue={m.monthlyPrice}
              className="input"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Descripción</label>
            <input name="description" defaultValue={m.description} className="input" />
          </div>
          <div>
            <label className="label">Orden</label>
            <input name="sortOrder" type="number" defaultValue={m.sortOrder} className="input" />
          </div>
          <label className="flex cursor-pointer items-center gap-2 self-end pb-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              name="available"
              defaultChecked={m.available}
              className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500"
            />
            Disponible para contratar
          </label>

          {state.error && (
            <div className="sm:col-span-2 flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {state.error}
            </div>
          )}

          <div className="flex gap-2 sm:col-span-2">
            <SubmitButton className="btn-primary" pendingText="Guardando…">
              Guardar
            </SubmitButton>
            <button type="button" onClick={onDone} className="btn-ghost">
              Cancelar
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}
