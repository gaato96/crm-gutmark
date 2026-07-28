"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { AlertCircle, Gift } from "lucide-react";
import { redeemPointsAction, PointsFormState } from "@/app/points-actions";
import { SubmitButton } from "./submit-button";
import { formatDate } from "@/lib/format";

export interface PointsHistoryEntry {
  id: string;
  points: number;
  reason: string;
  note: string | null;
  createdAt: string;
}

export function PointsCard({
  customerId,
  balance,
  history,
}: {
  customerId: string;
  balance: number;
  history: PointsHistoryEntry[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<PointsFormState, FormData>(redeemPointsAction, {});
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current && state.ok) setOpen(false);
  }, [state]);

  return (
    <div className="card p-5">
      <div className="mb-1 flex items-center gap-2 font-bold text-ink">
        <Gift className="h-4 w-4" aria-hidden="true" /> Puntos
      </div>
      <div className="text-2xl font-bold tabular-nums text-ink">{balance} pts</div>

      {balance > 0 && (
        <button type="button" onClick={() => setOpen((o) => !o)} className="btn-secondary mt-3 w-full !py-2 text-sm">
          Canjear puntos
        </button>
      )}

      {open && (
        <form
          action={(fd) => {
            submitted.current = true;
            action(fd);
          }}
          className="mt-3 space-y-2 rounded-xl bg-surface-2 p-3"
        >
          <input type="hidden" name="customerId" value={customerId} />
          <div>
            <label className="label">Puntos a canjear</label>
            <input name="points" type="number" min="1" max={balance} className="input !py-1.5 text-sm" required />
          </div>
          <div>
            <label className="label">Por qué (opcional)</label>
            <input name="note" placeholder="Ej. 20% off en próxima compra" className="input !py-1.5 text-sm" />
          </div>
          <SubmitButton className="btn-primary w-full !py-1.5 text-sm" pendingText="Canjeando…">
            Confirmar canje
          </SubmitButton>
          {state.error && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {state.error}
            </div>
          )}
        </form>
      )}

      {history.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-line-soft pt-3">
          {history.map((h) => (
            <li key={h.id} className="flex items-center justify-between text-xs">
              <span className="text-ink-muted">
                {h.reason === "compra" ? "Compra" : h.note || (h.reason === "canje" ? "Canje" : "Ajuste")}
                {" · "}
                {formatDate(h.createdAt)}
              </span>
              <span className={`font-bold tabular-nums ${h.points > 0 ? "text-brand-600 dark:text-brand-400" : "text-rose-500"}`}>
                {h.points > 0 ? "+" : ""}
                {h.points}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
