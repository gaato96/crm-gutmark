"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  requireSuperAdmin,
  hashPassword,
  createSession,
  stopImpersonating,
} from "@/lib/auth";
import { createDefaultTemplates } from "@/lib/default-templates";
import { isModuleCode, MODULE_SEED } from "@/lib/modules";

export interface AdminFormState {
  error?: string;
  ok?: boolean;
}

function clean(v: FormDataEntryValue | null): string {
  return (v ?? "").toString().trim();
}

export async function createBusiness(
  _prev: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  await requireSuperAdmin();

  const businessName = clean(formData.get("businessName"));
  const rubro = clean(formData.get("rubro")) || "General";
  const ownerName = clean(formData.get("ownerName"));
  const email = clean(formData.get("email")).toLowerCase();
  const password = clean(formData.get("password"));

  if (!businessName) return { error: "Poné el nombre del negocio." };
  if (!email || !email.includes("@")) return { error: "Ingresá un email válido." };
  if (password.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres." };

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "Ya existe una cuenta con ese email." };

  const business = await db.business.create({
    data: { name: businessName, rubro },
  });
  await db.user.create({
    data: {
      email,
      name: ownerName || null,
      passwordHash: await hashPassword(password),
      businessId: business.id,
      role: "owner",
    },
  });
  await createDefaultTemplates(business.id);

  revalidatePath("/admin");
  redirect("/admin");
}

export async function toggleBusinessActive(businessId: string, active: boolean) {
  await requireSuperAdmin();
  await db.business.update({ where: { id: businessId }, data: { active } });
  revalidatePath("/admin");
}

// "Entrar como": crea una sesión para el dueño del negocio, guardando la sesión
// actual del superadmin para poder volver después.
export async function impersonateBusiness(businessId: string) {
  const admin = await requireSuperAdmin();

  const owner = await db.user.findFirst({
    where: { businessId, role: "owner" },
    orderBy: { createdAt: "asc" },
  });
  if (!owner) throw new Error("Este negocio todavía no tiene un usuario dueño.");

  const store = await cookies();
  const currentToken = store.get("gf_session")?.value;
  if (!currentToken) redirect("/login");

  await createSession(owner.id, currentToken);
  redirect("/dashboard");
}

export async function stopImpersonatingAction() {
  await stopImpersonating();
  redirect("/admin");
}

// --- Módulos por negocio ---------------------------------------------------

export async function setBusinessModule(businessId: string, code: string, enabled: boolean) {
  await requireSuperAdmin();
  if (!isModuleCode(code)) throw new Error("Código de módulo inválido.");

  await db.businessModule.upsert({
    where: { businessId_moduleCode: { businessId, moduleCode: code } },
    create: { businessId, moduleCode: code, enabled },
    update: { enabled },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/negocios/${businessId}`);
}

export async function setBusinessModulePrice(
  businessId: string,
  code: string,
  formData: FormData
) {
  await requireSuperAdmin();
  if (!isModuleCode(code)) throw new Error("Código de módulo inválido.");

  const raw = clean(formData.get("price"));
  const priceOverride = raw === "" ? null : parseFloat(raw);
  if (priceOverride !== null && (Number.isNaN(priceOverride) || priceOverride < 0)) {
    throw new Error("Precio inválido.");
  }

  await db.businessModule.upsert({
    where: { businessId_moduleCode: { businessId, moduleCode: code } },
    create: { businessId, moduleCode: code, enabled: false, priceOverride },
    update: { priceOverride },
  });

  revalidatePath(`/admin/negocios/${businessId}`);
}

// --- Catálogo de módulos ----------------------------------------------------

export async function updateModule(
  _prev: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  await requireSuperAdmin();

  const code = clean(formData.get("code"));
  if (!isModuleCode(code)) return { error: "Código de módulo inválido." };

  const name = clean(formData.get("name"));
  const description = clean(formData.get("description"));
  const monthlyPrice = parseFloat(clean(formData.get("monthlyPrice")) || "0");
  const available = formData.get("available") === "on";
  const sortOrder = parseInt(clean(formData.get("sortOrder")) || "0", 10);

  if (!name) return { error: "Poné un nombre para el módulo." };
  if (Number.isNaN(monthlyPrice) || monthlyPrice < 0) return { error: "Precio inválido." };

  await db.module.update({
    where: { code },
    data: { name, description, monthlyPrice, available, sortOrder: sortOrder || 0 },
  });

  revalidatePath("/admin/modulos");
  revalidatePath("/modulos");
  return {};
}

// Crea en el catálogo los módulos de MODULE_SEED que todavía no existan.
// No pisa nombre/precio/descripción de los que ya están (eso lo administra
// el superadmin desde /admin/modulos).
export async function syncModuleCatalog() {
  await requireSuperAdmin();

  for (const m of MODULE_SEED) {
    await db.module.upsert({
      where: { code: m.code },
      create: {
        code: m.code,
        name: m.name,
        description: m.description,
        monthlyPrice: m.monthlyPrice,
        sortOrder: m.sortOrder,
      },
      update: {},
    });
  }

  revalidatePath("/admin/modulos");
  revalidatePath("/modulos");
}

// --- Configuración de plataforma -------------------------------------------

export async function updatePlatformSettings(
  _prev: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  await requireSuperAdmin();

  const basePlanPrice = parseFloat(clean(formData.get("basePlanPrice")) || "0");
  const currency = clean(formData.get("currency")) || "ARS";
  const dueDay = parseInt(clean(formData.get("dueDay")) || "10", 10);
  const showPricesToOwner = formData.get("showPricesToOwner") === "on";

  if (Number.isNaN(basePlanPrice) || basePlanPrice < 0) {
    return { error: "El precio del plan base no es válido." };
  }
  if (Number.isNaN(dueDay) || dueDay < 1 || dueDay > 28) {
    return { error: "El día de vencimiento debe estar entre 1 y 28." };
  }

  await db.platformSetting.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", basePlanPrice, currency, dueDay, showPricesToOwner },
    update: { basePlanPrice, currency, dueDay, showPricesToOwner },
  });

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin");
  revalidatePath("/modulos");
  return { ok: true };
}

// --- Pagos -------------------------------------------------------------

export async function registerPayment(
  _prev: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  await requireSuperAdmin();

  const businessId = clean(formData.get("businessId"));
  const amount = parseFloat(clean(formData.get("amount")) || "0");
  const periodYear = parseInt(clean(formData.get("periodYear")) || "0", 10);
  const periodMonth = parseInt(clean(formData.get("periodMonth")) || "0", 10);
  const method = clean(formData.get("method"));
  const notes = clean(formData.get("notes"));

  if (!businessId) return { error: "Falta el negocio." };
  if (!amount || amount <= 0) return { error: "Ingresá un monto válido." };
  if (periodMonth < 1 || periodMonth > 12) return { error: "Mes de período inválido." };
  if (!periodYear) return { error: "Ingresá el año del período." };

  try {
    await db.payment.create({
      data: { businessId, amount, periodYear, periodMonth, method, notes: notes || null },
    });
  } catch {
    return { error: "Ya hay un pago registrado para ese negocio en ese período." };
  }

  revalidatePath(`/admin/negocios/${businessId}`);
  revalidatePath("/admin");
  return {};
}

export async function deletePayment(paymentId: string, businessId: string) {
  await requireSuperAdmin();
  await db.payment.delete({ where: { id: paymentId } });
  revalidatePath(`/admin/negocios/${businessId}`);
  revalidatePath("/admin");
}
