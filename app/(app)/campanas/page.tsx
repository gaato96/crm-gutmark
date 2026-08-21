import { Info } from "lucide-react";
import {
  getCurrentBusiness,
  getEnrichedCustomers,
  getCampaigns,
  getServices,
  campaignRecipients,
  ruleDefaults,
  toConfig,
} from "@/lib/queries";
import { describeTrigger, matchedServiceId } from "@/lib/campaigns";
import { buildCampaignMessage } from "@/lib/build-message";
import { pointsBalancesByCustomer } from "@/lib/points";
import { PageHeader } from "@/components/ui";
import { CampaignsView } from "@/components/campaigns-view";
import type { Audience } from "@/components/campaign-composer";
import type { CampaignItem } from "@/components/campaign-editor";

export const dynamic = "force-dynamic";

export default async function CampanasPage() {
  const biz = await getCurrentBusiness();
  const cfg = toConfig(biz);
  const customers = await getEnrichedCustomers(biz.id, cfg);
  const campaigns = await getCampaigns(biz.id);
  const services = await getServices(biz.id);
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
      recipients: campaignRecipients(c, customers, defaults).map((cu) => ({
        id: cu.id,
        name: cu.name,
        phone: cu.phone,
        email: cu.email,
        ...buildCampaignMessage(
          c,
          cu,
          biz.name,
          balances.get(cu.id),
          defaults.serviceNames?.[matchedServiceId(cu, c, defaults) ?? ""]
        ),
      })),
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
  }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Campañas"
        subtitle="Definí a quién contactar y con qué mensaje. Cada campaña arma su lista sola."
      />

      <div className="mb-5 flex items-start gap-3 rounded-xl border border-sky-500/20 bg-sky-500/10 p-4 text-sm text-sky-700 dark:text-sky-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          El envío por WhatsApp es <strong>manual</strong>: al tocar el botón se abre el chat con
          el mensaje ya escrito, listo para enviar. El email abre tu app de correo. El envío
          automático masivo se puede activar más adelante.
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
