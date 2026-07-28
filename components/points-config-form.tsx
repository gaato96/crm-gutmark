"use client";

import { useActionState } from "react";
import { AlertCircle, Check, Settings2 } from "lucide-react";
import { updatePointsConfig, PointsFormState } from "@/app/points-actions";
import { SubmitButton } from "./submit-button";

export function PointsConfigForm({ pointsPerAmount }: { pointsPerAmount: number }) {
  const [state, action] = useActionState<PointsFormState, FormData>(updatePointsConfig, {});

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center gap-2 font-bold text-ink">
        <Settings2 className="h-4 w-4" aria-hidden="true" /> Cómo se ganan los puntos
      </div>
      <form action={action} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="pointsPerAmount">
            Ganan 1 punto cada $ gastados
          </label>
          <input
            id="pointsPerAmount"
            name="pointsPerAmount"
            type="number"
            min="1"
            step="any"
            defaultValue={pointsPerAmount}
            className="input !w-40"
            required
          />
        </div>
        <SubmitButton className="btn-secondary" pendingText="Guardando…">
          Guardar
        </SubmitButton>
        {state.ok && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 dark:text-brand-400">
            <Check className="h-4 w-4" aria-hidden="true" /> Guardado.
          </span>
        )}
        {state.error && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600">
            <AlertCircle className="h-4 w-4" aria-hidden="true" /> {state.error}
          </span>
        )}
      </form>
    </div>
  );
}
