"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword, createSession, destroySession } from "@/lib/auth";

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

  // Plantillas por defecto para el negocio nuevo
  await db.template.createMany({
    data: [
      {
        businessId: business.id,
        type: "birthday",
        channel: "whatsapp",
        subject: "",
        body: "¡Hola {nombre}! 🎂 De parte de {negocio} te deseamos un muy feliz cumpleaños. Como regalo, tenés un beneficio especial en tu próxima compra esta semana. ¡Te esperamos! 💚",
      },
      {
        businessId: business.id,
        type: "birthday",
        channel: "email",
        subject: "🎂 ¡Feliz cumpleaños, {nombre}!",
        body: "¡Hola {nombre}!\n\nEn {negocio} queremos desearte un muy feliz cumpleaños. Para celebrarlo, te regalamos un beneficio especial en tu próxima compra durante esta semana.\n\n¡Te esperamos!\nEquipo de {negocio}",
      },
      {
        businessId: business.id,
        type: "winback",
        channel: "whatsapp",
        subject: "",
        body: "¡Hola {nombre}! 👋 Hace un tiempo que no te vemos por {negocio} y te extrañamos. Si venís esta semana, tenés un beneficio especial esperándote. 😊",
      },
      {
        businessId: business.id,
        type: "winback",
        channel: "email",
        subject: "Te extrañamos en {negocio} 💚",
        body: "¡Hola {nombre}!\n\nHace un tiempo que no pasás por {negocio}. Tenemos un beneficio especial reservado para vos si volvés esta semana.\n\n¡Nos encantaría verte de nuevo!\nEquipo de {negocio}",
      },
    ],
  });

  await createSession(user.id);
  redirect("/");
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = clean(formData.get("email")).toLowerCase();
  const password = clean(formData.get("password"));

  if (!email || !password) return { error: "Completá email y contraseña." };

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Email o contraseña incorrectos." };
  }

  await createSession(user.id);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
