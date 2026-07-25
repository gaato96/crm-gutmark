import "server-only";
import { cookies } from "next/headers";
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

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.session.create({ data: { token, userId, expiresAt } });

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

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  business: {
    id: string;
    name: string;
    rubro: string;
    inactivityDays: number;
    recompraDays: number;
    vipMinSpend: number;
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
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    business: {
      id: user.business.id,
      name: user.business.name,
      rubro: user.business.rubro,
      inactivityDays: user.business.inactivityDays,
      recompraDays: user.business.recompraDays,
      vipMinSpend: user.business.vipMinSpend,
    },
  };
}
