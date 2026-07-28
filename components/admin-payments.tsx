"use client";

import { useActionState, useState, useTransition } from "react";
import { AlertCircle, Trash2, Loader2, Plus } from "lucide-react";
import { registerPayment, deletePayment, AdminFormState } from "@/app/admin-actions";
import { SubmitButton } from "./submit-button";
import { formatMoney, formatDate } from "@/lib/format";

export interface PaymentRow {
  id: string;
  amount: number;
  periodYear: number;
  periodMonth: number;
  method: string;
  paidAt: string;
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function AdminPayments({
  businessId,
  payments,
  suggestedAmount,
}: {
  businessId: string;
  payments: PaymentRow[];
  suggestedAmount: number;
}) {
  const [state, action] = useActionState<AdminFormState, FormData>(registerPayment, {});
  const now = new Date();

  return (
    <div className="card p-5">
      <h3 className="mb-4 font-bold text-ink">Historial de pagos</h3>

      {payments.length === 0 ? (
        <p className="mb-4 text-sm text-ink-muted">Todavía no hay pagos registrados.</p>
      ) : (
        <ul className="mb-5 divide-y divide-line-soft">
          {payments.map((p) => (
            <PaymentItem key={p.id} payment={p} businessId={businessId} />
          ))}
        </ul>
      )}

      <form action={action} className="grid gap-3 border-t border-line-soft pt-4 sm:grid-cols-2">
        <input type="hidden" name="businessId" value={businessId} />
        <div>
          <label className="label">Monto</label>
          <input
            name="amount"
            type="number"
            min="0"
            step="any"
            defaultValue={suggestedAmount || undefined}
            className="input"
            required
          />
        </div>
        <div>
          <label className="label">Método</label>
          <select name="method" className="input" defaultValue="transferencia">
            <option value="transferencia">Transferencia</option>
            <option value="efectivo">Efectivo</option>
            <option value="mercadopago">Mercado Pago</option>
          </select>
        </div>
        <div>
          <label className="label">Mes</label>
          <select name="periodMonth" className="input" defaultValue={now.getMonth() + 1}>
            {MESES.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Año</label>
          <input
            name="periodYear"
            type="number"
            defaultValue={now.getFullYear()}
            className="input"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Notas (opcional)</label>
          <input name="notes" className="input" placeholder="Ej. transferencia desde cuenta personal" />
        </div>

        {state.error && (
          <div className="sm:col-span-2 flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {state.error}
          </div>
        )}

        <div className="sm:col-span-2">
          <SubmitButton className="btn-primary w-full" pendingText="Registrando…">
            <Plus className="h-4 w-4" aria-hidden="true" /> Registrar pago
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}

function PaymentItem({ payment, businessId }: { payment: PaymentRow; businessId: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  return (
    <li className="flex items-center justify-between py-2.5">
      <div>
        <div className="text-sm font-semibold tabular-nums text-ink">
          {formatMoney(payment.amount)}
        </div>
        <div className="text-xs text-ink-muted">
          {MESES[payment.periodMonth - 1]} {payment.periodYear} · {payment.method || "sin método"} ·{" "}
          {formatDate(payment.paidAt)}
        </div>
      </div>
      {confirming ? (
        <div className="flex gap-1.5">
          <button
            disabled={isPending}
            onClick={() => startTransition(() => deletePayment(payment.id, businessId))}
            className="btn bg-rose-600 !py-1.5 text-xs text-white hover:bg-rose-700"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirmar"}
          </button>
          <button onClick={() => setConfirming(false)} className="btn-ghost !py-1.5 text-xs">
            Cancelar
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="btn-ghost !p-1.5 text-rose-500 hover:bg-rose-500/10"
          aria-label="Eliminar pago"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </li>
  );
}
