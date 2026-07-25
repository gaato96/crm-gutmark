import { Info } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentBusiness, getEnrichedCustomers, toConfig, EnrichedCustomer } from "@/lib/queries";
import { buildMessage, MessageKind } from "@/lib/build-message";
import { PageHeader, SectionTitle } from "@/components/ui";
import { TemplateEditor, TemplateData } from "@/components/template-editor";
import { CampaignComposer, Audience } from "@/components/campaign-composer";

export const dynamic = "force-dynamic";

export default async function CampanasPage() {
  const biz = await getCurrentBusiness();
  const cfg = toConfig(biz);
  const customers = await getEnrichedCustomers(biz.id, cfg);
  const templates = await db.template.findMany({
    where: { businessId: biz.id },
    orderBy: [{ type: "asc" }, { channel: "asc" }],
  });

  const toRecipients = (list: EnrichedCustomer[], kind: MessageKind) =>
    list.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      ...buildMessage(kind, c.name, biz.name, templates),
    }));

  const audiences: Audience[] = [
    {
      key: "birthday",
      label: "🎂 Cumpleaños semana",
      description: "Clientes que cumplen años en los próximos 7 días. Enviales el saludo con beneficio.",
      recipients: toRecipients(
        customers.filter((c) => c.birthdayInDays !== null && c.birthdayInDays <= 7),
        "birthday"
      ),
    },
    {
      key: "winback",
      label: "🔁 Recompra",
      description: "Superaron el tiempo esperado sin volver. Invitalos con un incentivo.",
      recipients: toRecipients(
        customers.filter((c) => c.needsWinback && c.segment !== "inactivo"),
        "winback"
      ),
    },
    {
      key: "inactivos",
      label: "😴 Inactivos",
      description: "Hace mucho que no compran. Reactivalos con una oferta especial.",
      recipients: toRecipients(
        customers.filter((c) => c.segment === "inactivo"),
        "winback"
      ),
    },
    {
      key: "vip",
      label: "👑 VIP",
      description: "Tus mejores clientes. Un mensaje de agradecimiento fortalece la relación.",
      recipients: toRecipients(
        customers.filter((c) => c.isVip),
        "generic"
      ),
    },
  ];

  const templateData: TemplateData[] = templates.map((t) => ({
    id: t.id,
    type: t.type,
    channel: t.channel,
    subject: t.subject,
    body: t.body,
  }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Campañas"
        subtitle="Elegí una audiencia y contactá a varios clientes con el mismo mensaje personalizado."
      />

      {/* Generador de campaña */}
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-sky-500/20 bg-sky-500/10 p-4 text-sm text-sky-700 dark:text-sky-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          El envío por WhatsApp es <strong>manual</strong>: al tocar el botón se abre el chat con el
          mensaje ya escrito, listo para enviar. El email abre tu app de correo. El envío
          automático masivo se puede activar más adelante.
        </p>
      </div>

      <CampaignComposer audiences={audiences} />

      {/* Plantillas */}
      <div className="mt-10">
        <SectionTitle hint="Se usan en recordatorios y campañas">
          Plantillas de mensajes
        </SectionTitle>
        <div className="grid gap-4 lg:grid-cols-2">
          {templateData.map((t) => (
            <TemplateEditor key={t.id} template={t} />
          ))}
        </div>
      </div>
    </div>
  );
}
