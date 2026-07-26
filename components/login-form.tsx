"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { login, AuthState } from "@/app/auth-actions";
import { SubmitButton } from "./submit-button";

export function LoginForm() {
  const [state, action] = useActionState<AuthState, FormData>(login, {});

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Ingresá a tu cuenta</h1>
      <p className="mt-1 text-sm text-ink-muted">Gestioná tus clientes y campañas.</p>

      <form action={action} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" required autoFocus className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Contraseña
          </label>
          <input id="password" name="password" type="password" required className="input" />
        </div>

        {state.error && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {state.error}
          </div>
        )}

        <SubmitButton className="btn-primary w-full" pendingText="Ingresando…">
          Ingresar
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        ¿No tenés cuenta?{" "}
        <Link href="/registro" className="font-semibold text-brand-700 dark:text-brand-400 hover:underline">
          Creá tu negocio
        </Link>
      </p>

      <div className="mt-6 rounded-xl bg-surface-2 p-3 text-center text-xs text-ink-muted">
        <span className="font-semibold text-ink-soft">Demo:</span> demo@perfumeriabella.com ·
        contraseña <span className="font-mono">demo1234</span>
      </div>
    </div>
  );
}
