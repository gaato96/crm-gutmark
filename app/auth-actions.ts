"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  touchLastLogin,
} from "@/lib/auth";
import { createDefaultTemplates } from "@/lib/default-templates";

export interface AuthState {
  error?: string;
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
