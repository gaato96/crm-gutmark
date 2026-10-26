"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";
import { getPlatformSettings } from "@/lib/platform";
import { createResetToken } from "@/lib/password-reset";
import { appUrl, emailConfigured } from "@/lib/email";
import { sendWeeklySummaries } from "@/lib/weekly-summary";
import {
  isCrmStage,
  isNoteKind,
  isAdminAudience,
  SUGGESTED_ADMIN_CAMPAIGNS,
} from "@/lib/admin-crm-meta";

export interface CrmFormState {
  error?: string;
  ok?: boolean;
}

const DAY = 86400000;

function clean(v: FormDataEntryValue | null): string {
  return (v ?? "").toString().trim();
}

function parseDay(v: string): Date | null {
  if (!v) return null;
  // Las fechas del CRM son días calendario: mediodía UTC para que no cambien
  // de día con la zona horaria de quien las mira.
  const d = new Date(`${v}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function revalidateCrm(businessId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/seguimiento");
  if (businessId) revalidatePath(`/admin/negocios/${businessId}`);
}

// Registrar un contacto agenda el próximo según PlatformSetting.followUpDays
// (14 por defecto): así el seguimiento quincenal se arma solo.
async function bumpFollowUp(businessId: string) {
  const { followUpDays } = await getPlatformSettings();
  await db.business.update({
    where: { id: businessId },
    data: { nextFollowUpAt: new Date(Date.now() + followUpDays * DAY) },
  });
}

// --- Ficha del negocio ------------------------------------------------------------

export async function updateBusinessCrm(
  businessId: string,
  _prev: CrmFormState,
  formData: FormData
): Promise<CrmFormState> {
  await requireSuperAdmin();
  const stage = clean(formData.get("crmStage"));
  if (!isCrmStage(stage)) return { error: "Elegí una etapa válida." };

  await db.business.update({
    where: { id: businessId },
    data: {
      crmStage: stage,
      isFounder: formData.get("isFounder") === "on",
      trialEndsAt: parseDay(clean(formData.get("trialEndsAt"))),
      nextFollowUpAt: parseDay(clean(formData.get("nextFollowUpAt"))),
      phone: clean(formData.get("phone")).slice(0, 30) || null,
    },
  });
  revalidateCrm(businessId);
  return { ok: true };
}

export async function addAdminNote(
  businessId: string,
  _prev: CrmFormState,
  formData: FormData
): Promise<CrmFormState> {
  const admin = await requireSuperAdmin();
  const kind = clean(formData.get("kind")) || "nota";
  if (!isNoteKind(kind)) return { error: "Tipo inválido." };
  const body = clean(formData.get("body")).slice(0, 4000);
  if (!body) return { error: "Escribí qué pasó." };

  await db.adminNote.create({ data: { businessId, kind, body, authorId: admin.id } });
  // Una nota interna no es un contacto con el negocio; una llamada o un
  // WhatsApp sí, y corren el próximo seguimiento.
  if (kind !== "nota") await bumpFollowUp(businessId);
  revalidateCrm(businessId);
  return { ok: true };
}

export async function deleteAdminNote(id: string, businessId: string) {
  await requireSuperAdmin();
  await db.adminNote.deleteMany({ where: { id, businessId } });
  revalidateCrm(businessId);
}

// Posterga el seguimiento sin registrar contacto ("lo llamo el jueves").
export async function snoozeFollowUp(businessId: string, days: number) {
  await requireSuperAdmin();
  const d = Math.min(Math.max(Math.round(days), 1), 90);
  await db.business.update({
    where: { id: businessId },
    data: { nextFollowUpAt: new Date(Date.now() + d * DAY) },
  });
  revalidateCrm(businessId);
}

// Link de "elegí una contraseña nueva" para mandarle al dueño por WhatsApp.
// Es la salida cuando no hay email configurado o el email no le llega.
export async function generateResetLink(businessId: string): Promise<{ link?: string; error?: string }> {
  await requireSuperAdmin();
  const owner = await db.user.findFirst({
    where: { businessId, role: "owner" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!owner) return { error: "Este negocio no tiene un usuario dueño." };
  const token = await createResetToken(owner.id, "admin");
  if (!token) return { error: "No se pudo generar el link." };
  return { link: `${await appUrl()}/restablecer?token=${token}` };
}

// --- Campañas del equipo -------------------------------------------------------

export async function saveAdminCampaign(
  id: string | null,
  _prev: CrmFormState,
  formData: FormData
): Promise<CrmFormState> {
  await requireSuperAdmin();
  const name = clean(formData.get("name")).slice(0, 80);
  const audience = clean(formData.get("audience"));
  const message = clean(formData.get("message")).slice(0, 2000);
  const everyDays = parseInt(clean(formData.get("everyDays")) || "14", 10);
  if (!name) return { error: "Poné un nombre." };
  if (!isAdminAudience(audience)) return { error: "Elegí a quién le llega." };
  if (!message) return { error: "Escribí el mensaje." };
  if (!Number.isFinite(everyDays) || everyDays < 1 || everyDays > 365) {
    return { error: "La frecuencia tiene que estar entre 1 y 365 días." };
  }
  const data = { name, audience, message, everyDays, active: formData.get("active") !== "off" };
  if (id) await db.adminCampaign.update({ where: { id }, data });
  else await db.adminCampaign.create({ data: { ...data, sortOrder: await db.adminCampaign.count() } });
  revalidateCrm();
  return { ok: true };
}

export async function toggleAdminCampaign(id: string, active: boolean) {
  await requireSuperAdmin();
  await db.adminCampaign.update({ where: { id }, data: { active } });
  revalidateCrm();
}

export async function deleteAdminCampaign(id: string) {
  await requireSuperAdmin();
  await db.adminCampaign.delete({ where: { id } });
  revalidateCrm();
}

export async function createSuggestedAdminCampaigns(): Promise<number> {
  await requireSuperAdmin();
  const existing = new Set((await db.adminCampaign.findMany({ select: { name: true } })).map((c) => c.name));
  let n = await db.adminCampaign.count();
  let created = 0;
  for (const c of SUGGESTED_ADMIN_CAMPAIGNS) {
    if (existing.has(c.name)) continue;
    await db.adminCampaign.create({ data: { ...c, sortOrder: n++ } });
    created++;
  }
  revalidateCrm();
  return created;
}

// Se tocó WhatsApp (o "Ya lo envié") para un negocio desde una campaña: queda
// en su historial y corre el próximo seguimiento.
export async function markAdminCampaignSent(campaignId: string, businessId: string, body: string) {
  const admin = await requireSuperAdmin();
  const campaign = await db.adminCampaign.findUnique({ where: { id: campaignId }, select: { name: true } });
  if (!campaign) throw new Error("Campaña no encontrada.");
  await db.adminNote.create({
    data: {
      businessId,
      kind: "campana",
      campaignId,
      authorId: admin.id,
      body: `${campaign.name}: ${body}`.slice(0, 4000),
    },
  });
  await bumpFollowUp(businessId);
  revalidateCrm(businessId);
}

export async function updateFollowUpDays(days: number) {
  await requireSuperAdmin();
  const d = Math.min(Math.max(Math.round(days), 1), 90);
  await db.platformSetting.update({ where: { id: "singleton" }, data: { followUpDays: d } });
  revalidateCrm();
}

// Manda ya los resúmenes semanales que estén pendientes (los mismos que manda
// el cron de los lunes). Sirve para probar el email sin esperar al lunes.
export async function sendWeeklySummariesNow(): Promise<{ sent: number; skipped: number; pending: number; error?: string }> {
  await requireSuperAdmin();
  if (!emailConfigured()) return { sent: 0, skipped: 0, pending: 0, error: "Falta RESEND_API_KEY en el entorno." };
  return sendWeeklySummaries();
}
