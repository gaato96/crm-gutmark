"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { addPurchase } from "@/app/actions";
import { DEFAULT_PAYMENT_METHOD } from "@/lib/sales";
import { SubmitButton } from "./submit-button";
import {
  SaleItemsPicker,
  type PickableService,
  type PickableEmployee,
  type PickedItem,
} from "./sale-items-picker";

export function AddPurchaseForm({
  customerId,
  services,
  employees = [],
}: {
  customerId: string;
  services: PickableService[];
  employees?: PickableEmployee[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PickedItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<string>(DEFAULT_PAYMENT_METHOD);
  const [employeeId, setEmployeeId] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const action = addPurchase.bind(null, customerId);

  function reset() {
    setItems([]);
    setDiscount(0);
    setPaymentMethod(DEFAULT_PAYMENT_METHOD);
    setEmployeeId("");
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary w-full">
        <Plus className="h-4 w-4" /> Registrar venta
      </button>
    );
  }

  return (
    <form
      action={async (fd) => {
        await action(fd);
        setOpen(false);
        reset();
        // revalidatePath deja el caché sucio, pero esta invocación sale de una
        // función del cliente y el router no vuelve a pedir la ruta solo: sin
        // esto, el negocio guarda la venta y no la ve aparecer en el historial.
        router.refresh();
      }}
      className="rounded-xl border border-brand-500/25 bg-brand-500/10 p-4 animate-fade-in"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">Nueva venta</span>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            reset();
          }}
          className="text-ink-faint hover:text-ink"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Los renglones son una lista de largo variable: viajan como JSON en un
          campo oculto, que el FormData plano no representaría bien. */}
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(
          items.map((i) => ({
            serviceId: i.serviceId,
            name: i.name,
            unitPrice: i.unitPrice,
            quantity: i.quantity,
          }))
        )}
      />
      <input type="hidden" name="discount" value={discount} />
      <input type="hidden" name="paymentMethod" value={paymentMethod} />
      <input type="hidden" name="employeeId" value={employeeId} />

      <SaleItemsPicker
        services={services}
        items={items}
        onItemsChange={setItems}
        discount={discount}
        onDiscountChange={setDiscount}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        employees={employees}
        employeeId={employeeId}
        onEmployeeChange={setEmployeeId}
        compact
      />

      <div className="mt-3 grid grid-cols-2 gap-3">
        {/* Sin servicios elegidos la venta sigue siendo por monto suelto: un
            negocio que todavía no cargó su catálogo tiene que poder vender. */}
        {items.length === 0 && (
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
        )}
        <div>
          <label className="label" htmlFor="date">
            Fecha
          </label>
          <input id="date" name="date" type="date" defaultValue={today} className="input" />
        </div>
        <div className="col-span-2">
          <label className="label" htmlFor="description">
            Detalle <span className="font-normal text-ink-faint">(opcional)</span>
          </label>
          <input
            id="description"
            name="description"
            className="input"
            placeholder="Ej. atendió Juan"
          />
        </div>
      </div>

      <div className="mt-3">
        <SubmitButton className="btn-primary w-full">Guardar venta</SubmitButton>
      </div>
    </form>
  );
}
