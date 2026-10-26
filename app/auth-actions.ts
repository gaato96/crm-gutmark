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
import { applyRubroPreset } from "@/lib/rubro-setup";
import { createResetToken, findValidReset, consumeResets, RESET_VALID_MINUTES } from "@/lib/password-reset";
import { sendEmail, appUrl, emailLayout, escapeHtml } from "@/lib/email";
import { isRubroCode, modeForRubro } from "@/lib/rubros";

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
  const rubroRaw = clean(formData.get("rubro"));
  const rubro = isRubroCode(rubroRaw) ? rubroRaw : "otro";
  const name = clean(formData.get("name"));
  const email = clean(formData.get("email")).toLowerCase();
  const password = clean(formData.get("password"));

  if (!businessName) return { error: "Poné el nombre de tu negocio." };
  if (!email || !email.includes("@")) return { error: "Ingresá un email válido." };
  if (password.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres." };

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "Ya existe una cuenta con ese email." };

  const business = await db.business.create({
    // El modo nace del rubro: un kiosco arranca viendo "Productos" y un
    // consultorio "Servicios", sin que nadie tenga que configurarlo.
    data: { name: businessName, rubro, catalogMode: modeForRubro(rubro) },
  });
  const user = await db.user.create({
    data: {
      email,
      name: name || null,
      passwordHash: await hashPassword(password),
      businessId: business.id,
    },
  });

  // Arranca con el catálogo y las campañas de su rubro, no en blanco. Los
  // módulos no: son pagos y los activa el superadmin.
  await applyRubroPreset(business.id, rubro, { modules: false });
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

// --- Olvidé mi contraseña ---------------------------------------------------

export interface ResetRequestState {
  error?: string;
  sent?: boolean;
}

// Siempre responde lo mismo, exista o no la cuenta: si dijera "ese email no
// existe", cualquiera podría averiguar quién usa el sistema.
export async function requestPasswordReset(
  _prev: ResetRequestState,
  formData: FormData
): Promise<ResetRequestState> {
  const email = clean(formData.get("email")).toLowerCase();
  if (!email || !email.includes("@")) return { error: "Ingresá un email válido." };

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true, business: { select: { active: true } } },
  });
  if (user && user.business.active) {
    const token = await createResetToken(user.id, "self");
    if (token) {
      const link = `${await appUrl()}/restablecer?token=${token}`;
      const hola = user.name ? `Hola ${escapeHtml(user.name)},` : "Hola,";
      await sendEmail({
        to: email,
        subject: "Cambiá tu contraseña de Vuelvo",
        text: `${user.name ? `Hola ${user.name},` : "Hola,"}\n\nPara elegir una contraseña nueva entrá a este link (vence en ${RESET_VALID_MINUTES} minutos):\n${link}\n\nSi no lo pediste vos, ignorá este email: tu contraseña no cambia.`,
        html: emailLayout({
          title: "Elegí una contraseña nueva",
          body: `<p>${hola}</p><p>Pediste cambiar la contraseña de tu cuenta de Vuelvo. El link vence en ${RESET_VALID_MINUTES} minutos y se puede usar una sola vez.</p><p style="font-size:13px;color:#64748B">Si no lo pediste vos, ignorá este email: tu contraseña no cambia.</p>`,
          cta: { label: "Cambiar mi contraseña", href: link },
        }),
      });
    }
  }
  return { sent: true };
}

export async function resetPassword(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const token = clean(formData.get("token"));
  const password = clean(formData.get("password"));
  const confirm = clean(formData.get("confirmPassword"));

  const reset = await findValidReset(token);
  if (!reset) return { error: "El link venció o ya se usó. Pedí uno nuevo." };
  if (password.length < 8) return { error: "La contraseña tiene que tener al menos 8 caracteres." };
  if (password !== confirm) return { error: "Las dos contraseñas no coinciden." };

  await db.user.update({
    where: { id: reset.userId },
    data: { passwordHash: await hashPassword(password) },
  });
  await consumeResets(reset.userId);
  // Quien tenía la cuenta abierta en otro lado queda afuera: si la contraseña
  // se cambió porque alguien más la sabía, esto lo corta.
  await db.session.deleteMany({ where: { userId: reset.userId } });

  const user = await db.user.findUnique({ where: { id: reset.userId }, select: { role: true } });
  await touchLastLogin(reset.userId);
  await createSession(reset.userId);
  redirect(user?.role === "superadmin" ? "/admin" : "/dashboard");
}
