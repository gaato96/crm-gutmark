"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { isRubroCode, modeForRubro } from "@/lib/rubros";
import { isAccentCode, MAX_LOGO_CHARS } from "@/lib/appearance";

export interface SettingsState {
  error?: string;
  ok?: boolean;
}

function clean(v: FormDataEntryValue | null): string {
  return (v ?? "").toString().trim();
}

async function requireOwner() {
  const session = await getSessionUser();
  if (!session) throw new Error("Tu sesión expiró. Volvé a entrar.");
  return session;
}

function revalidatePanel() {
  // El nombre, el saludo, el logo y el acento se ven en todo el panel (el
  // layout), no solo en Configuración.
  revalidatePath("/", "layout");
}

// --- Pestaña "Negocio" ----------------------------------------------------------

export async function updateBusinessProfile(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const session = await requireOwner();
  const biz = session.business;

  const name = clean(formData.get("name"));
  if (!name) return { error: "El negocio tiene que tener un nombre." };
  if (name.length > 80) return { error: "El nombre no puede pasar de 80 caracteres." };

  const displayName = clean(formData.get("displayName")).slice(0, 40);
  const ownerName = clean(formData.get("ownerName")).slice(0, 60);
  const phone = clean(formData.get("phone")).slice(0, 30);
  const instagram = clean(formData.get("instagram")).replace(/^@/, "").slice(0, 40);
  const address = clean(formData.get("address")).slice(0, 120);

  const rubroRaw = clean(formData.get("rubro"));
  const rubro = isRubroCode(rubroRaw) ? rubroRaw : biz.rubro;

  // El modo sigue al rubro solo si nadie lo forzó a mano (mismo criterio que
  // updateBusiness en app/actions.ts): si el superadmin dejó una barbería
  // viendo solo servicios, cambiar el rubro no le pisa esa decisión.
  const actual = await db.business.findUnique({
    where: { id: biz.id },
    select: { catalogMode: true, rubro: true },
  });
  const forzado = actual !== null && actual.catalogMode !== modeForRubro(actual.rubro);
  const catalogMode = forzado ? actual!.catalogMode : modeForRubro(rubro);

  await db.business.update({
    where: { id: biz.id },
    data: {
      name,
      rubro,
      catalogMode,
      displayName: displayName || null,
      phone: phone || null,
      instagram: instagram || null,
      address: address || null,
    },
  });
  // El nombre de la persona es del usuario, no del negocio. Mientras un
  // superadmin suplanta no se toca: es el nombre del dueño, no el suyo.
  if (!session.isImpersonating) {
    await db.user.update({ where: { id: session.id }, data: { name: ownerName || null } });
  }

  revalidatePanel();
  return { ok: true };
}

// --- Pestaña "Apariencia" -------------------------------------------------------

export async function updateAppearance(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const session = await requireOwner();

  const accentColor = clean(formData.get("accentColor"));
  if (!isAccentCode(accentColor)) return { error: "Elegí uno de los colores." };

  // El logo llega ya achicado por el navegador, como data URL. "remove" lo
  // borra; vacío lo deja como estaba.
  const logo = clean(formData.get("logo"));
  let logoPatch: { logoData: string | null; logoUpdatedAt: Date | null } | object = {};
  if (logo === "remove") {
    logoPatch = { logoData: null, logoUpdatedAt: null };
  } else if (logo) {
    if (!/^data:image\/(png|jpeg|webp);base64,/.test(logo)) {
      return { error: "El logo tiene que ser una imagen PNG, JPG o WebP." };
    }
    if (logo.length > MAX_LOGO_CHARS) return { error: "El logo es muy pesado. Probá con otra imagen." };
    logoPatch = { logoData: logo, logoUpdatedAt: new Date() };
  }

  await db.business.update({
    where: { id: session.business.id },
    data: { accentColor, ...logoPatch },
  });

  revalidatePanel();
  return { ok: true };
}

// --- Pestaña "Cuenta" -------------------------------------------------------------

export async function setWeeklySummary(enabled: boolean): Promise<void> {
  const session = await requireOwner();
  await db.business.update({
    where: { id: session.business.id },
    data: { weeklySummary: enabled },
  });
  revalidatePath("/configuracion");
}
