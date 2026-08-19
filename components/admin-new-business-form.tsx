"use client";

import { useActionState } from "react";
import { AlertCircle } from "lucide-react";
import { createBusiness, AdminFormState } from "@/app/admin-actions";
import { SubmitButton } from "@/components/submit-button";
import { RubroSelect } from "@/components/rubro-select";

function randomPassword(): string {
  return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4);
}

export function AdminNewBusinessForm() {
  const [state, action] = useActionState<AdminFormState, FormData>(createBusiness, {});

  return (
    <form action={action} className="card space-y-5 p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="businessName">
            Nombre del negocio *
          </label>
          <input
            id="businessName"
            name="businessName"
            required
            autoFocus
            className="input"
            placeholder="Ej. Peluquería Estilo"
          />
        </div>
        <RubroSelect />
      </div>

      <div className="border-t border-line-soft pt-5">
        <p className="mb-4 text-sm font-semibold text-ink">Usuario dueño</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="ownerName">
              Nombre
            </label>
            <input id="ownerName" name="ownerName" className="input" placeholder="Quién te escribió" />
          </div>
          <div>
            <label className="label" htmlFor="email">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="input"
              placeholder="negocio@email.com"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="password">
              Contraseña inicial *
            </label>
            <input
              id="password"
              name="password"
              defaultValue={randomPassword()}
              required
              minLength={6}
              className="input font-mono"
            />
            <p className="mt-1.5 text-xs text-ink-muted">
              Se generó una contraseña sugerida — copiala o poné la que prefieras antes de
              enviarla al negocio.
            </p>
          </div>
        </div>
      </div>

      {state.error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {state.error}
        </div>
      )}

      <div className="flex justify-end gap-3 border-t border-line-soft pt-5">
        <SubmitButton pendingText="Creando…">Crear negocio</SubmitButton>
      </div>
    </form>
  );
}
