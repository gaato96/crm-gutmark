"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCcw, Sparkles, LogIn, CheckCircle2, AlertCircle, Copy, Check } from "lucide-react";
import { restoreDemoBusiness, setupDemoAccounts } from "@/app/admin-actions";
import { ImpersonateButton } from "@/components/admin-actions-buttons";
import { rubroLabel } from "@/lib/rubros";

export interface DemoAccountRow {
  id: string;
  name: string;
  rubro: string;
  email: string | null;
  customers: number;
  purchases: number;
}

type Status = { kind: "idle" } | { kind: "busy" } | { kind: "ok"; text: string } | { kind: "error"; text: string };

export function AdminDemoAccounts({ rows, password }: { rows: DemoAccountRow[]; password: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [global, setGlobal] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState<string | null>(null);

  async function restore(id: string) {
    setStatus((s) => ({ ...s, [id]: { kind: "busy" } }));
    const res = await restoreDemoBusiness(id);
    setStatus((s) => ({
      ...s,
      [id]: res.ok
        ? { kind: "ok", text: `${res.customers} clientes · ${res.purchases} ventas` }
        : { kind: "error", text: res.error },
    }));
    return res.ok;
  }

  // De a una y en secuencia: generar una cuenta lleva unos segundos, y todas
  // juntas en un solo pedido se pasarían del tiempo máximo del servidor.
  function setupAll() {
    startTransition(async () => {
      setGlobal("Creando las cuentas que faltan…");
      const list = await setupDemoAccounts();
      for (const [i, b] of list.entries()) {
        setGlobal(`Generando datos ${i + 1} de ${list.length}: ${b.name}…`);
        await restore(b.id);
      }
      setGlobal(`Listo: ${list.length} cuentas demo con datos de hoy.`);
      router.refresh();
    });
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line-soft bg-surface-2/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-display font-bold text-ink">
            <Sparkles className="h-4 w-4 text-accent-600" aria-hidden="true" /> Cuentas demo
          </h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            Un negocio por rubro, con meses de historia. Las fechas se corren solas cada día, así que
            siempre hay cumpleaños, recompras y ventas de hoy. Contraseña de todas:{" "}
            <span className="font-mono font-semibold text-ink">{password}</span>
          </p>
        </div>
        <button onClick={setupAll} disabled={isPending} className="btn-accent shrink-0">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          {rows.length === 0 ? "Crear cuentas demo" : "Restaurar todas"}
        </button>
      </div>

      {global && (
        <p className="border-b border-line-soft px-5 py-2.5 text-sm font-medium text-ink-soft" aria-live="polite">
          {global}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-ink-muted">
          Todavía no hay cuentas demo. Tocá “Crear cuentas demo” y en un minuto tenés una por rubro.
        </p>
      ) : (
        <ul className="divide-y divide-line-soft">
          {rows.map((r) => {
            const st = status[r.id] ?? { kind: "idle" };
            return (
              <li key={r.id} className="flex flex-col gap-3 px-5 py-3.5 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-ink">{r.name}</div>
                  <div className="text-xs text-ink-muted">
                    {rubroLabel(r.rubro)} · {r.customers} clientes · {r.purchases} ventas
                  </div>
                  {r.email && (
                    <button
                      onClick={() => copy(r.email!)}
                      className="mt-1 inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-ink-soft hover:text-ink"
                      title="Copiar email"
                    >
                      {copied === r.email ? <Check className="h-3 w-3 text-brand-600" /> : <Copy className="h-3 w-3" />}
                      <span className="font-mono">{r.email}</span>
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {st.kind === "ok" && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 dark:text-brand-300">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {st.text}
                    </span>
                  )}
                  {st.kind === "error" && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600">
                      <AlertCircle className="h-3.5 w-3.5" /> {st.text}
                    </span>
                  )}
                  <button
                    onClick={() => restore(r.id).then(() => router.refresh())}
                    disabled={st.kind === "busy" || isPending}
                    className="btn-secondary !py-1.5 text-xs"
                    title="Borra los clientes y ventas de esta demo y genera todo de nuevo"
                  >
                    {st.kind === "busy" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCcw className="h-3.5 w-3.5" />
                    )}
                    Restaurar datos
                  </button>
                  <ImpersonateButton
                    businessId={r.id}
                    label={
                      <>
                        <LogIn className="h-3.5 w-3.5" aria-hidden="true" /> Entrar
                      </>
                    }
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
