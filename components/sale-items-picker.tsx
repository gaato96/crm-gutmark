"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Plus, Minus, Trash2, Tag } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { PAYMENT_METHODS, saleTotals, type SaleItemInput } from "@/lib/sales";

export interface PickableEmployee {
  id: string;
  name: string;
}

// El catálogo tal como llega del server (solo lo que el selector necesita).
export interface PickableService {
  id: string;
  name: string;
  price: number;
  category: string;
}

// Un renglón ya elegido, con el precio editable por si se pactó otro.
export interface PickedItem extends SaleItemInput {
  key: string;
}

export function newItemKey(): string {
  return Math.random().toString(36).slice(2, 10);
}

// Selector de servicios + descuento + método de pago. No conoce el server:
// devuelve el estado hacia arriba y el que lo usa decide cómo guardarlo. Así
// sirve igual en el modal de venta rápida y en la ficha del cliente.
export function SaleItemsPicker({
  services,
  items,
  onItemsChange,
  discount,
  onDiscountChange,
  paymentMethod,
  onPaymentMethodChange,
  employees = [],
  employeeId = "",
  onEmployeeChange,
  compact = false,
}: {
  services: PickableService[];
  items: PickedItem[];
  // Es el setter de React tal cual, no un callback plano: así las funciones de
  // abajo pueden actualizar a partir del estado ANTERIOR. Con un callback plano,
  // dos clics seguidos sobre el mismo servicio leían ambos la lista vieja y el
  // segundo se perdía — en el mostrador eso es una unidad que no se cobra.
  onItemsChange: Dispatch<SetStateAction<PickedItem[]>>;
  discount: number;
  onDiscountChange: (n: number) => void;
  paymentMethod: string;
  onPaymentMethodChange: (m: string) => void;
  // Solo llegan con el módulo Caja activo. Sin empleados cargados, el selector
  // no se muestra: al dueño que atiende solo no le sirve de nada.
  employees?: PickableEmployee[];
  employeeId?: string;
  onEmployeeChange?: (id: string) => void;
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return services;
    return services.filter(
      (s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
    );
  }, [services, query]);

  const totals = saleTotals(items, discount);

  function addService(s: PickableService) {
    onItemsChange((prev) => {
      // Si ya está en la venta, suma cantidad en vez de repetir el renglón.
      const existing = prev.find((i) => i.serviceId === s.id);
      if (existing) {
        return prev.map((i) =>
          i.key === existing.key ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        { key: newItemKey(), serviceId: s.id, name: s.name, unitPrice: s.price, quantity: 1 },
      ];
    });
  }

  function setQty(key: string, delta: number) {
    onItemsChange((prev) =>
      prev
        .map((i) => (i.key === key ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  }

  function setPrice(key: string, value: number) {
    onItemsChange((prev) => prev.map((i) => (i.key === key ? { ...i, unitPrice: value } : i)));
  }

  function remove(key: string) {
    onItemsChange((prev) => prev.filter((i) => i.key !== key));
  }

  return (
    <div className="space-y-3">
      {services.length > 0 && (
        <div>
          {services.length > 6 && (
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar servicio…"
              className="input mb-2"
            />
          )}
          <div className={`flex flex-wrap gap-1.5 ${compact ? "max-h-32 overflow-y-auto" : ""}`}>
            {filtered.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => addService(s)}
                className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink-soft ring-1 ring-inset ring-line transition hover:bg-brand-500/15 hover:text-brand-700 dark:hover:text-brand-300"
              >
                <Plus className="h-3 w-3" />
                {s.name}
                <span className="text-ink-faint">{formatMoney(s.price)}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-ink-muted">Ningún servicio coincide con esa búsqueda.</p>
            )}
          </div>
        </div>
      )}

      {items.length > 0 && (
        <ul className="divide-y divide-line-soft rounded-xl border border-line">
          {items.map((i) => (
            <li key={i.key} className="flex items-center gap-2 px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-sm text-ink">{i.name}</span>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setQty(i.key, -1)}
                  className="grid h-6 w-6 place-items-center rounded-md bg-surface-2 text-ink-soft hover:bg-surface-3"
                  aria-label={`Quitar uno de ${i.name}`}
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-6 text-center text-sm font-semibold text-ink">{i.quantity}</span>
                <button
                  type="button"
                  onClick={() => setQty(i.key, 1)}
                  className="grid h-6 w-6 place-items-center rounded-md bg-surface-2 text-ink-soft hover:bg-surface-3"
                  aria-label={`Agregar uno de ${i.name}`}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              <input
                type="number"
                min={0}
                step="any"
                value={i.unitPrice}
                onChange={(e) => setPrice(i.key, parseFloat(e.target.value) || 0)}
                className="w-24 shrink-0 rounded-lg border border-line bg-surface px-2 py-1 text-right text-sm text-ink"
                aria-label={`Precio de ${i.name}`}
              />

              <button
                type="button"
                onClick={() => remove(i.key)}
                className="shrink-0 text-ink-faint hover:text-rose-600"
                aria-label={`Sacar ${i.name} de la venta`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="sale-payment">
            Método de pago
          </label>
          <select
            id="sale-payment"
            value={paymentMethod}
            onChange={(e) => onPaymentMethodChange(e.target.value)}
            className="input"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.code} value={m.code}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="sale-discount">
            Descuento
          </label>
          <input
            id="sale-discount"
            type="number"
            min={0}
            step="any"
            value={discount || ""}
            onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="input"
          />
        </div>
      </div>

      {employees.length > 0 && onEmployeeChange && (
        <div>
          <label className="label" htmlFor="sale-employee">
            ¿Quién atendió?
          </label>
          <select
            id="sale-employee"
            value={employeeId}
            onChange={(e) => onEmployeeChange(e.target.value)}
            className="input"
          >
            <option value="">Sin asignar</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {items.length > 0 && (
        <div className="rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm">
          <Row label="Subtotal" value={formatMoney(totals.subtotal)} />
          {totals.discount > 0 && (
            <Row
              label="Descuento"
              value={`- ${formatMoney(totals.discount)}`}
              tone="text-amber-700 dark:text-amber-300"
            />
          )}
          <div className="mt-1.5 flex items-center justify-between border-t border-line pt-1.5">
            <span className="flex items-center gap-1.5 font-semibold text-ink">
              <Tag className="h-3.5 w-3.5" /> Total
            </span>
            <span className="font-display text-lg font-bold text-brand-700 dark:text-brand-300">
              {formatMoney(totals.total)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className={tone ?? "text-ink-soft"}>{value}</span>
    </div>
  );
}
