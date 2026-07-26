import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "./db";

const COOKIE = "gf_session";
const SESSION_DAYS = 30;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// impersonatorToken: si un superadmin está "entrando como" este usuario, se guarda
// su propio token de sesión acá para poder volver al panel de admin después.
export async function createSession(
  userId: string,
  impersonatorToken?: string
): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.session.create({
    data: { token, userId, expiresAt, impersonatorToken: impersonatorToken ?? null },
  });

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { token } });
    store.delete(COOKIE);
  }
}

// Termina la sesión de impersonación actual y vuelve a la sesión original del
// superadmin (si la actual no es una impersonación, no hace nada).
export async function stopImpersonating(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return false;

  const session = await db.session.findUnique({ where: { token } });
  if (!session?.impersonatorToken) return false;

  const originalToken = session.impersonatorToken;
  const original = await db.session.findUnique({ where: { token: originalToken } });

  await db.session.delete({ where: { token } });

  if (!original || original.expiresAt < new Date()) {
    store.delete(COOKIE);
    return false;
  }

  store.set(COOKIE, originalToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: original.expiresAt,
  });
  return true;
}

export async function touchLastLogin(userId: string): Promise<void> {
  await db.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
}

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isImpersonating: boolean;
  business: {
    id: string;
    name: string;
    rubro: string;
    inactivityDays: number;
    recompraDays: number;
    vipMinSpend: number;
    active: boolean;
  };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: { user: { include: { business: true } } },
  });

  if (!session || session.expiresAt < new Date()) return null;

  const { user } = session;

  // Negocio desactivado: se corta la sesión para cualquier usuario que no sea superadmin.
  if (!user.business.active && user.role !== "superadmin") return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isImpersonating: !!session.impersonatorToken,
    business: {
      id: user.business.id,
      name: user.business.name,
      rubro: user.business.rubro,
      inactivityDays: user.business.inactivityDays,
      recompraDays: user.business.recompraDays,
      vipMinSpend: user.business.vipMinSpend,
      active: user.business.active,
    },
  };
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session || session.role !== "superadmin") redirect("/login");
  return session;
}
