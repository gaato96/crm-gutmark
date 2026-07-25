"use server";

import { db } from "@/lib/db";
import { getCurrentBusiness } from "@/lib/queries";
import { parseFlexibleDate } from "@/lib/csv";
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
  revalidatePath("/");
  redirect(`/clientes/${customer.id}`);
}

export async function updateCustomer(id: string, formData: FormData) {
  const name = str(formData.get("name"));
  if (!name) throw new Error("El nombre es obligatorio");

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
  revalidatePath("/");
  redirect(`/clientes/${id}`);
}

export async function deleteCustomer(id: string) {
  await db.customer.delete({ where: { id } });
  revalidatePath("/clientes");
  revalidatePath("/");
  redirect("/clientes");
}

export async function addPurchase(customerId: string, formData: FormData) {
  const biz = await getCurrentBusiness();
  const amount = parseFloat((formData.get("amount") ?? "0").toString());
  if (!amount || amount <= 0) throw new Error("El monto debe ser mayor a 0");
  const date = parseDate(formData.get("date")) ?? new Date();

  await db.purchase.create({
    data: {
      businessId: biz.id,
      customerId,
      amount,
      date,
      description: str(formData.get("description")),
    },
  });

  // Actualizar última compra si esta es más reciente
  const customer = await db.customer.findUnique({ where: { id: customerId } });
  if (customer && (!customer.lastPurchaseAt || date > customer.lastPurchaseAt)) {
    await db.customer.update({
      where: { id: customerId },
      data: { lastPurchaseAt: date },
    });
  }

  revalidatePath(`/clientes/${customerId}`);
  revalidatePath("/clientes");
  revalidatePath("/");
}

export async function logContact(
  customerId: string,
  reason: string,
  channel: string
) {
  const biz = await getCurrentBusiness();
  await db.contactLog.create({
    data: { businessId: biz.id, customerId, reason, channel },
  });
  revalidatePath("/recordatorios");
  revalidatePath(`/clientes/${customerId}`);
}

export async function updateBusiness(formData: FormData) {
  const biz = await getCurrentBusiness();
  await db.business.update({
    where: { id: biz.id },
    data: {
      name: str(formData.get("name")) ?? biz.name,
      rubro: str(formData.get("rubro")) ?? biz.rubro,
      inactivityDays: parseInt((formData.get("inactivityDays") ?? "60").toString()) || 60,
      recompraDays: parseInt((formData.get("recompraDays") ?? "45").toString()) || 45,
      vipMinSpend: parseFloat((formData.get("vipMinSpend") ?? "50000").toString()) || 50000,
    },
  });
  revalidatePath("/configuracion");
  revalidatePath("/");
  revalidatePath("/segmentos");
}

export async function saveTemplate(id: string, formData: FormData) {
  await db.template.update({
    where: { id },
    data: {
      subject: (formData.get("subject") ?? "").toString(),
      body: (formData.get("body") ?? "").toString(),
    },
  });
  revalidatePath("/campanas");
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
  revalidatePath("/");
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
export async function quickSale(
  customerId: string,
  amount: number,
  description?: string
): Promise<{ customerName: string }> {
  const biz = await getCurrentBusiness();
  if (!amount || amount <= 0) throw new Error("El monto debe ser mayor a 0");

  const customer = await db.customer.findFirst({
    where: { id: customerId, businessId: biz.id },
  });
  if (!customer) throw new Error("Cliente no encontrado");

  const date = new Date();
  await db.purchase.create({
    data: {
      businessId: biz.id,
      customerId,
      amount,
      date,
      description: description?.trim() || null,
    },
  });

  if (!customer.lastPurchaseAt || date > customer.lastPurchaseAt) {
    await db.customer.update({ where: { id: customerId }, data: { lastPurchaseAt: date } });
  }

  revalidatePath(`/clientes/${customerId}`);
  revalidatePath("/clientes");
  revalidatePath("/");
  revalidatePath("/segmentos");
  revalidatePath("/recordatorios");

  return { customerName: customer.name };
}

export interface QuickCustomerInput {
  name: string;
  phone?: string;
  amount: number;
  description?: string;
}

// Alta de cliente + primera venta en un solo paso (para clientes nuevos en el mostrador).
export async function quickNewCustomerSale(
  input: QuickCustomerInput
): Promise<{ customerId: string; customerName: string }> {
  const biz = await getCurrentBusiness();
  const name = input.name.trim();
  if (!name) throw new Error("El nombre es obligatorio");
  if (!input.amount || input.amount <= 0) throw new Error("El monto debe ser mayor a 0");

  const date = new Date();
  const customer = await db.customer.create({
    data: {
      businessId: biz.id,
      name,
      phone: input.phone?.trim() || null,
      lastPurchaseAt: date,
      purchases: {
        create: {
          businessId: biz.id,
          amount: input.amount,
          date,
          description: input.description?.trim() || null,
        },
      },
    },
  });

  revalidatePath("/clientes");
  revalidatePath("/");
  revalidatePath("/segmentos");

  return { customerId: customer.id, customerName: customer.name };
}
