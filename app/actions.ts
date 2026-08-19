"use server";

import { db } from "@/lib/db";
import { getCurrentBusiness } from "@/lib/queries";
import { parseFlexibleDate } from "@/lib/csv";
import { recordSale } from "@/lib/sale-write";
import { isRubroCode, modeForRubro } from "@/lib/rubros";
import type { SaleItemInput } from "@/lib/sales";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function str(v: FormDataEntryValue | null): string | null {
  const s = (v ?? "").toString().trim();
  return s.length ? s : null;
}

function parseDate(v: FormDataEntryValue | null): Date | null {
  const s = str(v);
  if (!s) return null;
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

export async function createCustomer(formData: FormData) {
  const biz = await getCurrentBusiness();
  const name = str(formData.get("name"));
  if (!name) throw new Error("El nombre es obligatorio");

  const customer = await db.customer.create({
    data: {
      businessId: biz.id,
      name,
      phone: str(formData.get("phone")),
      email: str(formData.get("email")),
      birthdate: parseDate(formData.get("birthdate")),
      notes: str(formData.get("notes")),
      tags: str(formData.get("tags")) ?? "",
    },
  });

  revalidatePath("/clientes");
  revalidatePath("/dashboard");
  redirect(`/clientes/${customer.id}`);
}

export async function updateCustomer(id: string, formData: FormData) {
  const biz = await getCurrentBusiness();
  const name = str(formData.get("name"));
  if (!name) throw new Error("El nombre es obligatorio");

  // Un Server Action es un endpoint POST direccionable: sin este chequeo,
  // cualquier sesión válida podría editar el cliente de otro negocio pasando
  // su id. `updateMany` con businessId no alcanza porque después redirigimos
  // a la ficha, así que confirmamos la pertenencia primero.
  const owned = await db.customer.findFirst({
    where: { id, businessId: biz.id },
    select: { id: true },
  });
  if (!owned) throw new Error("Cliente no encontrado");

  await db.customer.update({
    where: { id },
    data: {
      name,
      phone: str(formData.get("phone")),
      email: str(formData.get("email")),
      birthdate: parseDate(formData.get("birthdate")),
      notes: str(formData.get("notes")),
      tags: str(formData.get("tags")) ?? "",
    },
  });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  revalidatePath("/dashboard");
  redirect(`/clientes/${id}`);
}

export async function deleteCustomer(id: string) {
  const biz = await getCurrentBusiness();
  // deleteMany + businessId: si el id es de otro negocio no borra nada, en
  // lugar de borrarlo. Un `delete` por id suelto sería un IDOR destructivo.
  await db.customer.deleteMany({ where: { id, businessId: biz.id } });
  revalidatePath("/clientes");
  revalidatePath("/dashboard");
  redirect("/clientes");
}

export async function addPurchase(customerId: string, formData: FormData) {
  const biz = await getCurrentBusiness();

  const owned = await db.customer.findFirst({
    where: { id: customerId, businessId: biz.id },
    select: { id: true },
  });
  if (!owned) throw new Error("Cliente no encontrado");

  // Los renglones viajan como JSON en un campo oculto: son una lista de largo
  // variable y el FormData plano no la representa bien.
  let items: SaleItemInput[] = [];
  const rawItems = str(formData.get("items"));
  if (rawItems) {
    try {
      const parsed = JSON.parse(rawItems);
      if (Array.isArray(parsed)) items = parsed as SaleItemInput[];
    } catch {
      // Un JSON roto no debe tirar la venta: se sigue con el monto suelto.
    }
  }

  const freeAmount = parseFloat((formData.get("amount") ?? "0").toString());
  const discount = parseFloat((formData.get("discount") ?? "0").toString()) || 0;

  await recordSale({
    businessId: biz.id,
    customerId,
    items,
    freeAmount: Number.isFinite(freeAmount) ? freeAmount : null,
    discount,
    discountNote: str(formData.get("discountNote")),
    paymentMethod: (formData.get("paymentMethod") ?? "").toString(),
    employeeId: str(formData.get("employeeId")),
    date: parseDate(formData.get("date")) ?? new Date(),
    description: str(formData.get("description")),
  });

  revalidatePath(`/clientes/${customerId}`);
  revalidatePath("/clientes");
  revalidatePath("/dashboard");
  revalidatePath("/recordatorios");
}

export async function logContact(
  customerId: string,
  reason: string,
  channel: string,
  campaignId?: string
) {
  const biz = await getCurrentBusiness();

  const owned = await db.customer.findFirst({
    where: { id: customerId, businessId: biz.id },
    select: { id: true },
  });
  if (!owned) throw new Error("Cliente no encontrado");

  // La campaña también se valida: si no es de este negocio, se registra el
  // contacto sin asociarlo en vez de fallar — lo importante es no perder el
  // registro de que ya se contactó a esa persona.
  let linkedCampaignId: string | null = null;
  if (campaignId) {
    const campaign = await db.campaign.findFirst({
      where: { id: campaignId, businessId: biz.id },
      select: { id: true },
    });
    linkedCampaignId = campaign?.id ?? null;
  }

  await db.contactLog.create({
    data: { businessId: biz.id, customerId, reason, channel, campaignId: linkedCampaignId },
  });
  revalidatePath("/recordatorios");
  revalidatePath(`/clientes/${customerId}`);
}

export async function updateBusiness(formData: FormData) {
  const biz = await getCurrentBusiness();

  const rubroRaw = str(formData.get("rubro"));
  const rubro = rubroRaw && isRubroCode(rubroRaw) ? rubroRaw : biz.rubro;

  // El modo sigue al rubro solo si nadie lo tocó a mano. Si el superadmin lo
  // forzó (una barbería que solo quiere ver servicios), cambiar el rubro no le
  // pisa esa decisión.
  const modoActual = await db.business.findUnique({
    where: { id: biz.id },
    select: { catalogMode: true, rubro: true },
  });
  const fueForzado =
    modoActual !== null && modoActual.catalogMode !== modeForRubro(modoActual.rubro);
  const catalogMode = fueForzado ? modoActual!.catalogMode : modeForRubro(rubro);

  await db.business.update({
    where: { id: biz.id },
    data: {
      name: str(formData.get("name")) ?? biz.name,
      rubro,
      catalogMode,
      inactivityDays: parseInt((formData.get("inactivityDays") ?? "60").toString()) || 60,
      recompraDays: parseInt((formData.get("recompraDays") ?? "45").toString()) || 45,
      vipMinSpend: parseFloat((formData.get("vipMinSpend") ?? "50000").toString()) || 50000,
    },
  });
  revalidatePath("/configuracion");
  revalidatePath("/dashboard");
  revalidatePath("/segmentos");
  revalidatePath("/catalogo");
}

export interface ImportRow {
  name: string;
  phone?: string;
  email?: string;
  birthdate?: string;
  tags?: string;
  notes?: string;
}

export async function importCustomers(
  rows: ImportRow[]
): Promise<{ created: number; skipped: number }> {
  const biz = await getCurrentBusiness();

  // Duplicados: por teléfono o email ya existentes
  const existing = await db.customer.findMany({
    where: { businessId: biz.id },
    select: { phone: true, email: true },
  });
  const phones = new Set(existing.map((e) => e.phone).filter(Boolean) as string[]);
  const emails = new Set(
    existing.map((e) => (e.email ? e.email.toLowerCase() : null)).filter(Boolean) as string[]
  );

  let created = 0;
  let skipped = 0;

  for (const r of rows) {
    const name = (r.name ?? "").trim();
    if (!name) {
      skipped++;
      continue;
    }
    const phone = (r.phone ?? "").replace(/\s+/g, "").trim() || null;
    const email = (r.email ?? "").trim().toLowerCase() || null;

    if ((phone && phones.has(phone)) || (email && emails.has(email))) {
      skipped++;
      continue;
    }

    await db.customer.create({
      data: {
        businessId: biz.id,
        name,
        phone,
        email,
        birthdate: parseFlexibleDate(r.birthdate),
        tags: (r.tags ?? "").trim(),
        notes: (r.notes ?? "").trim() || null,
      },
    });
    if (phone) phones.add(phone);
    if (email) emails.add(email);
    created++;
  }

  revalidatePath("/clientes");
  revalidatePath("/dashboard");
  revalidatePath("/segmentos");
  return { created, skipped };
}

export interface CustomerSearchResult {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  lastPurchaseAt: string | null;
}

// Búsqueda liviana para la paleta de "Nueva venta" (menor cantidad de clics posible).
export async function searchCustomers(query: string): Promise<CustomerSearchResult[]> {
  const biz = await getCurrentBusiness();
  const q = query.trim();

  const customers = await db.customer.findMany({
    where: {
      businessId: biz.id,
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { phone: { contains: q } },
              { email: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { lastPurchaseAt: "desc" },
    take: 8,
    select: { id: true, name: true, phone: true, email: true, lastPurchaseAt: true },
  });

  return customers.map((c) => ({
    ...c,
    lastPurchaseAt: c.lastPurchaseAt ? c.lastPurchaseAt.toISOString() : null,
  }));
}

// Registrar una venta en el mínimo de pasos: elegir cliente + monto, sin salir de la pantalla actual.
// Lo que manda el modal de venta rápida. Los renglones ya vienen elegidos del
// catálogo (o escritos a mano); el precio final lo recalcula el server.
export interface QuickSaleInput {
  customerId: string;
  employeeId?: string;
  items?: SaleItemInput[];
  // Venta de monto suelto, cuando el negocio todavía no cargó servicios.
  amount?: number;
  discount?: number;
  discountNote?: string;
  paymentMethod?: string;
  description?: string;
}

export async function quickSale(
  input: QuickSaleInput
): Promise<{ customerName: string; total: number }> {
  const biz = await getCurrentBusiness();

  const customer = await db.customer.findFirst({
    where: { id: input.customerId, businessId: biz.id },
    select: { id: true, name: true },
  });
  if (!customer) throw new Error("Cliente no encontrado");

  const sale = await recordSale({
    businessId: biz.id,
    customerId: customer.id,
    items: input.items ?? [],
    freeAmount: input.amount ?? null,
    discount: input.discount ?? 0,
    discountNote: input.discountNote ?? null,
    paymentMethod: input.paymentMethod,
    employeeId: input.employeeId ?? null,
    description: input.description ?? null,
  });

  revalidatePath(`/clientes/${customer.id}`);
  revalidatePath("/clientes");
  revalidatePath("/dashboard");
  revalidatePath("/segmentos");
  revalidatePath("/recordatorios");

  return { customerName: customer.name, total: sale.total };
}

export interface QuickCustomerInput {
  name: string;
  phone?: string;
  employeeId?: string;
  items?: SaleItemInput[];
  amount?: number;
  discount?: number;
  discountNote?: string;
  paymentMethod?: string;
  description?: string;
}

// Alta de cliente + primera venta en un solo paso (para clientes nuevos en el mostrador).
export async function quickNewCustomerSale(
  input: QuickCustomerInput
): Promise<{ customerId: string; customerName: string; total: number }> {
  const biz = await getCurrentBusiness();
  const name = input.name.trim();
  if (!name) throw new Error("El nombre es obligatorio");

  // Se valida ANTES de crear el cliente: si la venta se rechazara después, el
  // alta ya estaría hecha y quedaría un cliente fantasma sin compras.
  const hasItems = (input.items ?? []).length > 0;
  const hasAmount = Number.isFinite(input.amount) && (input.amount ?? 0) > 0;
  if (!hasItems && !hasAmount) {
    throw new Error("Elegí al menos un servicio o poné un monto mayor a 0");
  }

  const customer = await db.customer.create({
    data: {
      businessId: biz.id,
      name,
      phone: input.phone?.trim() || null,
    },
    select: { id: true, name: true },
  });

  // La venta va por el mismo camino que todas: así el cliente nuevo arranca
  // con renglones, método de pago y puntos igual que uno ya existente.
  const sale = await recordSale({
    businessId: biz.id,
    customerId: customer.id,
    items: input.items ?? [],
    freeAmount: input.amount ?? null,
    discount: input.discount ?? 0,
    discountNote: input.discountNote ?? null,
    paymentMethod: input.paymentMethod,
    employeeId: input.employeeId ?? null,
    description: input.description ?? null,
  });

  revalidatePath("/clientes");
  revalidatePath("/dashboard");
  revalidatePath("/segmentos");

  return { customerId: customer.id, customerName: customer.name, total: sale.total };
}
