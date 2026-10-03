import { Info } from "lucide-react";
import {
  getCurrentBusiness,
  getEnrichedCustomers,
  getCampaigns,
  getServices,
  campaignRecipients,
  ruleDefaults,
  toConfig,
  getCampaignContacts,
  coveringContact,
} from "@/lib/queries";
import { describeTrigger, matchedServiceId } from "@/lib/campaigns";
import { buildCampaignMessage } from "@/lib/build-message";
import { pointsBalancesByCustomer } from "@/lib/points";
import { campaignImpact } from "@/lib/insights";
import { PageHeader } from "@/components/ui";
import { CampaignsView } from "@/components/campaigns-view";
import type { Audience } from "@/components/campaign-composer";
import type { CampaignItem } from "@/components/campaign-editor";

export const dynamic = "force-dynamic";

export default async function CampanasPage() {
  const biz = await getCurrentBusiness();
  const cfg = toConfig(biz);
  const [customers, campaigns, services, contacts] = await Promise.all([
    getEnrichedCustomers(biz.id, cfg),
    getCampaigns(biz.id),
    getServices(biz.id),
    getCampaignContacts(biz.id),
  ]);
  const impact = await campaignImpact(biz.id);
  const defaults = ruleDefaults(biz, services);

  // La variable {puntos} solo tiene sentido con el módulo activo; sin él ni
  // siquiera consultamos la tabla.
  const balances = biz.modules.includes("puntos")
    ? await pointsBalancesByCustomer(biz.id)
    : new Map<string, number>();

  // Cada campaña activa es una audiencia. Antes las cuatro audiencias estaban
  // escritas a mano acá; ahora salen de la misma evaluación que usa el resto
  // de la app (ver lib/campaigns.ts).
  const audiences: Audience[] = campaigns
    .filter((c) => c.active)
    .map((c) => ({
      key: c.id,
      campaignId: c.id,
      label: c.name,
      description: c.description || describeTrigger(c, defaults),
      recipients: campaignRecipients(c, customers, defaults)
        // Lo más urgente primero: cumpleaños por cercanía, el resto por
        // tiempo sin comprar.
        .sort((a, b) =>
          c.triggerType === "birthday"
            ? (a.birthdayInDays ?? 999) - (b.birthdayInDays ?? 999)
            : (b.hoursSinceLast ?? 0) - (a.hoursSinceLast ?? 0)
        )
        .map((cu) => {
          const mark = coveringContact(contacts, c, cu);
          return {
            id: cu.id,
            name: cu.name,
            phone: cu.phone,
            email: cu.email,
            hint: recipientHint(c.triggerType, cu.birthdayInDays, cu.daysSinceLast, cu.hoursSinceLast),
            // Persistido en ContactLog: si ya se le escribió en este ciclo,
            // sale como enviado aunque se cierre la pestaña o se entre desde
            // otro dispositivo.
            sent: mark ? { id: mark.id, at: mark.at.toISOString(), channel: mark.channel } : null,
            ...buildCampaignMessage(
              c,
              cu,
              biz.name,
              balances.get(cu.id),
              defaults.serviceNames?.[matchedServiceId(cu, c, defaults) ?? ""]
            ),
          };
        }),
    }));

  const items: CampaignItem[] = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    active: c.active,
    builtin: c.builtin,
    triggerType: c.triggerType,
    triggerValue: c.triggerValue,
    triggerUnit: c.triggerUnit,
    triggerMaxValue: c.triggerMaxValue,
    segment: c.segment,
    minSpend: c.minSpend,
    serviceId: c.serviceId,
    allServices: c.allServices,
    excludeInactive: c.excludeInactive,
    whatsappBody: c.whatsappBody,
    emailSubject: c.emailSubject,
    emailBody: c.emailBody,
    reach: campaignRecipients(c, customers, defaults).length,
    triggerLabel: describeTrigger(c, defaults),
    impactCustomers: impact.byCampaign.get(c.id)?.customers ?? 0,
    impactRevenue: impact.byCampaign.get(c.id)?.revenue ?? 0,
  }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Campañas"
        subtitle="Definí a quién contactar y con qué mensaje. Cada campaña arma su lista sola."
      />

      <div className="mb-5 flex items-start gap-3 rounded-xl border border-sky-500/20 bg-sky-500/10 p-4 text-sm text-sky-800 dark:text-sky-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Al tocar <strong>WhatsApp</strong> se abre el chat con el mensaje ya escrito y el
          cliente pasa a <strong>Enviados</strong>, así no le escribís dos veces. Si al final no lo
          mandaste, tocá <strong>Deshacer</strong>. Cuando vuelva a comprar y le vuelva a tocar,
          aparece otra vez en la lista.
        </p>
      </div>

      <CampaignsView
        audiences={audiences}
        campaigns={items}
        catalogMode={biz.catalogMode}
        services={services
          .filter((sv) => sv.active)
          .map((sv) => ({ id: sv.id, name: sv.name, recompraDays: sv.recompraDays }))}
      />
    </div>
  );
}

function recipientHint(
  triggerType: string,
  birthdayInDays: number | null,
  daysSinceLast: number | null,
  hoursSinceLast: number | null
): string {
  if (triggerType === "birthday" && birthdayInDays !== null) {
    if (birthdayInDays === 0) return "Cumple hoy";
    if (birthdayInDays === 1) return "Cumple mañana";
    return `Cumple en ${birthdayInDays} días`;
  }
  if (hoursSinceLast !== null && hoursSinceLast < 48) {
    return hoursSinceLast <= 1 ? "Compró hace 1 hora" : `Compró hace ${hoursSinceLast} horas`;
  }
  if (daysSinceLast !== null) return `Última compra hace ${daysSinceLast} días`;
  return "Sin compras todavía";
}
