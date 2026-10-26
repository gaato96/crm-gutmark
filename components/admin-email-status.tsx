"use client";

import { useState, useTransition } from "react";
import { Mail, CheckCircle2, AlertTriangle } from "lucide-react";
import { sendWeeklySummariesNow } from "@/app/admin-crm-actions";

export function AdminEmailStatus({ configured, cronConfigured }: { configured: boolean; cronConfigured: boolean }) {
  const [result, setResult] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <div className="card space-y-3 p-6">
      <div className="flex items-center gap-2">
        <Mail className="h-5 w-5 text-brand-600" />
        <h2 className="font-bold text-ink">Emails</h2>
      </div>
      <ul className="space-y-1.5 text-sm">
        <Status ok={configured} text={configured ? "Envío de emails activo (Resend)." : "Falta RESEND_API_KEY: no salen los links de recuperar contraseña ni el resumen semanal."} />
        <Status ok={cronConfigured} text={cronConfigured ? "Resumen semanal programado los lunes 8:00." : "Falta CRON_SECRET: el cron del resumen semanal no va a poder correr."} />
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <button
          disabled={pending || !configured}
          onClick={() =>
            startTransition(async () => {
              const r = await sendWeeklySummariesNow();
              setResult(r.error ?? `Enviados: ${r.sent} · salteados: ${r.skipped}${r.pending ? ` · quedan ${r.pending}` : ""}`);
            })
          }
          className="btn-secondary !py-2 text-sm"
        >
          {pending ? "Enviando…" : "Mandar los resúmenes pendientes ahora"}
        </button>
        {result && <span className="text-sm text-ink-muted">{result}</span>}
      </div>
      <p className="text-xs text-ink-muted">
        Solo les llega a los negocios que no lo recibieron en los últimos 6 días, así que no se duplica con el del lunes.
      </p>
    </div>
  );
}

function Status({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li className="flex items-start gap-2">
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
      ) : (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      )}
      <span className={ok ? "text-ink-soft" : "text-ink"}>{text}</span>
    </li>
  );
}
