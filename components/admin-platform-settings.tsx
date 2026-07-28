"use client";

import { useActionState } from "react";
import { AlertCircle, Check, Settings2 } from "lucide-react";
import { updatePlatformSettings, AdminFormState } from "@/app/admin-actions";
import { SubmitButton } from "./submit-button";
import { SectionTitle } from "./ui";

export interface PlatformSettingsValues {
  basePlanPrice: number;
  currency: string;
  dueDay: number;
  showPricesToOwner: boolean;
}

export function AdminPlatformSettings({ settings }: { settings: PlatformSettingsValues }) {
  const [state, action] = useActionState<AdminFormState, FormData>(updatePlatformSettings, {});

  return (
    <div className="card p-6">
      <SectionTitle>
        <span className="inline-flex items-center gap-2">
          <Settings2 className="h-4 w-4" aria-hidden="true" /> Plan y precios
        </span>
      </SectionTitle>

      <form action={action} className="mt-3 max-w-sm space-y-4">
        <div>
          <label className="label" htmlFor="basePlanPrice">
            Precio del plan base ({settings.currency}/mes)
          </label>
          <input
            id="basePlanPrice"
            name="basePlanPrice"
            type="number"
            min="0"
            step="any"
            defaultValue={settings.basePlanPrice}
            className="input"
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="dueDay">
            Día de vencimiento del pago mensual
          </label>
          <input
            id="dueDay"
            name="dueDay"
            type="number"
            min="1"
            max="28"
            defaultValue={settings.dueDay}
            className="input"
            required
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            name="showPricesToOwner"
            defaultChecked={settings.showPricesToOwner}
            className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500"
          />
          Mostrarle los precios de los módulos al dueño en /modulos
        </label>

        {state.error && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {state.error}
          </div>
        )}

        {state.ok && (
          <div className="flex items-center gap-2 rounded-lg bg-brand-500/10 px-3 py-2 text-sm font-medium text-brand-700 dark:text-brand-400">
            <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
            Guardado.
          </div>
        )}

        <SubmitButton className="btn-secondary" pendingText="Guardando…">
          Guardar
        </SubmitButton>
      </form>
    </div>
  );
}
