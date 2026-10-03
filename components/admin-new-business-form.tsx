"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Sparkles } from "lucide-react";
import { presetFor } from "@/lib/rubro-presets";
import { MODULE_SEED } from "@/lib/modules";
import { createBusiness, AdminFormState } from "@/app/admin-actions";
import { SubmitButton } from "@/components/submit-button";
import { RubroSelect } from "@/components/rubro-select";

function randomPassword(): string {
  return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4);
}

export function AdminNewBusinessForm() {
  const [state, action] = useActionState<AdminFormState, FormData>(createBusiness, {});
  const [rubro, setRubro] = useState("");
  const preset = rubro ? presetFor(rubro) : null;

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
        <RubroSelect onChange={setRubro} />
      </div>

      {/* Lo que trae de fábrica según el rubro. Antes todo negocio arrancaba
          vacío y en una demo había que pedirle al cliente que se imagine. */}
      {preset && (
        <div className="rounded-xl border border-accent-500/20 bg-accent-500/5 p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
            <Sparkles className="h-4 w-4 text-accent-600" aria-hidden="true" />
            Arranca precargado para este rubro
          </p>
          <ul className="space-y-1 text-sm text-ink-soft">
            <li>
              <strong>{preset.services.length}</strong> ítems en el catálogo, cada uno con su tiempo
              de recompra
            </li>
            <li>
              <strong>{preset.campaigns.length + 2}</strong> campañas: Cumpleaños, Recompra
              {preset.campaigns.length > 0 && ", "}
              {preset.campaigns.map((c) => c.name).join(", ")}
            </li>
            <li>
              Módulos recomendados:{" "}
              {preset.modules.length === 0
                ? "ninguno"
                : preset.modules
                    .map((m) => MODULE_SEED.find((s) => s.code === m)?.name ?? m)
                    .join(", ")}
            </li>
          </ul>
          <div className="mt-3 space-y-2 border-t border-accent-500/15 pt-3">
            <label className="flex items-start gap-2.5 text-sm text-ink-soft">
              <input
                type="checkbox"
                name="presetModules"
                defaultChecked
                className="mt-0.5 h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-600"
              />
              <span>Activar los módulos recomendados</span>
            </label>
            <label className="flex items-start gap-2.5 text-sm text-ink-soft">
              <input
                type="checkbox"
                name="isDemo"
                className="mt-0.5 h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-600"
              />
              <span>
                Es una cuenta demo
                <span className="block text-xs text-ink-muted">
                  Se llena con cientos de clientes y ventas de ejemplo, y se mantiene al día sola.
                  No suma al MRR. No la marques para un negocio real.
                </span>
              </span>
            </label>
          </div>
        </div>
      )}

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
