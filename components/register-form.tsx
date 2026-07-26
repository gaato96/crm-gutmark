"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { register, AuthState } from "@/app/auth-actions";
import { SubmitButton } from "./submit-button";

export function RegisterForm() {
  const [state, action] = useActionState<AuthState, FormData>(register, {});

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Creá tu negocio</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Empezá gratis a fidelizar a tus clientes en minutos.
      </p>

      <form action={action} className="mt-6 space-y-4">
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
            placeholder="Ej. Perfumería Bella"
          />
        </div>
        <div>
          <label className="label" htmlFor="rubro">
            Rubro
          </label>
          <input
            id="rubro"
            name="rubro"
            className="input"
            placeholder="Ej. Perfumería, peluquería, veterinaria…"
          />
        </div>
        <div>
          <label className="label" htmlFor="name">
            Tu nombre
          </label>
          <input id="name" name="name" className="input" placeholder="Cómo te llamás" />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email *
          </label>
          <input id="email" name="email" type="email" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Contraseña *
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="input"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        {state.error && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {state.error}
          </div>
        )}

        <SubmitButton className="btn-primary w-full" pendingText="Creando tu cuenta…">
          Crear cuenta
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-semibold text-brand-700 dark:text-brand-400 hover:underline">
          Ingresá
        </Link>
      </p>
    </div>
  );
}
