import "server-only";
import { db } from "./db";
import type { CashMovementRow, SaleDetail } from "./cash";

// Lectura de los movimientos de una caja con el detalle de cada venta.
//
// El `CashMovement` de una venta guarda solo el importe y la descripción
// "Venta": el nombre del cliente y los ítems NO se copian ahí a propósito.
// A diferencia de `SaleCost`, que es una foto del momento porque una comisión
// ya devengada no puede cambiar si mañana se toca el porcentaje, acá lo que
// interesa es qué se vendió y a quién — y eso ya vive en `Purchase` con sus
// ítems, que sí son foto del momento (`PurchaseItem.name` / `unitPrice`).
// Copiarlo también en el movimiento sería duplicar el dato y dejar sin detalle
// a todas las ventas ya registradas.

// Movimientos de una caja, del más nuevo al más viejo, con el detalle de venta
// ya resuelto. Siempre escopeado por `businessId`: el id de la caja puede venir
// de un parámetro del cliente.
export async function sessionMovements(
  businessId: string,
  sessionId: string
): Promise<CashMovementRow[]> {
  const movimientos = await db.cashMovement.findMany({
    where: { businessId, sessionId },
    orderBy: { createdAt: "desc" },
  });

  const ventaIds = movimientos
    .filter((m) => m.kind === "venta" && m.purchaseId)
    .map((m) => m.purchaseId!);

  const detalle = await saleDetails(businessId, ventaIds);

  return movimientos.map((m) => ({
    id: m.id,
    kind: m.kind,
    amount: m.amount,
    paymentMethod: m.paymentMethod,
    description: m.description,
    createdAt: m.createdAt.toISOString(),
    venta: m.purchaseId ? (detalle.get(m.purchaseId) ?? null) : null,
  }));
}

async function saleDetails(
  businessId: string,
  purchaseIds: string[]
): Promise<Map<string, SaleDetail>> {
  if (purchaseIds.length === 0) return new Map();

  const purchases = await db.purchase.findMany({
    where: { businessId, id: { in: purchaseIds } },
    select: {
      id: true,
      subtotal: true,
      discount: true,
      discountNote: true,
      amount: true,
      description: true,
      customer: { select: { id: true, name: true } },
      employee: { select: { name: true } },
      items: {
        orderBy: { id: "asc" },
        select: { id: true, name: true, quantity: true, unitPrice: true, subtotal: true },
      },
    },
  });

  return new Map(
    purchases.map((p) => [
      p.id,
      {
        purchaseId: p.id,
        customerId: p.customer.id,
        customerName: p.customer.name,
        items: p.items,
        // Las ventas anteriores a los ítems tienen subtotal 0; ahí lo cobrado
        // es la única cifra real que hay.
        subtotal: p.subtotal || p.amount,
        discount: p.discount,
        discountNote: p.discountNote,
        total: p.amount,
        employeeName: p.employee?.name ?? null,
        note: p.description,
      },
    ])
  );
}
