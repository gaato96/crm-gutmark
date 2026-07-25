"use client";

import { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { deleteCustomer } from "@/app/actions";
import { SubmitButton } from "./submit-button";

export function DeleteCustomerButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const action = deleteCustomer.bind(null, id);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-ghost !px-2.5 text-rose-500 hover:bg-rose-500/10"
        aria-label="Eliminar cliente"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-surface p-6 shadow-pop animate-fade-in">
            <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-rose-500/10 text-rose-500">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-ink">Eliminar cliente</h3>
            <p className="mt-1 text-sm text-ink-muted">
              Se eliminará a <span className="font-semibold text-ink">{name}</span> y todo su
              historial de compras. Esta acción no se puede deshacer.
            </p>
            <form action={action} className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
                Cancelar
              </button>
              <SubmitButton className="btn bg-rose-600 text-white hover:bg-rose-700" pendingText="Eliminando…">
                Sí, eliminar
              </SubmitButton>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
