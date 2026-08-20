import "server-only";
import { db } from "./db";
import { computeSaleCosts, signedAmount } from "./cash";

// ¿El negocio tiene activo el módulo Caja y Reportes? Se chequea acá adentro,
// igual que awardPointsForPurchase con Puntos, así el flujo de venta no tiene
// que saber qué módulos hay contratados: llama y no pasa nada si no
// corresponde.
async function cajaActiva(businessId: string): Promise<boolean> {
  const found = await db.businessModule.findFirst({
    where: { businessId, moduleCode: "caja", enabled: true },
    select: { id: true },
  });
  return Boolean(found);
}

// La caja abierta ahora mismo, si hay alguna. No se fuerza tener una: si el
// negocio no abrió caja, la venta se registra igual y simplemente no queda
// asociada — bloquear el mostrador por eso sería peor que el problema.
export async function currentCashSession(businessId: string) {
  return db.cashSession.findFirst({
    where: { businessId, closedAt: null },
    orderBy: { openedAt: "desc" },
  });
}

export interface SaleCostContext {
  businessId: string;
  purchaseId: string;
  employeeId: string | null;
  total: number;
  paymentMethod: string;
  date: Date;
}

// Genera los costos de una venta (comisión + reglas) y su movimiento de caja.
// Devuelve el id de la sesión de caja usada, para que la venta quede apuntada.
export async function applySaleSideEffects(ctx: SaleCostContext): Promise<string | null> {
  if (!(await cajaActiva(ctx.businessId))) return null;

  const [employee, rules, session] = await Promise.all([
    ctx.employeeId
      ? db.employee.findFirst({
          where: { id: ctx.employeeId, businessId: ctx.businessId },
          select: { id: true, name: true, commissionValue: true, commissionKind: true },
        })
      : Promise.resolve(null),
    db.costRule.findMany({ where: { businessId: ctx.businessId, active: true } }),
    currentCashSession(ctx.businessId),
  ]);

  const costs = computeSaleCosts({
    total: ctx.total,
    paymentMethod: ctx.paymentMethod,
    employee,
    rules,
  });

  if (costs.length > 0) {
    await db.saleCost.createMany({
      data: costs.map((c) => ({
        businessId: ctx.businessId,
        purchaseId: ctx.purchaseId,
        kind: c.kind,
        label: c.label,
        amount: c.amount,
        employeeId: c.employeeId,
        costRuleId: c.costRuleId,
        date: ctx.date,
      })),
    });
  }

  if (session) {
    await db.cashMovement.create({
      data: {
        businessId: ctx.businessId,
        sessionId: session.id,
        kind: "venta",
        amount: signedAmount("venta", ctx.total),
        paymentMethod: ctx.paymentMethod,
        description: "Venta",
        purchaseId: ctx.purchaseId,
      },
    });
  }

  return session?.id ?? null;
}
