"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { addPurchase } from "@/app/actions";
import { SubmitButton } from "./submit-button";

export function AddPurchaseForm({ customerId }: { customerId: string }) {
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const action = addPurchase.bind(null, customerId);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary w-full">
        <Plus className="h-4 w-4" /> Registrar compra
      </button>
    );
  }

  return (
    <form
      action={async (fd) => {
        await action(fd);
        setOpen(false);
      }}
      className="rounded-xl border border-brand-500/25 bg-brand-500/10 p-4 animate-fade-in"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">Nueva compra</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-ink-faint hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="amount">
            Monto *
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            min="1"
            step="any"
            required
            autoFocus
            className="input"
            placeholder="0"
          />
        </div>
        <div>
          <label className="label" htmlFor="date">
            Fecha
          </label>
          <input id="date" name="date" type="date" defaultValue={today} className="input" />
        </div>
        <div className="col-span-2">
          <label className="label" htmlFor="description">
            Detalle (opcional)
          </label>
          <input
            id="description"
            name="description"
            className="input"
            placeholder="Ej. Perfume + crema"
          />
        </div>
      </div>
      <div className="mt-3">
        <SubmitButton className="btn-primary w-full">Guardar compra</SubmitButton>
      </div>
    </form>
  );
}
