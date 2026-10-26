"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, MailCheck, ArrowLeft } from "lucide-react";
import {
  requestPasswordReset,
  resetPassword,
  type ResetRequestState,
  type AuthState,
} from "@/app/auth-actions";
import { SubmitButton } from "./submit-button";
import { PasswordInput } from "./password-input";

export function RequestResetForm({ emailEnabled }: { emailEnabled: boolean }) {
  const [state, action] = useActionState<ResetRequestState, FormData>(requestPasswordReset, {});

  if (state.sent) {
    return (
      <div>
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/12 text-brand-700 dark:text-brand-300">
          <MailCheck className="h-6 w-6" />
        </div>
        <h1 className="font-display text-2xl text-ink">Revisá tu email</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Si hay una cuenta con ese email, te mandamos un link para elegir una contraseña nueva.
          Vence en una hora. Mirá también en la carpeta de spam.
        </p>
        <p className="mt-4 text-sm text-ink-muted">
          ¿No te llega? Escribinos por WhatsApp y te generamos el link a mano.
        </p>
        <BackToLogin />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Recuperar contraseña</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Escribí el email con el que entrás y te mandamos un link para elegir una nueva.
      </p>
      {!emailEnabled && (
        <p className="mt-4 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
          El envío de emails todavía no está activo. Escribinos por WhatsApp y te mandamos el link.
        </p>
      )}
      <form action={action} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" required autoFocus className="input" autoComplete="email" />
        </div>
        {state.error && <ErrorBox text={state.error} />}
        <SubmitButton className="btn-primary w-full" pendingText="Enviando…">
          Mandarme el link
        </SubmitButton>
      </form>
      <BackToLogin />
    </div>
  );
}

export function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const [state, action] = useActionState<AuthState, FormData>(resetPassword, {});
  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Contraseña nueva</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Para <span className="font-semibold text-ink-soft">{email}</span>. Al guardarla se cierra la
        sesión en los demás dispositivos.
      </p>
      <form action={action} className="mt-6 space-y-4">
        <input type="hidden" name="token" value={token} />
        <div>
          <label className="label" htmlFor="password">
            Contraseña nueva
          </label>
          <PasswordInput id="password" name="password" required minLength={8} autoComplete="new-password" autoFocus />
          <p className="mt-1 text-xs text-ink-muted">Al menos 8 caracteres.</p>
        </div>
        <div>
          <label className="label" htmlFor="confirmPassword">
            Repetila
          </label>
          <PasswordInput id="confirmPassword" name="confirmPassword" required minLength={8} autoComplete="new-password" />
        </div>
        {state.error && <ErrorBox text={state.error} />}
        <SubmitButton className="btn-primary w-full" pendingText="Guardando…">
          Guardar y entrar
        </SubmitButton>
      </form>
    </div>
  );
}

function ErrorBox({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600">
      <AlertCircle className="h-4 w-4 shrink-0" />
      {text}
    </div>
  );
}

function BackToLogin() {
  return (
    <p className="mt-6 text-center text-sm">
      <Link href="/login" className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline dark:text-brand-400">
        <ArrowLeft className="h-4 w-4" /> Volver a ingresar
      </Link>
    </p>
  );
}
