// Tipos y aritmética del módulo Stock.
//
// Archivo PURO — sin "server-only" y sin Prisma — porque lo importan la
// pantalla /stock (client) y el selector de venta, igual que lib/cash.ts.

import { round2 } from "./sales";

export const STOCK_KINDS = [
  // Sale sola al registrar una venta (lib/stock-write.ts). No se carga a mano.
  { code: "venta", label: "Venta", sign: -1, manual: false },
  { code: "compra", label: "Compra / ingreso de mercadería", sign: 1, manual: true },
  // Lo que se rompió, venció o se perdió. Sale y no vuelve a la venta.
  { code: "merma", label: "Merma (roto, vencido, perdido)", sign: -1, manual: true },
  { code: "devolucion", label: "Devolución de un cliente", sign: 1, manual: true },
  // Conteo físico: se escribe cuánto hay de verdad y el sistema guarda la
  // diferencia. Es el único tipo cuyo signo sale de la cuenta y no del tipo.
  { code: "ajuste", label: "Ajuste por conteo", sign: 0, manual: true },
] as const;

export type StockKind = (typeof STOCK_KINDS)[number]["code"];

export function isStockKind(v: string): v is StockKind {
  return STOCK_KINDS.some((k) => k.code === v);
}

export function stockKindLabel(code: string): string {
  return STOCK_KINDS.find((k) => k.code === code)?.label.split(" (")[0].split(" /")[0] ?? code;
}

// El signo de un movimiento lo decide el tipo, nunca el formulario: una merma
// cargada con un número positivo no puede terminar sumando unidades.
export function signedQuantity(kind: StockKind, quantity: number): number {
  const meta = STOCK_KINDS.find((k) => k.code === kind)!;
  const q = Math.abs(Math.trunc(quantity));
  return meta.sign === 0 ? Math.trunc(quantity) : q * meta.sign;
}

export type StockLevel = "sin-stock" | "bajo" | "ok";

export function stockLevel(stock: number, minStock: number | null): StockLevel {
  if (stock <= 0) return "sin-stock";
  if (minStock !== null && stock <= minStock) return "bajo";
  return "ok";
}

export const STOCK_LEVEL_META: Record<StockLevel, { label: string; cls: string }> = {
  "sin-stock": { label: "Sin stock", cls: "bg-rose-500/12 text-rose-600 ring-rose-500/25" },
  bajo: { label: "Reponer", cls: "bg-amber-500/15 text-amber-700 ring-amber-500/25 dark:text-amber-300" },
  ok: { label: "OK", cls: "bg-brand-500/12 text-brand-700 ring-brand-500/25 dark:text-brand-300" },
};

// Margen sobre el precio de venta (no sobre el costo): es la cuenta que hace
// un comerciante — "de cada $100 que vendo, me quedan $40".
export function marginPct(price: number, cost: number | null): number | null {
  if (cost === null || price <= 0) return null;
  return round2(((price - cost) / price) * 100);
}

// Cuántas unidades conviene pedir para volver a tener un colchón: el doble del
// mínimo, menos lo que hay. Es una sugerencia; el negocio pide lo que quiera.
export function suggestedReorder(stock: number, minStock: number | null): number {
  if (minStock === null) return 0;
  return Math.max(0, minStock * 2 - stock);
}

export interface StockItemRow {
  id: string;
  name: string;
  category: string;
  sku: string;
  price: number;
  cost: number | null;
  stock: number;
  minStock: number | null;
  active: boolean;
  trackStock: boolean;
  // Unidades vendidas en los últimos 30 días, para saber qué rota.
  sold30: number;
}

export interface StockMovementRow {
  id: string;
  createdAt: string;
  kind: string;
  quantity: number;
  stockAfter: number;
  unitCost: number | null;
  supplier: string | null;
  note: string | null;
  serviceName: string;
  paidFromCash: boolean;
}
