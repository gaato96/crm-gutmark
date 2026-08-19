// Métodos de pago y aritmética de una venta.
//
// Archivo PURO — sin "server-only" y sin Prisma — porque lo importan tanto las
// Server Actions como el modal de venta rápida, que es client. Igual que
// lib/campaigns.ts y lib/modules.ts.

export const PAYMENT_METHODS = [
  { code: "efectivo", label: "Efectivo" },
  { code: "debito", label: "Débito" },
  { code: "credito", label: "Crédito" },
  { code: "transferencia", label: "Transferencia" },
  { code: "mercadopago", label: "Mercado Pago" },
  { code: "otro", label: "Otro" },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["code"];

export const DEFAULT_PAYMENT_METHOD: PaymentMethod = "efectivo";

export function isPaymentMethod(v: string): v is PaymentMethod {
  return PAYMENT_METHODS.some((m) => m.code === v);
}

export function paymentLabel(code: string): string {
  return PAYMENT_METHODS.find((m) => m.code === code)?.label ?? code;
}

// Un renglón tal como lo arma la UI antes de guardarse.
export interface SaleItemInput {
  // null = ítem escrito a mano, sin servicio del catálogo detrás
  serviceId: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface SaleTotals {
  subtotal: number;
  discount: number;
  total: number;
}

export function lineSubtotal(item: SaleItemInput): number {
  return round2(item.unitPrice * item.quantity);
}

// Los totales se calculan SIEMPRE acá, en el server, a partir de los ítems y
// del descuento — nunca se confía en un total mandado por el cliente, que es
// justamente el número que define cuánto facturó el negocio.
export function saleTotals(items: SaleItemInput[], discount: number): SaleTotals {
  const subtotal = round2(items.reduce((s, i) => s + lineSubtotal(i), 0));
  // El descuento no puede dejar la venta en negativo ni ser negativo él mismo
  // (un descuento negativo sería un recargo encubierto).
  const safeDiscount = round2(Math.min(Math.max(discount, 0), subtotal));
  return { subtotal, discount: safeDiscount, total: round2(subtotal - safeDiscount) };
}

// Los importes en pesos se guardan como Float. Redondear a 2 decimales en cada
// paso evita que 3 renglones con IVA arrastren un 0.000000001 hasta el arqueo
// de caja, donde una diferencia de un centavo se lee como un error de conteo.
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
