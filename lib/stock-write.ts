import "server-only";
import { db } from "./db";
import { round2 } from "./sales";

// ¿El negocio tiene activo el módulo Stock? Se chequea acá adentro, igual que
// cajaActiva() en lib/cash-write.ts: el flujo de venta llama siempre y no pasa
// nada si el negocio no lo contrató.
export async function stockActivo(businessId: string): Promise<boolean> {
  const found = await db.businessModule.findFirst({
    where: { businessId, moduleCode: "stock", enabled: true },
    select: { id: true },
  });
  return Boolean(found);
}

export interface StockChange {
  businessId: string;
  serviceId: string;
  kind: string;
  // Con signo.
  quantity: number;
  unitCost?: number | null;
  supplier?: string | null;
  note?: string | null;
  purchaseId?: string | null;
  cashMovementId?: string | null;
  userId?: string | null;
}

// Único lugar que mueve Service.stock. El incremento es atómico en la base
// (`increment`), así dos ventas simultáneas del mismo producto no se pisan, y
// el saldo resultante queda anotado en el movimiento.
export async function applyStockChange(change: StockChange) {
  const svc = await db.service.update({
    where: { id: change.serviceId },
    data: { stock: { increment: change.quantity } },
    select: { stock: true },
  });
  return db.stockMovement.create({
    data: {
      businessId: change.businessId,
      serviceId: change.serviceId,
      kind: change.kind,
      quantity: change.quantity,
      stockAfter: svc.stock,
      unitCost: change.unitCost ?? null,
      supplier: change.supplier ?? null,
      note: change.note ?? null,
      purchaseId: change.purchaseId ?? null,
      cashMovementId: change.cashMovementId ?? null,
      userId: change.userId ?? null,
    },
  });
}

// Descuenta del stock lo que se llevó una venta y, si el producto tiene costo
// cargado, registra el costo de la mercadería vendida como un SaleCost — así
// Reportes muestra la ganancia real sin saber nada de stock: para él es un
// costo más, igual que la comisión.
//
// Lo llama recordSale() siempre; se auto-gatea con el módulo.
export async function applySaleStock(params: {
  businessId: string;
  purchaseId: string;
  date: Date;
  items: { serviceId: string | null; quantity: number }[];
}) {
  const withService = params.items.filter(
    (i): i is { serviceId: string; quantity: number } => Boolean(i.serviceId)
  );
  if (withService.length === 0) return;
  if (!(await stockActivo(params.businessId))) return;

  const tracked = await db.service.findMany({
    where: {
      businessId: params.businessId,
      id: { in: withService.map((i) => i.serviceId) },
      trackStock: true,
    },
    select: { id: true, name: true, cost: true },
  });
  if (tracked.length === 0) return;
  const byId = new Map(tracked.map((s) => [s.id, s]));

  // Un mismo producto puede venir en dos renglones: se agrupa para dejar un
  // solo movimiento por producto y por venta.
  const qty = new Map<string, number>();
  for (const it of withService) {
    if (!byId.has(it.serviceId)) continue;
    qty.set(it.serviceId, (qty.get(it.serviceId) ?? 0) + it.quantity);
  }

  let cmv = 0;
  for (const [serviceId, q] of qty) {
    const svc = byId.get(serviceId)!;
    await applyStockChange({
      businessId: params.businessId,
      serviceId,
      kind: "venta",
      quantity: -q,
      unitCost: svc.cost,
      purchaseId: params.purchaseId,
    });
    if (svc.cost !== null) cmv += svc.cost * q;
  }

  if (cmv > 0) {
    await db.saleCost.create({
      data: {
        businessId: params.businessId,
        purchaseId: params.purchaseId,
        kind: "mercaderia",
        label: "Costo de mercadería",
        amount: round2(cmv),
        date: params.date,
      },
    });
  }
}
