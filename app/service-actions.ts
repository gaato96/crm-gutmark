"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentBusiness } from "@/lib/queries";

export interface ServiceFormState {
  error?: string;
  ok?: boolean;
}

function clean(v: FormDataEntryValue | null): string {
  return (v ?? "").toString().trim();
}

function parseForm(formData: FormData):
  | { error: string }
  | {
      data: {
        name: string;
        description: string;
        price: number;
        category: string;
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

  return {
    data: {
      name,
      description: clean(formData.get("description")),
      price,
      category: clean(formData.get("category")),
      recompraDays,
    },
  };
}

function revalidate() {
  revalidatePath("/servicios");
  revalidatePath("/campanas");
  revalidatePath("/clientes");
}

export async function createService(
  _prev: ServiceFormState,
  formData: FormData
): Promise<ServiceFormState> {
  const biz = await getCurrentBusiness();
  const parsed = parseForm(formData);
  if ("error" in parsed) return parsed;

  const count = await db.service.count({ where: { businessId: biz.id } });
  if (count >= 200) {
    return { error: "Llegaste al máximo de 200 servicios." };
  }

  await db.service.create({
    data: { businessId: biz.id, sortOrder: count, ...parsed.data },
  });

  revalidate();
  return { ok: true };
}

export async function updateService(
  id: string,
  _prev: ServiceFormState,
  formData: FormData
): Promise<ServiceFormState> {
  const biz = await getCurrentBusiness();
  const parsed = parseForm(formData);
  if ("error" in parsed) return parsed;

  // Pertenencia explícita: un Server Action es un endpoint POST direccionable.
  const owned = await db.service.findFirst({
    where: { id, businessId: biz.id },
    select: { id: true },
  });
  if (!owned) return { error: "Servicio no encontrado." };

  await db.service.update({ where: { id: owned.id }, data: parsed.data });

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

  const [sold, usedByCampaign] = await Promise.all([
    db.purchaseItem.count({ where: { serviceId: owned.id } }),
    db.campaign.count({ where: { serviceId: owned.id } }),
  ]);

  if (sold > 0 || usedByCampaign > 0) {
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
}

// Catálogo para el selector de venta. Va como Server Action y no como prop del
// layout porque el modal de venta rápida es client y se abre de a ratos: no
// tiene sentido cargar el catálogo en cada render de cada página del panel.
export async function listServicesForSale(): Promise<SellableService[]> {
  const biz = await getCurrentBusiness();
  const services = await db.service.findMany({
    where: { businessId: biz.id, active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, price: true, category: true },
  });
  return services;
}
