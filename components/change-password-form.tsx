"use client";

import { useActionState } from "react";
import { AlertCircle, Check, KeyRound } from "lucide-react";
import { changePassword, ChangePasswordState } from "@/app/auth-actions";
import { SubmitButton } from "./submit-button";
import { SectionTitle } from "./ui";
import { PasswordInput } from "@/components/password-input";

export function ChangePasswordForm() {
  const [state, action] = useActionState<ChangePasswordState, FormData>(changePassword, {});

  return (
    <div className="card p-6">
      <SectionTitle>
        <span className="inline-flex items-center gap-2">
          <KeyRound className="h-4 w-4" aria-hidden="true" /> Seguridad
        </span>
      </SectionTitle>

      <form action={action} className="mt-3 max-w-sm space-y-4">
        <div>
          <label className="label" htmlFor="currentPassword">
            Contraseña actual
          </label>
          <PasswordInput
            id="currentPassword"
            name="currentPassword"
            required
            autoComplete="current-password"
          />
        </div>

        <div>
          <label className="label" htmlFor="newPassword">
            Contraseña nueva
          </label>
          <PasswordInput
            id="newPassword"
            name="newPassword"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
          />
        </div>

        <div>
          <label className="label" htmlFor="confirmPassword">
            Confirmar contraseña nueva
          </label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>

        {state.error && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {state.error}
          </div>
        )}

        {state.ok && (
          <div className="flex items-center gap-2 rounded-lg bg-brand-500/10 px-3 py-2 text-sm font-medium text-brand-700 dark:text-brand-400">
            <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
            Contraseña actualizada.
            {typeof state.closed === "number" && state.closed > 0
              ? ` Cerramos ${state.closed} ${state.closed === 1 ? "sesión" : "sesiones"} en otros dispositivos.`
              : ""}
          </div>
        )}

        <SubmitButton className="btn-secondary" pendingText="Cambiando…">
          Cambiar contraseña
        </SubmitButton>
      </form>
    </div>
  );
}
