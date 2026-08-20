// Aritmética de costos y de caja.
//
// Archivo PURO — sin "server-only" y sin Prisma — porque lo importan tanto las
// Server Actions como las pantallas client de Caja y Reportes.

import { round2 } from "./sales";

export const MOVEMENT_KINDS = [
  { code: "venta", label: "Venta", sign: 1 },
  { code: "ingreso", label: "Ingreso", sign: 1 },
  { code: "egreso", label: "Egreso", sign: -1 },
  { code: "retiro", label: "Retiro", sign: -1 },
] as const;

export type MovementKind = (typeof MOVEMENT_KINDS)[number]["code"];

export function isMovementKind(v: string): v is MovementKind {
  return MOVEMENT_KINDS.some((m) => m.code === v);
}

export function movementLabel(code: string): string {
  return MOVEMENT_KINDS.find((m) => m.code === code)?.label ?? code;
}

// El signo lo decide el tipo de movimiento, nunca el formulario: si el importe
// viniera con signo desde la UI, un egreso podría cargarse como ingreso y el
// arqueo cerraría bien con la plata mal.
export function signedAmount(kind: string, amount: number): number {
  const meta = MOVEMENT_KINDS.find((m) => m.code === kind);
  const sign = meta?.sign ?? 1;
  return round2(Math.abs(amount) * sign);
}

// --- Costos de una venta ----------------------------------------------------

export interface CostRuleLike {
  id: string;
  name: string;
  kind: string; // "percent" | "fixed"
  value: number;
  paymentMethod: string | null;
  active: boolean;
}

export interface ComputedCost {
  kind: "comision" | "regla";
  label: string;
  amount: number;
  employeeId: string | null;
  costRuleId: string | null;
}

// Costos que genera una venta: la comisión de quien atendió más las reglas que
// apliquen a ese método de pago.
//
// Todo se calcula sobre lo efectivamente cobrado (`total`), no sobre el
// subtotal: si el negocio hizo un descuento, el barbero cobra su porcentaje de
// lo que entró, no de lo que decía la lista.
export function computeSaleCosts(params: {
  total: number;
  paymentMethod: string;
  employee: {
    id: string;
    name: string;
    commissionValue: number;
    commissionKind: string;
  } | null;
  rules: CostRuleLike[];
}): ComputedCost[] {
  const costs: ComputedCost[] = [];
  const { total, paymentMethod, employee, rules } = params;

  if (employee && employee.commissionValue > 0) {
    // Un monto fijo se paga igual sin importar cuánto salió la venta (por
    // ejemplo, $2.000 por corte). Un porcentaje se calcula sobre lo cobrado.
    const amount =
      employee.commissionKind === "fixed"
        ? round2(employee.commissionValue)
        : round2((total * employee.commissionValue) / 100);

    costs.push({
      kind: "comision",
      // El nombre queda congelado en el texto: si mañana se va y lo borran, el
      // costo del mes pasado tiene que seguir diciendo de quién era.
      label: `Comisión ${employee.name}`,
      amount,
      employeeId: employee.id,
      costRuleId: null,
    });
  }

  for (const rule of rules) {
    if (!rule.active) continue;
    // Una regla sin método de pago aplica a todas las ventas; con método,
    // solo a las de ese medio.
    if (rule.paymentMethod && rule.paymentMethod !== paymentMethod) continue;

    const amount =
      rule.kind === "fixed" ? round2(rule.value) : round2((total * rule.value) / 100);
    if (amount <= 0) continue;

    costs.push({
      kind: "regla",
      label: rule.name,
      amount,
      employeeId: null,
      costRuleId: rule.id,
    });
  }

  return costs;
}

// --- Arqueo -----------------------------------------------------------------

export interface CashTotals {
  opening: number;
  ventasEfectivo: number;
  ingresos: number;
  egresos: number;
  esperado: number;
}

// Lo que debería haber en la caja física. Solo cuenta el EFECTIVO: una venta
// con tarjeta no deja plata en el cajón, así que sumarla haría que el arqueo
// diera siempre un faltante enorme.
export function cashExpected(params: {
  openingAmount: number;
  movements: { kind: string; amount: number; paymentMethod: string }[];
}): CashTotals {
  let ventasEfectivo = 0;
  let ingresos = 0;
  let egresos = 0;

  for (const m of params.movements) {
    if (m.paymentMethod !== "efectivo") continue;
    if (m.kind === "venta") ventasEfectivo += m.amount;
    else if (m.amount >= 0) ingresos += m.amount;
    else egresos += m.amount; // ya viene negativo
  }

  const esperado = round2(params.openingAmount + ventasEfectivo + ingresos + egresos);
  return {
    opening: round2(params.openingAmount),
    ventasEfectivo: round2(ventasEfectivo),
    ingresos: round2(ingresos),
    egresos: round2(egresos),
    esperado,
  };
}

export function cashDifference(counted: number, expected: number): number {
  return round2(counted - expected);
}

// --- Períodos de reporte ----------------------------------------------------

export type PeriodKind = "semana" | "mes";

export interface Period {
  from: Date;
  to: Date;
  label: string;
}

// Semana que arranca el LUNES (getDay(): 0 = domingo). En Argentina la semana
// comercial es lunes a domingo, así que un corte domingo-a-sábado partiría el
// fin de semana, que es cuando más factura una peluquería.
export function startOfWeek(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = x.getDay();
  const back = dow === 0 ? 6 : dow - 1;
  x.setDate(x.getDate() - back);
  return x;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// Devuelve el período actual y el inmediatamente anterior, para poder comparar.
export function periodRange(kind: PeriodKind, offset = 0): Period {
  const now = new Date();

  if (kind === "semana") {
    const start = startOfWeek(now);
    start.setDate(start.getDate() - offset * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return {
      from: start,
      to: end,
      label: `Semana del ${start.toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}`,
    };
  }

  const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  return {
    from: start,
    to: end,
    label: start.toLocaleDateString("es-AR", { month: "long", year: "numeric" }),
  };
}

export function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return round2(((current - previous) / previous) * 100);
}
