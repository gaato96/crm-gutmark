"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { AlertCircle, Gift } from "lucide-react";
import { redeemPointsAction, PointsFormState } from "@/app/points-actions";
import { SubmitButton } from "./submit-button";
import { Avatar } from "./ui";

export function PointsRedeemRow({
  customerId,
  name,
  balance,
}: {
  customerId: string;
  name: string;
  balance: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<PointsFormState, FormData>(redeemPointsAction, {});
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current && state.ok) setOpen(false);
  }, [state]);

  return (
    <li className="px-5 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/clientes/${customerId}`} className="flex min-w-0 items-center gap-3">
          <Avatar name={name} size="sm" />
          <span className="truncate text-sm font-semibold text-ink hover:underline">{name}</span>
        </Link>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-sm font-bold tabular-nums text-ink">{balance} pts</span>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="btn-ghost !py-1.5 text-xs"
          >
            <Gift className="h-3.5 w-3.5" aria-hidden="true" /> Canjear
          </button>
        </div>
      </div>

      {open && (
        <form
          action={(fd) => {
            submitted.current = true;
            action(fd);
          }}
          className="mt-3 flex flex-wrap items-end gap-2 rounded-xl bg-surface-2 p-3"
        >
          <input type="hidden" name="customerId" value={customerId} />
          <div>
            <label className="label">Puntos a canjear</label>
            <input
              name="points"
              type="number"
              min="1"
              max={balance}
              className="input !w-28 !py-1.5 text-sm"
              required
            />
          </div>
          <div className="min-w-[10rem] flex-1">
            <label className="label">Por qué (opcional)</label>
            <input name="note" placeholder="Ej. 20% off en próxima compra" className="input !py-1.5 text-sm" />
          </div>
          <SubmitButton className="btn-primary !py-1.5 text-sm" pendingText="Canjeando…">
            Confirmar
          </SubmitButton>
          {state.error && (
            <span className="inline-flex w-full items-center gap-1.5 text-xs font-medium text-rose-600">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {state.error}
            </span>
          )}
        </form>
      )}
    </li>
  );
}
