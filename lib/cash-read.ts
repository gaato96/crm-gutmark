import "server-only";
import { db } from "./db";
import type { CashMovementRow, SaleDetail } from "./cash";
import type { Period } from "./cash";

// Lectura de ventas con su detalle: quién compró y qué se llevó.
//
// El `CashMovement` de una venta guarda solo el importe y la descripción
// "Venta": el nombre del cliente y los ítems NO se copian ahí a propósito.
// A diferencia de `SaleCost`, que es una foto del momento porque una comisión
// ya devengada no puede cambiar si mañana se toca el porcentaje, acá lo que
// interesa es qué se vendió y a quién — y eso ya vive en `Purchase` con sus
// ítems, que sí son foto del momento (`PurchaseItem.name` / `unitPrice`).
// Copiarlo también en el movimiento sería duplicar el dato y dejar sin detalle
// a todas las ventas ya registradas.

const SALE_SELECT = {
  id: true,
  date: true,
  paymentMethod: true,
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
} as const;

type PurchaseWithDetail = {
  id: string;
  date: Date;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  discountNote: string | null;
  amount: number;
  description: string | null;
  customer: { id: string; name: string };
  employee: { name: string } | null;
  items: { id: string; name: string; quantity: number; unitPrice: number; subtotal: number }[];
};

function toSaleDetail(p: PurchaseWithDetail): SaleDetail {
  return {
    purchaseId: p.id,
    customerId: p.customer.id,
    customerName: p.customer.name,
    date: p.date.toISOString(),
    paymentMethod: p.paymentMethod,
    items: p.items,
    // Las ventas anteriores a los ítems tienen subtotal 0; ahí lo cobrado es la
    // única cifra real que hay.
    subtotal: p.subtotal || p.amount,
    discount: p.discount,
    discountNote: p.discountNote,
    total: p.amount,
    employeeName: p.employee?.name ?? null,
    note: p.description,
  };
}

// --- Caja -------------------------------------------------------------------

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
    select: SALE_SELECT,
  });

  return new Map(purchases.map((p) => [p.id, toSaleDetail(p)]));
}

// --- Reportes ---------------------------------------------------------------

// Cuántas ventas del período se traen con detalle. Un mes cargado puede tener
// cientos: el resto de la pantalla ya son totales, y la lista está para revisar
// las últimas, no para leerlas todas de arriba a abajo.
export const SALES_DETAIL_LIMIT = 100;

// Las ventas del período, de la más nueva a la más vieja, con el mismo detalle
// que muestra Caja. No sale de `buildPeriodReport` a propósito: ese corre dos
// veces (período actual y anterior) y el anterior solo se usa para los deltas,
// así que meter la lista ahí duplicaría el payload al cliente para nada.
export async function periodSales(businessId: string, period: Period): Promise<SaleDetail[]> {
  const purchases = await db.purchase.findMany({
    where: { businessId, date: { gte: period.from, lt: period.to } },
    orderBy: { date: "desc" },
    take: SALES_DETAIL_LIMIT,
    select: SALE_SELECT,
  });

  return purchases.map(toSaleDetail);
}
