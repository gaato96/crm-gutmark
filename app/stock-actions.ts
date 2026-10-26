"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireModule } from "@/lib/module-guard";
import { applyStockChange } from "@/lib/stock-write";
import { currentCashSession } from "@/lib/cash-write";
import { signedAmount } from "@/lib/cash";
import { isStockKind, signedQuantity } from "@/lib/stock";
import { round2 } from "@/lib/sales";

export interface StockFormState {
  error?: string;
  ok?: boolean;
  message?: string;
}

function clean(v: FormDataEntryValue | null): string {
  return (v ?? "").toString().trim();
}

function revalidate() {
  revalidatePath("/stock");
  revalidatePath("/catalogo");
  revalidatePath("/caja");
  revalidatePath("/reportes");
  revalidatePath("/dashboard");
}

// Producto del negocio de la sesión. Un Server Action es un endpoint POST
// direccionable: el id que llega del cliente no alcanza para confiar en él.
async function ownedService(businessId: string, id: string) {
  return db.service.findFirst({
    where: { id, businessId },
    select: { id: true, name: true, stock: true, trackStock: true, cost: true },
  });
}

// --- Compra de mercadería ------------------------------------------------------

export interface PurchaseLineInput {
  serviceId: string;
  quantity: number;
  unitCost: number | null;
}

// Una compra a un proveedor puede traer varios productos en la misma factura.
// Se carga de una vez: un movimiento de stock por producto y, si se pagó con
// la plata del cajón, UN solo egreso de caja por el total — que es como lo
// cuenta el que hace el arqueo.
export async function registerStockPurchase(input: {
  lines: PurchaseLineInput[];
  supplier: string;
  note: string;
  payFromCash: boolean;
}): Promise<StockFormState> {
  const session = await requireModule("stock");
  const businessId = session.business.id;

  const lines = input.lines.filter((l) => l.serviceId && Number.isFinite(l.quantity) && l.quantity > 0);
  if (lines.length === 0) return { error: "Agregá al menos un producto con cantidad." };
  for (const l of lines) {
    if (!Number.isInteger(l.quantity) || l.quantity > 100000) {
      return { error: "Las cantidades tienen que ser números enteros." };
    }
    if (l.unitCost !== null && (!Number.isFinite(l.unitCost) || l.unitCost < 0)) {
      return { error: "El costo tiene que ser 0 o más." };
    }
  }

  const services = await db.service.findMany({
    where: { businessId, id: { in: lines.map((l) => l.serviceId) } },
    select: { id: true, name: true, trackStock: true },
  });
  const byId = new Map(services.map((s) => [s.id, s]));
  if (lines.some((l) => !byId.has(l.serviceId))) return { error: "Producto no encontrado." };

  const supplier = input.supplier.trim().slice(0, 80) || null;
  const note = input.note.trim().slice(0, 200) || null;
  const total = round2(lines.reduce((s, l) => s + (l.unitCost ?? 0) * l.quantity, 0));

  // El egreso solo tiene sentido con Caja contratada y abierta: el movimiento
  // de caja necesita una sesión donde colgarse (CashMovement.sessionId).
  let cashMovementId: string | null = null;
  if (input.payFromCash) {
    if (!session.business.modules.includes("caja") && session.role !== "superadmin") {
      return { error: "Para pagar desde la caja necesitás el módulo Caja." };
    }
    if (total <= 0) return { error: "Para pagar desde la caja, cargá el costo de cada producto." };
    const abierta = await currentCashSession(businessId);
    if (!abierta) return { error: "No hay una caja abierta. Abrila o desmarcá “Pagado con la caja”." };
    const detalle = lines.map((l) => `${byId.get(l.serviceId)!.name} ×${l.quantity}`).join(", ");
    const mov = await db.cashMovement.create({
      data: {
        businessId,
        sessionId: abierta.id,
        kind: "egreso",
        amount: signedAmount("egreso", total),
        paymentMethod: "efectivo",
        description: `Mercadería${supplier ? ` (${supplier})` : ""}: ${detalle}`.slice(0, 250),
      },
      select: { id: true },
    });
    cashMovementId = mov.id;
  }

  for (const l of lines) {
    await applyStockChange({
      businessId,
      serviceId: l.serviceId,
      kind: "compra",
      quantity: signedQuantity("compra", l.quantity),
      unitCost: l.unitCost,
      supplier,
      note,
      cashMovementId,
      userId: session.id,
    });
    // Cargar mercadería es lo que fija el costo actual: con eso se valúa lo
    // que se venda de acá en adelante. Además, quien carga stock de un
    // producto quiere que se controle, aunque se haya olvidado de marcarlo.
    await db.service.update({
      where: { id: l.serviceId },
      data: {
        trackStock: true,
        ...(l.unitCost !== null && l.unitCost > 0 ? { cost: l.unitCost } : {}),
      },
    });
  }

  revalidate();
  const unidades = lines.reduce((s, l) => s + l.quantity, 0);
  return {
    ok: true,
    message: `Entraron ${unidades} ${unidades === 1 ? "unidad" : "unidades"}${
      cashMovementId ? " y se registró el egreso en la caja" : ""
    }.`,
  };
}

// --- Merma, devolución y ajuste -----------------------------------------------

export async function registerStockAdjustment(
  _prev: StockFormState,
  formData: FormData
): Promise<StockFormState> {
  const session = await requireModule("stock");
  const businessId = session.business.id;

  const kind = clean(formData.get("kind"));
  if (!isStockKind(kind) || kind === "venta" || kind === "compra") {
    return { error: "Elegí un tipo de movimiento válido." };
  }

  const svc = await ownedService(businessId, clean(formData.get("serviceId")));
  if (!svc) return { error: "Elegí un producto." };

  const raw = parseInt(clean(formData.get("quantity")), 10);
  if (!Number.isFinite(raw)) return { error: "Escribí una cantidad." };

  let quantity: number;
  if (kind === "ajuste") {
    // En un conteo se escribe lo que HAY, no la diferencia: es lo que el
    // dueño tiene en la mano después de contar el estante.
    if (raw < 0) return { error: "Lo contado no puede ser negativo." };
    quantity = raw - svc.stock;
    if (quantity === 0) return { ok: true, message: "El stock ya era ese. No hubo cambios." };
  } else {
    if (raw <= 0) return { error: "La cantidad tiene que ser mayor a 0." };
    quantity = signedQuantity(kind, raw);
  }

  await applyStockChange({
    businessId,
    serviceId: svc.id,
    kind,
    quantity,
    unitCost: svc.cost,
    note: clean(formData.get("note")).slice(0, 200) || null,
    userId: session.id,
  });
  if (!svc.trackStock) {
    await db.service.update({ where: { id: svc.id }, data: { trackStock: true } });
  }

  revalidate();
  return {
    ok: true,
    message:
      kind === "ajuste"
        ? `Stock de ${svc.name} corregido a ${raw}.`
        : `Listo: ${svc.name} ${quantity > 0 ? "+" : ""}${quantity}.`,
  };
}

// --- Configuración de stock por producto --------------------------------------

export async function saveStockSettings(
  serviceId: string,
  _prev: StockFormState,
  formData: FormData
): Promise<StockFormState> {
  const session = await requireModule("stock");
  const svc = await ownedService(session.business.id, serviceId);
  if (!svc) return { error: "Producto no encontrado." };

  const minRaw = clean(formData.get("minStock"));
  const costRaw = clean(formData.get("cost"));
  const minStock = minRaw === "" ? null : parseInt(minRaw, 10);
  const cost = costRaw === "" ? null : parseFloat(costRaw);
  if (minStock !== null && (!Number.isFinite(minStock) || minStock < 0)) {
    return { error: "El mínimo tiene que ser 0 o más." };
  }
  if (cost !== null && (!Number.isFinite(cost) || cost < 0)) {
    return { error: "El costo tiene que ser 0 o más." };
  }

  await db.service.update({
    where: { id: svc.id },
    data: {
      trackStock: formData.get("trackStock") === "on",
      minStock,
      cost,
      sku: clean(formData.get("sku")).slice(0, 40),
    },
  });

  revalidate();
  return { ok: true };
}

// Activa el control de stock de varios productos de un saque (los productos
// del catálogo que todavía no lo tienen). Útil la primera vez que se contrata.
export async function enableStockTracking(serviceIds: string[]): Promise<number> {
  const session = await requireModule("stock");
  const res = await db.service.updateMany({
    where: { businessId: session.business.id, id: { in: serviceIds.slice(0, 500) } },
    data: { trackStock: true },
  });
  revalidate();
  return res.count;
}
