import { db } from "@/lib/db";
import { PageHeader, SectionTitle } from "@/components/ui";
import {
  getBusinessHealth,
  matchesAudience,
  adminMessageVars,
  adminCampaignSends,
  whatsappNumber,
} from "@/lib/admin-crm";
import { renderAdminMessage, SUGGESTED_ADMIN_CAMPAIGNS } from "@/lib/admin-crm-meta";
import {
  FollowUpList,
  AdminCampaigns,
  FollowUpDaysSetting,
  type FollowUpRow,
  type AdminCampaignRow,
} from "@/components/admin-crm";

export const dynamic = "force-dynamic";

const DAY = 86400000;
const HEALTH_ORDER = { riesgo: 0, atencion: 1, bien: 2 } as const;

// El "plan del día" del equipo, igual que el que tiene cada negocio con sus
// clientes: a quién llamar hoy y qué campañas tienen negocios pendientes.
export default async function SeguimientoPage() {
  const [{ rows, followUpDays }, campaigns, sends] = await Promise.all([
    getBusinessHealth(),
    db.adminCampaign.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    adminCampaignSends(),
  ]);

  // El mensaje por defecto del botón de WhatsApp de "contactar hoy" sale de la
  // campaña de seguimiento, si existe; si no, de la sugerida.
  const seguimiento =
    campaigns.find((c) => c.audience === "todos" && c.active)?.message ?? SUGGESTED_ADMIN_CAMPAIGNS[0].message;

  const due: FollowUpRow[] = rows
    .filter((r) => r.followUpDue)
    .sort((a, b) => HEALTH_ORDER[a.health] - HEALTH_ORDER[b.health])
    .map((r) => ({
      id: r.id,
      name: r.name,
      ownerName: r.owner?.name ?? null,
      phone: whatsappNumber(r.phone),
      health: r.health,
      reasons: r.reasons,
      lastContactAt: r.lastContactAt?.toISOString() ?? null,
      isFounder: r.isFounder,
      defaultMessage: renderAdminMessage(seguimiento, adminMessageVars(r)),
    }));

  const now = Date.now();
  const campaignRows: AdminCampaignRow[] = campaigns.map((c) => {
    const sent = sends.get(c.id) ?? new Map<string, Date>();
    const pending = c.active
      ? rows
          .filter((r) => matchesAudience(r, c.audience))
          .filter((r) => {
            const last = sent.get(r.id);
            return !last || now - last.getTime() >= c.everyDays * DAY;
          })
          .map((r) => ({
            businessId: r.id,
            name: r.name,
            phone: whatsappNumber(r.phone),
            lastSentAt: sent.get(r.id)?.toISOString() ?? null,
            vars: adminMessageVars(r),
          }))
      : [];
    return {
      id: c.id,
      name: c.name,
      audience: c.audience,
      message: c.message,
      everyDays: c.everyDays,
      active: c.active,
      sentCount: sent.size,
      pending,
    };
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Seguimiento"
        subtitle="A qué negocios escribirles hoy y las campañas del equipo. Cada contacto queda en la ficha del negocio."
      />
      <div className="mb-6">
        <FollowUpDaysSetting days={followUpDays} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <SectionTitle hint={due.length === 1 ? "1 negocio" : `${due.length} negocios`}>Para contactar hoy</SectionTitle>
          <FollowUpList rows={due} />
        </section>
        <section>
          <SectionTitle hint="Se calculan al abrir">Campañas a negocios</SectionTitle>
          <AdminCampaigns campaigns={campaignRows} />
        </section>
      </div>
    </div>
  );
}
