"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSessionUser, requireSuperAdmin } from "@/lib/auth";
import {
  isFeedbackKind,
  isFeedbackStatus,
  MAX_SCREENSHOT_CHARS,
  type MyFeedbackRow,
} from "@/lib/feedback";

export interface FeedbackInput {
  kind: string;
  message: string;
  path: string;
  userAgent: string;
  viewport: string;
  screenshot?: string | null;
}

// Lo manda el dueño desde el panel. La pantalla, el dispositivo y la hora van
// solos: es lo que nadie sabe explicar por WhatsApp y lo que más sirve para
// reproducir un error.
export async function submitFeedback(input: FeedbackInput): Promise<{ ok: boolean; error?: string }> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: "Tu sesión expiró. Volvé a entrar." };

  const kind = isFeedbackKind(input.kind) ? input.kind : "problema";
  const message = (input.message ?? "").trim();
  if (message.length < 5) return { ok: false, error: "Contanos un poco más (al menos unas palabras)." };
  if (message.length > 4000) return { ok: false, error: "El mensaje es muy largo (máximo 4000 caracteres)." };

  let screenshot: string | null = null;
  if (input.screenshot) {
    // Solo imágenes en data URL, y con tope: es texto que va a la base.
    if (!/^data:image\/(png|jpeg|webp);base64,/.test(input.screenshot)) {
      return { ok: false, error: "La captura tiene que ser una imagen." };
    }
    if (input.screenshot.length > MAX_SCREENSHOT_CHARS) {
      return { ok: false, error: "La captura es muy pesada. Probá con otra." };
    }
    screenshot = input.screenshot;
  }

  await db.feedback.create({
    data: {
      businessId: session.business.id,
      userId: session.id,
      kind,
      message,
      path: (input.path ?? "").slice(0, 300),
      userAgent: (input.userAgent ?? "").slice(0, 400),
      viewport: (input.viewport ?? "").slice(0, 40),
      screenshot,
      fromImpersonation: session.isImpersonating,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/soporte");
  return { ok: true };
}

// Los reportes del negocio, para la lista del modal. Abrir la lista cuenta
// como "vi la respuesta": apaga el punto del botón. Mientras un superadmin
// suplanta no se marca nada, igual que con los recorridos guiados.
export async function listMyFeedback(): Promise<MyFeedbackRow[]> {
  const session = await getSessionUser();
  if (!session) return [];
  const rows = await db.feedback.findMany({
    where: { businessId: session.business.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, kind: true, message: true, status: true, reply: true, createdAt: true, repliedAt: true, seenAt: true },
  });
  if (!session.isImpersonating && rows.some((r) => r.repliedAt && !r.seenAt)) {
    await db.feedback.updateMany({
      where: { businessId: session.business.id, repliedAt: { not: null }, seenAt: null },
      data: { seenAt: new Date() },
    });
  }
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    message: r.message,
    status: r.status,
    reply: r.reply,
    createdAt: r.createdAt.toISOString(),
    repliedAt: r.repliedAt?.toISOString() ?? null,
  }));
}

// --- Superadmin ---------------------------------------------------------------

export async function setFeedbackStatus(id: string, status: string) {
  await requireSuperAdmin();
  if (!isFeedbackStatus(status)) throw new Error("Estado inválido.");
  await db.feedback.update({ where: { id }, data: { status } });
  revalidatePath("/admin/soporte");
  revalidatePath("/admin");
}

// Responder vuelve a prender el punto en el botón del dueño (seenAt en null),
// así se entera aunque ya hubiera visto una respuesta anterior.
export async function replyFeedback(id: string, reply: string, resolve: boolean) {
  await requireSuperAdmin();
  const text = reply.trim().slice(0, 4000);
  await db.feedback.update({
    where: { id },
    data: {
      reply: text || null,
      repliedAt: text ? new Date() : null,
      seenAt: null,
      ...(resolve ? { status: "resuelto" } : {}),
    },
  });
  revalidatePath("/admin/soporte");
  revalidatePath("/admin");
}
