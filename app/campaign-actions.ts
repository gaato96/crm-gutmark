"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentBusiness } from "@/lib/queries";
import { isTriggerType, TRIGGER_META } from "@/lib/campaigns";
import { SEGMENT_META } from "@/lib/segmentation";

export interface CampaignFormState {
  error?: string;
  ok?: boolean;
}

function clean(v: FormDataEntryValue | null): string {
  return (v ?? "").toString().trim();
}

function optionalInt(v: FormDataEntryValue | null): number | null {
  const s = clean(v);
  if (!s) return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function optionalFloat(v: FormDataEntryValue | null): number | null {
  const s = clean(v);
  if (!s) return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

interface TextFields {
  name: string;
  description: string;
  whatsappBody: string;
  emailSubject: string;
  emailBody: string;
}

interface TriggerFields {
  triggerType: string;
  triggerDays: number | null;
  segment: string | null;
  minSpend: number | null;
  excludeInactive: boolean;
}

// El nombre y los mensajes: lo único editable en una campaña de fábrica.
// Devuelve el error como string para mostrarlo en el form (useActionState) en
// vez de tirar.
function parseText(formData: FormData): { error: string } | { data: TextFields } {
  const name = clean(formData.get("name"));
  if (!name) return { error: "Poné un nombre para la campaña." };
  if (name.length > 60) return { error: "El nombre no puede pasar de 60 caracteres." };

  const whatsappBody = clean(formData.get("whatsappBody"));
  const emailSubject = clean(formData.get("emailSubject"));
  const emailBody = clean(formData.get("emailBody"));
  if (!whatsappBody && !emailBody) {
    return { error: "Escribí al menos el mensaje de WhatsApp o el del email." };
  }

  return {
    data: {
      name,
      description: clean(formData.get("description")),
      whatsappBody,
      emailSubject,
      emailBody,
    },
  };
}

// El disparador. Se parsea aparte porque en una campaña de fábrica el editor
// deshabilita esos controles —y un control deshabilitado NO viaja en el
// FormData—, así que pedirlos siempre haría imposible guardar esas campañas.
// Además el server no debería confiar en un disparador mandado por el cliente
// para una campaña cuyo disparador justamente no se puede cambiar.
function parseTrigger(formData: FormData): { error: string } | { data: TriggerFields } {
  const triggerType = clean(formData.get("triggerType"));
  if (!isTriggerType(triggerType)) return { error: "Elegí un disparador válido." };

  const meta = TRIGGER_META[triggerType];
  const days = optionalInt(formData.get("triggerDays"));
  const segment = clean(formData.get("segment"));
  const minSpend = optionalFloat(formData.get("minSpend"));

  if (meta.field === "days" && days !== null && (days < 0 || days > 3650)) {
    return { error: "Los días tienen que estar entre 0 y 3650." };
  }
  if (meta.field === "segment" && !(segment in SEGMENT_META)) {
    return { error: "Elegí un segmento válido." };
  }
  if (meta.field === "amount" && (minSpend === null || minSpend < 0)) {
    return { error: "Poné un monto válido para el gasto acumulado." };
  }

  return {
    data: {
      triggerType,
      // Solo se guarda el campo que el disparador usa; el resto va a null para
      // que no queden valores viejos decidiendo audiencias de forma invisible.
      triggerDays: meta.field === "days" ? days : null,
      segment: meta.field === "segment" ? segment : null,
      minSpend: meta.field === "amount" ? minSpend : null,
      excludeInactive: clean(formData.get("excludeInactive")) === "on",
    },
  };
}

function revalidate() {
  revalidatePath("/campanas");
  revalidatePath("/recordatorios");
  revalidatePath("/dashboard");
}

export async function createCampaign(
  _prev: CampaignFormState,
  formData: FormData
): Promise<CampaignFormState> {
  const biz = await getCurrentBusiness();
  const text = parseText(formData);
  if ("error" in text) return text;
  const trigger = parseTrigger(formData);
  if ("error" in trigger) return trigger;

  const count = await db.campaign.count({ where: { businessId: biz.id } });
  if (count >= 30) {
    return { error: "Llegaste al máximo de 30 campañas. Borrá alguna para crear otra." };
  }

  await db.campaign.create({
    data: { businessId: biz.id, sortOrder: count, ...text.data, ...trigger.data },
  });

  revalidate();
  return { ok: true };
}

export async function updateCampaign(
  id: string,
  _prev: CampaignFormState,
  formData: FormData
): Promise<CampaignFormState> {
  const biz = await getCurrentBusiness();

  // Pertenencia explícita: `update` por id solo sería un IDOR entre negocios.
  const existing = await db.campaign.findFirst({
    where: { id, businessId: biz.id },
    select: { id: true, builtin: true },
  });
  if (!existing) return { error: "Campaña no encontrada." };

  const text = parseText(formData);
  if ("error" in text) return text;

  // El disparador de una campaña de fábrica no se toca: el resto de la app la
  // busca por `builtin` esperando esa semántica (la ficha de cliente sugiere
  // el saludo de cumpleaños cuando se acerca la fecha). El texto sí es editable.
  if (existing.builtin) {
    await db.campaign.update({ where: { id: existing.id }, data: text.data });
    revalidate();
    return { ok: true };
  }

  const trigger = parseTrigger(formData);
  if ("error" in trigger) return trigger;

  await db.campaign.update({
    where: { id: existing.id },
    data: { ...text.data, ...trigger.data },
  });

  revalidate();
  return { ok: true };
}

export async function toggleCampaign(id: string, active: boolean) {
  const biz = await getCurrentBusiness();
  const existing = await db.campaign.findFirst({
    where: { id, businessId: biz.id },
    select: { id: true },
  });
  if (!existing) throw new Error("Campaña no encontrada");

  await db.campaign.update({ where: { id: existing.id }, data: { active } });
  revalidate();
}

export async function deleteCampaign(id: string) {
  const biz = await getCurrentBusiness();
  const existing = await db.campaign.findFirst({
    where: { id, businessId: biz.id },
    select: { id: true, builtin: true },
  });
  if (!existing) throw new Error("Campaña no encontrada");
  if (existing.builtin) {
    throw new Error("Las campañas de fábrica no se borran, se desactivan.");
  }

  await db.campaign.delete({ where: { id: existing.id } });
  revalidate();
}

export async function duplicateCampaign(id: string) {
  const biz = await getCurrentBusiness();
  const source = await db.campaign.findFirst({ where: { id, businessId: biz.id } });
  if (!source) throw new Error("Campaña no encontrada");

  const count = await db.campaign.count({ where: { businessId: biz.id } });
  if (count >= 30) throw new Error("Llegaste al máximo de 30 campañas.");

  await db.campaign.create({
    data: {
      businessId: biz.id,
      // La copia nunca es builtin, aunque el original lo sea: así se puede
      // partir de la de cumpleaños para armar una variante y borrarla después.
      builtin: null,
      name: `${source.name} (copia)`.slice(0, 60),
      description: source.description,
      active: false,
      triggerType: source.triggerType,
      triggerDays: source.triggerDays,
      segment: source.segment,
      minSpend: source.minSpend,
      excludeInactive: source.excludeInactive,
      whatsappBody: source.whatsappBody,
      emailSubject: source.emailSubject,
      emailBody: source.emailBody,
      sortOrder: count,
    },
  });

  revalidate();
}
