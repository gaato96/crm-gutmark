"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentBusiness } from "@/lib/queries";
import { isItemKind, defaultItemKind } from "@/lib/rubros";
import { applyStockChange } from "@/lib/stock-write";

export interface ServiceFormState {
  error?: string;
  ok?: boolean;
}

function clean(v: FormDataEntryValue | null): string {
  return (v ?? "").toString().trim();
}

function parseForm(formData: FormData, catalogMode: string):
  | { error: string }
  | {
      data: {
        name: string;
        description: string;
        price: number;
        category: string;
        kind: string;
        recompraDays: number | null;
      };
    } {
  const name = clean(formData.get("name"));
  if (!name) return { error: "Poné un nombre para el servicio." };
  if (name.length > 80) return { error: "El nombre no puede pasar de 80 caracteres." };

  const price = parseFloat(clean(formData.get("price")) || "0");
  if (!Number.isFinite(price) || price < 0) {
    return { error: "El precio tiene que ser un número de 0 o más." };
  }

  // Vacío = "no sé cada cuánto vuelve"; la campaña cae al valor general de
  // Configuración. Cero no serviría: significaría "vuelve el mismo día".
  const rawDays = clean(formData.get("recompraDays"));
  let recompraDays: number | null = null;
  if (rawDays) {
    const n = parseInt(rawDays, 10);
    if (!Number.isFinite(n) || n < 1 || n > 3650) {
      return { error: "Los días de recompra tienen que estar entre 1 y 3650." };
    }
    recompraDays = n;
  }

  // El tipo solo lo elige el negocio que vende las dos cosas. En los demás lo
  // fija el modo, así un kiosco no puede terminar con "servicios" cargados.
  const kindRaw = clean(formData.get("kind"));
  const kind =
    catalogMode === "ambos" && isItemKind(kindRaw) ? kindRaw : defaultItemKind(catalogMode);

  return {
    data: {
      name,
      description: clean(formData.get("description")),
      price,
      category: clean(formData.get("category")),
      kind,
      recompraDays,
    },
  };
}

// Campos del módulo Stock que se editan desde el catálogo. Solo se leen si el
// negocio tiene el módulo: sin él, el formulario no los manda y no hay que
// pisar lo que hubiera quedado de cuando lo tenía.
function parseStock(formData: FormData):
  | { error: string }
  | {
      stock: { trackStock: boolean; minStock: number | null; cost: number | null; sku: string };
      initialStock: number;
    } {
  const minRaw = clean(formData.get("minStock"));
  const costRaw = clean(formData.get("cost"));
  const initRaw = clean(formData.get("initialStock"));
  const minStock = minRaw === "" ? null : parseInt(minRaw, 10);
  const cost = costRaw === "" ? null : parseFloat(costRaw);
  const initialStock = initRaw === "" ? 0 : parseInt(initRaw, 10);
  if (minStock !== null && (!Number.isFinite(minStock) || minStock < 0)) {
    return { error: "El stock mínimo tiene que ser 0 o más." };
  }
  if (cost !== null && (!Number.isFinite(cost) || cost < 0)) {
    return { error: "El costo tiene que ser 0 o más." };
  }
  if (!Number.isFinite(initialStock) || initialStock < 0) {
    return { error: "El stock inicial tiene que ser 0 o más." };
  }
  return {
    stock: {
      trackStock: formData.get("trackStock") === "on",
      minStock,
      cost,
      sku: clean(formData.get("sku")).slice(0, 40),
    },
    initialStock,
  };
}

function revalidate() {
  revalidatePath("/stock");
  revalidatePath("/catalogo");
  revalidatePath("/campanas");
  revalidatePath("/clientes");
}

export async function createService(
  _prev: ServiceFormState,
  formData: FormData
): Promise<ServiceFormState> {
  const biz = await getCurrentBusiness();
  const parsed = parseForm(formData, biz.catalogMode);
  if ("error" in parsed) return parsed;

  const withStock = biz.modules.includes("stock");
  const stock = withStock ? parseStock(formData) : null;
  if (stock && "error" in stock) return stock;

  const count = await db.service.count({ where: { businessId: biz.id } });
  if (count >= 200) {
    return { error: "Llegaste al máximo de 200 servicios." };
  }

  const created = await db.service.create({
    data: { businessId: biz.id, sortOrder: count, ...parsed.data, ...(stock?.stock ?? {}) },
    select: { id: true },
  });

  // El stock con que arranca entra como un movimiento y no escrito directo en
  // la columna: así el historial explica desde el primer día cuánto hay.
  if (stock && stock.stock.trackStock && stock.initialStock > 0) {
    await applyStockChange({
      businessId: biz.id,
      serviceId: created.id,
      kind: "ajuste",
      quantity: stock.initialStock,
      unitCost: stock.stock.cost,
      note: "Stock inicial",
    });
  }

  revalidate();
  return { ok: true };
}

export async function updateService(
  id: string,
  _prev: ServiceFormState,
  formData: FormData
): Promise<ServiceFormState> {
  const biz = await getCurrentBusiness();
  const parsed = parseForm(formData, biz.catalogMode);
  if ("error" in parsed) return parsed;

  // Pertenencia explícita: un Server Action es un endpoint POST direccionable.
  const owned = await db.service.findFirst({
    where: { id, businessId: biz.id },
    select: { id: true },
  });
  if (!owned) return { error: "Servicio no encontrado." };

  const stock = biz.modules.includes("stock") ? parseStock(formData) : null;
  if (stock && "error" in stock) return stock;

  await db.service.update({
    where: { id: owned.id },
    data: { ...parsed.data, ...(stock?.stock ?? {}) },
  });

  revalidate();
  return { ok: true };
}

export async function toggleService(id: string, active: boolean) {
  const biz = await getCurrentBusiness();
  const owned = await db.service.findFirst({
    where: { id, businessId: biz.id },
    select: { id: true },
  });
  if (!owned) throw new Error("Servicio no encontrado");

  await db.service.update({ where: { id: owned.id }, data: { active } });
  revalidate();
}

// Borrar de verdad solo si nunca se vendió. Si ya tiene ventas, se desactiva:
// borrarlo dejaría los renglones históricos sin nombre y arruinaría el reporte
// de "cuánto facturó cada servicio".
export async function deleteService(
  id: string
): Promise<{ deleted: boolean; deactivated: boolean }> {
  const biz = await getCurrentBusiness();
  const owned = await db.service.findFirst({
    where: { id, businessId: biz.id },
    select: { id: true },
  });
  if (!owned) throw new Error("Servicio no encontrado");

  const [sold, usedByCampaign, stockMoves] = await Promise.all([
    db.purchaseItem.count({ where: { serviceId: owned.id } }),
    db.campaign.count({ where: { serviceId: owned.id } }),
    // Con movimientos de stock tampoco se borra: se perdería el historial de
    // compras de mercadería (y con él, lo que se pagó desde la caja).
    db.stockMovement.count({ where: { serviceId: owned.id } }),
  ]);

  if (sold > 0 || usedByCampaign > 0 || stockMoves > 0) {
    await db.service.update({ where: { id: owned.id }, data: { active: false } });
    revalidate();
    return { deleted: false, deactivated: true };
  }

  await db.service.delete({ where: { id: owned.id } });
  revalidate();
  return { deleted: true, deactivated: false };
}

export interface SellableService {
  id: string;
  name: string;
  price: number;
  category: string;
  // Unidades en stock, solo si el negocio tiene el módulo y el producto lo
  // controla. Null = no se cuenta (un servicio, o sin módulo).
  stock: number | null;
  sku: string;
}

// Catálogo para el selector de venta. Va como Server Action y no como prop del
// layout porque el modal de venta rápida es client y se abre de a ratos: no
// tiene sentido cargar el catálogo en cada render de cada página del panel.
export async function listServicesForSale(): Promise<SellableService[]> {
  const biz = await getCurrentBusiness();
  const services = await db.service.findMany({
    where: { businessId: biz.id, active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, price: true, category: true, stock: true, trackStock: true, sku: true },
  });
  const withStock = biz.modules.includes("stock");
  return services.map((s) => ({
    id: s.id,
    name: s.name,
    price: s.price,
    category: s.category,
    sku: s.sku,
    stock: withStock && s.trackStock ? s.stock : null,
  }));
}
