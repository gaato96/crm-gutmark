import { getSessionUser } from "@/lib/auth";
import { buildWeeklySummary, renderWeeklySummary } from "@/lib/weekly-summary";
import { appUrl } from "@/lib/email";

// Vista previa del resumen semanal tal como llega por email, con los números
// reales del negocio. Se abre desde Configuración → Cuenta.
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return new Response("No autorizado", { status: 401 });
  const summary = await buildWeeklySummary(session.business.id);
  if (!summary) return new Response("No encontrado", { status: 404 });
  const { html } = renderWeeklySummary(summary, `${await appUrl()}/campanas`);
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
