"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  touchLastLogin,
  getSessionUser,
  getSessionToken,
  revokeOtherSessions,
} from "@/lib/auth";
import { createDefaultTemplates } from "@/lib/default-templates";

export interface AuthState {
  error?: string;
}

export interface ChangePasswordState {
  error?: string;
  ok?: boolean;
  closed?: number;
}

function clean(v: FormDataEntryValue | null): string {
  return (v ?? "").toString().trim();
}

export async function register(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const businessName = clean(formData.get("businessName"));
  const rubro = clean(formData.get("rubro")) || "General";
  const name = clean(formData.get("name"));
  const email = clean(formData.get("email")).toLowerCase();
  const password = clean(formData.get("password"));

  if (!businessName) return { error: "Poné el nombre de tu negocio." };
  if (!email || !email.includes("@")) return { error: "Ingresá un email válido." };
  if (password.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres." };

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "Ya existe una cuenta con ese email." };

  const business = await db.business.create({
    data: { name: businessName, rubro },
  });
  const user = await db.user.create({
    data: {
      email,
      name: name || null,
      passwordHash: await hashPassword(password),
      businessId: business.id,
    },
  });

  await createDefaultTemplates(business.id);
  await touchLastLogin(user.id);
  await createSession(user.id);
  redirect("/dashboard");
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = clean(formData.get("email")).toLowerCase();
  const password = clean(formData.get("password"));

  if (!email || !password) return { error: "Completá email y contraseña." };

  const user = await db.user.findUnique({ where: { email }, include: { business: true } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Email o contraseña incorrectos." };
  }
  if (!user.business.active && user.role !== "superadmin") {
    return { error: "Esta cuenta fue desactivada. Contactanos si creés que es un error." };
  }

  await touchLastLogin(user.id);
  await createSession(user.id);
  redirect(user.role === "superadmin" ? "/admin" : "/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export async function changePassword(
  _prev: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await getSessionUser();
  if (!session) return { error: "Tu sesión expiró. Volvé a iniciar sesión." };

  // Un superadmin "viendo la cuenta como" un negocio no debe poder tomar esa
  // cuenta cambiándole la contraseña.
  if (session.isImpersonating) {
    return {
      error:
        "No podés cambiar la contraseña mientras estás viendo la cuenta como administrador.",
    };
  }

  const currentPassword = clean(formData.get("currentPassword"));
  const newPassword = clean(formData.get("newPassword"));
  const confirmPassword = clean(formData.get("confirmPassword"));

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "Completá los tres campos." };
  }

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { passwordHash: true },
  });
  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
    return { error: "La contraseña actual no es correcta." };
  }

  if (newPassword.length < 8) {
    return { error: "La contraseña nueva debe tener al menos 8 caracteres." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "La confirmación no coincide con la contraseña nueva." };
  }
  if (newPassword === currentPassword) {
    return { error: "La contraseña nueva tiene que ser distinta de la actual." };
  }

  await db.user.update({
    where: { id: session.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  const currentToken = await getSessionToken();
  const closed = currentToken ? await revokeOtherSessions(session.id, currentToken) : 0;

  revalidatePath("/configuracion");
  revalidatePath("/admin/configuracion");
  return { ok: true, closed };
}
