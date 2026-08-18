import Link from "next/link";
import { PartyPopper, Send, Megaphone } from "lucide-react";
import {
  getCurrentBusiness,
  getEnrichedCustomers,
  getCampaigns,
  campaignRecipients,
  ruleDefaults,
  toConfig,
} from "@/lib/queries";
import { describeTrigger } from "@/lib/campaigns";
import { buildCampaignMessage } from "@/lib/build-message";
import { pointsBalancesByCustomer } from "@/lib/points";
import { PageHeader } from "@/components/ui";
import { ReminderCard } from "@/components/reminder-card";

export const dynamic = "force-dynamic";

export default async function RecordatoriosPage() {
  const biz = await getCurrentBusiness();
  const cfg = toConfig(biz);
  const defaults = ruleDefaults(biz);
  const customers = await getEnrichedCustomers(biz.id, cfg);
  const campaigns = (await getCampaigns(biz.id)).filter((c) => c.active);

  const balances = biz.modules.includes("puntos")
    ? await pointsBalancesByCustomer(biz.id)
    : new Map<string, number>();

  // Una sección por campaña activa, en vez de las tres secciones fijas de
  // antes. Si el negocio arma una campaña propia, aparece acá sin tocar código.
  const sections = campaigns
    .map((c) => {
      const recipients = campaignRecipients(c, customers, defaults)
        // Lo más urgente primero: cumpleaños por proximidad, el resto por
        // tiempo sin comprar.
        .sort((a, b) =>
          c.triggerType === "birthday"
            ? (a.birthdayInDays ?? 999) - (b.birthdayInDays ?? 999)
            : (b.daysSinceLast ?? 0) - (a.daysSinceLast ?? 0)
        );

      return {
        campaign: c,
        label: describeTrigger(c, defaults),
        recipients: recipients.map((cu) => ({
          customer: cu,
          message: buildCampaignMessage(c, cu, biz.name, balances.get(cu.id)),
          hint: hintFor(c.triggerType, cu.birthdayInDays, cu.daysSinceLast),
        })),
      };
    })
    .filter((s) => s.recipients.length > 0);

  const total = sections.reduce((s, sec) => s + sec.recipients.length, 0);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Recordatorios"
        subtitle={
          total > 0
            ? `Tenés ${total} ${total === 1 ? "oportunidad" : "oportunidades"} para contactar clientes hoy.`
            : "Estás al día. No hay acciones urgentes."
        }
        action={
          <Link href="/campanas" className="btn-secondary">
            <Send className="h-4 w-4" /> Ir a campañas
          </Link>
        }
      />

      {sections.length === 0 ? (
        <EmptyState hasCampaigns={campaigns.length > 0} />
      ) : (
        <div className="space-y-8">
          {sections.map((s) => (
            <section key={s.campaign.id}>
              <div className="mb-3 flex flex-wrap items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-500/10 text-brand-600">
                  <Megaphone className="h-4 w-4" />
                </span>
                <h2 className="font-display font-bold text-ink">{s.campaign.name}</h2>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-bold text-ink-soft">
                  {s.recipients.length}
                </span>
                <span className="w-full text-xs text-ink-muted sm:w-auto">{s.label}</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {s.recipients.slice(0, 9).map((r) => (
                  <ReminderCard
                    key={r.customer.id}
                    id={r.customer.id}
                    name={r.customer.name}
                    phone={r.customer.phone}
                    email={r.customer.email}
                    reason={s.campaign.builtin ?? "campaign"}
                    campaignId={s.campaign.id}
                    hint={r.hint}
                    {...r.message}
                  />
                ))}
              </div>

              {s.recipients.length > 9 && (
                <p className="mt-3 text-center text-sm text-ink-muted">
                  Y {s.recipients.length - 9} más.{" "}
                  <Link href="/campanas" className="font-medium text-brand-700 dark:text-brand-300">
                    Verlos en campañas
                  </Link>
                </p>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function hintFor(
  triggerType: string,
  birthdayInDays: number | null,
  daysSinceLast: number | null
): string {
  if (triggerType === "birthday" && birthdayInDays !== null) {
    if (birthdayInDays === 0) return "¡Hoy! 🎉";
    if (birthdayInDays === 1) return "Mañana";
    return `En ${birthdayInDays} días`;
  }
  if (daysSinceLast !== null) return `Hace ${daysSinceLast} días`;
  return "Sin compras";
}

function EmptyState({ hasCampaigns }: { hasCampaigns: boolean }) {
  return (
    <div className="card flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/10 text-brand-600">
        <PartyPopper className="h-7 w-7" />
      </div>
      <h3 className="font-display text-base font-bold text-ink">
        {hasCampaigns ? "¡Todo bajo control!" : "Todavía no hay campañas activas"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">
        {hasCampaigns
          ? "Ninguna de tus campañas tiene clientes esperando ahora mismo. Volvé mañana para ver nuevas oportunidades."
          : "Activá o creá una campaña y acá vas a ver a quién contactar cada día."}
      </p>
      {!hasCampaigns && (
        <Link href="/campanas" className="btn-primary mt-5">
          <Send className="h-4 w-4" /> Ir a campañas
        </Link>
      )}
    </div>
  );
}
