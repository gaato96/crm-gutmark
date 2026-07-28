import "server-only";
import { db } from "./db";

export async function pointsBalance(customerId: string): Promise<number> {
  const result = await db.pointsEntry.aggregate({
    where: { customerId },
    _sum: { points: true },
  });
  return result._sum.points ?? 0;
}

export async function pointsBalancesByCustomer(
  businessId: string
): Promise<Map<string, number>> {
  const rows = await db.pointsEntry.groupBy({
    by: ["customerId"],
    where: { businessId },
    _sum: { points: true },
  });
  return new Map(rows.map((r) => [r.customerId, r._sum.points ?? 0]));
}

// Otorga puntos por una compra, solo si el negocio tiene el módulo "puntos"
// activo — así el resto de los flujos de venta (quickSale, addPurchase, etc.)
// no necesitan saber si el módulo está prendido, simplemente llaman a esto y
// no pasa nada si no corresponde.
export async function awardPointsForPurchase(params: {
  businessId: string;
  customerId: string;
  purchaseId: string;
  amount: number;
}): Promise<void> {
  const business = await db.business.findUnique({
    where: { id: params.businessId },
    select: {
      pointsPerAmount: true,
      modules: { where: { moduleCode: "puntos", enabled: true }, select: { id: true } },
    },
  });
  if (!business || business.modules.length === 0) return;
  if (business.pointsPerAmount <= 0) return;

  const points = Math.floor(params.amount / business.pointsPerAmount);
  if (points <= 0) return;

  await db.pointsEntry.create({
    data: {
      businessId: params.businessId,
      customerId: params.customerId,
      purchaseId: params.purchaseId,
      points,
      reason: "compra",
    },
  });
}

export async function redeemPoints(params: {
  businessId: string;
  customerId: string;
  points: number;
  note?: string;
}): Promise<void> {
  if (!Number.isFinite(params.points) || params.points <= 0) {
    throw new Error("La cantidad de puntos a canjear debe ser mayor a 0.");
  }

  const balance = await pointsBalance(params.customerId);
  if (params.points > balance) {
    throw new Error(`El cliente solo tiene ${balance} puntos disponibles.`);
  }

  await db.pointsEntry.create({
    data: {
      businessId: params.businessId,
      customerId: params.customerId,
      points: -params.points,
      reason: "canje",
      note: params.note?.trim() || null,
    },
  });
}
