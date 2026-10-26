import "server-only";
import { createHash, randomBytes } from "crypto";
import { db } from "./db";

// Links de "Olvidé mi contraseña". En la base se guarda el hash del token y no
// el token: quien lea la tabla no puede usar un link pendiente.

const VALID_MINUTES = 60;
// Un link generado por el superadmin se manda por WhatsApp y puede tardar en
// abrirse: dura un día en vez de una hora.
const ADMIN_VALID_MINUTES = 24 * 60;
const MAX_PER_HOUR = 3;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Devuelve el token en claro (para armar el link) o null si el usuario ya
// pidió demasiados en la última hora — así nadie puede inundar una casilla.
export async function createResetToken(
  userId: string,
  source: "self" | "admin" = "self"
): Promise<string | null> {
  if (source === "self") {
    const recent = await db.passwordReset.count({
      where: { userId, createdAt: { gte: new Date(Date.now() - 3600000) } },
    });
    if (recent >= MAX_PER_HOUR) return null;
  }
  const token = randomBytes(32).toString("hex");
  const minutes = source === "admin" ? ADMIN_VALID_MINUTES : VALID_MINUTES;
  await db.passwordReset.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      source,
      expiresAt: new Date(Date.now() + minutes * 60000),
    },
  });
  return token;
}

// El pedido vigente que corresponde a este token, o null si no existe, ya se
// usó o venció.
export async function findValidReset(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const row = await db.passwordReset.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  if (!row || row.usedAt || row.expiresAt < new Date()) return null;
  return row;
}

// Marca el link como usado (y de paso invalida los demás pendientes del mismo
// usuario: si pidió tres, con usar uno alcanza).
export async function consumeResets(userId: string): Promise<void> {
  await db.passwordReset.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });
}

export const RESET_VALID_MINUTES = VALID_MINUTES;
