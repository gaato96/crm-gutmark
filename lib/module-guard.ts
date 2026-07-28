import "server-only";
import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "./auth";
import type { ModuleCode } from "./modules";

// Protege una ruta/acción de módulo. Úsalo en DOS lugares para cada módulo:
//   1) app/(app)/<modulo>/layout.tsx — bloquea la navegación por URL.
//   2) al inicio de cada Server Action del módulo — un Server Action es un
//      endpoint POST direccionable por su ID; el layout NO lo protege.
//      Siempre escopear las queries por `session.business.id`, nunca por un
//      businessId recibido como parámetro.
export async function requireModule(code: ModuleCode): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  if (session.role === "superadmin") return session; // el superadmin ve todo
  if (!session.business.modules.includes(code)) {
    redirect(`/modulos?bloqueado=${code}`);
  }
  return session;
}
