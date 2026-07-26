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

export interface AdminFormState {
  error?: string;
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
