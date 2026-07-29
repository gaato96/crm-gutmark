import Link from "next/link";
import { AlertTriangle, Check, MessageCircle, Blocks } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentBusiness } from "@/lib/queries";
import { formatMoney } from "@/lib/format";
import { businessWhatsappLink } from "@/lib/messages";
import { isModuleCode, MODULE_NAV } from "@/lib/modules";
import { PageHeader, EmptyState, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ModulosPage({
  searchParams,
}: {
  searchParams: Promise<{ bloqueado?: string }>;
}) {
  const { bloqueado } = await searchParams;
  const biz = await getCurrentBusiness();

  const [modules, settings] = await Promise.all([
    db.module.findMany({
      orderBy: { sortOrder: "asc" },
      include: { businesses: { where: { businessId: biz.id } } },
    }),
    db.platformSetting.findUnique({ where: { id: "singleton" } }),
  ]);

  const showPrices = settings?.showPricesToOwner ?? true;
  const active = modules.filter((m) => m.businesses[0]?.enabled);
  const available = modules.filter((m) => m.available && !m.businesses[0]?.enabled);

  const bloqueadoInfo =
    bloqueado && isModuleCode(bloqueado) ? modules.find((m) => m.code === bloqueado) : null;

  const hrefFor = (code: string) => MODULE_NAV.find((m) => m.code === code)?.href;

  const totalMensual = showPrices
    ? active.reduce((s, m) => s + (m.businesses[0]?.priceOverride ?? m.monthlyPrice), 0)
    : null;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Módulos"
        subtitle="Sumá funciones a tu cuenta cuando las necesites."
      />

      {bloqueadoInfo && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-gold-500/30 bg-gold-500/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" aria-hidden="true" />
          <p className="text-ink-soft">
            <span className="font-semibold text-ink">{bloqueadoInfo.name}</span> no está incluido
            en tu plan todavía. Pedilo por WhatsApp para activarlo.
          </p>
        </div>
      )}

      <SectionTitle hint={`${active.length} activo${active.length === 1 ? "" : "s"}`}>
        Tus módulos
      </SectionTitle>
      {active.length === 0 ? (
        <EmptyState
          icon={<Blocks className="h-7 w-7" aria-hidden="true" />}
          title="Todavía no sumaste módulos extra"
          description="Tenés el plan base activo. Podés sumar funciones cuando las necesites."
        />
      ) : (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((m) => {
            const price = m.businesses[0]?.priceOverride ?? m.monthlyPrice;
            const href = hrefFor(m.code);
            return (
              <div key={m.code} className="card p-5">
                <div className="flex items-center justify-between">
                  <span className="badge bg-brand-500/15 text-brand-700 ring-brand-500/25 dark:text-brand-300">
                    <Check className="h-3 w-3" aria-hidden="true" /> Activo
                  </span>
                  {showPrices && (
                    <span className="text-sm font-bold tabular-nums text-ink">
                      {formatMoney(price)}
                      <span className="text-xs font-normal text-ink-muted">/mes</span>
                    </span>
                  )}
                </div>
                <h3 className="mt-3 font-semibold text-ink">{m.name}</h3>
                <p className="mt-1 text-sm text-ink-muted">{m.description}</p>
                {href && (
                  <Link href={href} className="btn-secondary mt-4 w-full !py-2 text-sm">
                    Ir al módulo
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showPrices && totalMensual !== null && active.length > 0 && (
        <div className="mb-8 flex items-center justify-between rounded-xl border border-line bg-surface-2/60 px-5 py-3.5">
          <span className="text-sm font-medium text-ink-soft">Total de módulos por mes</span>
          <span className="text-base font-bold tabular-nums text-ink">
            {formatMoney(totalMensual)}
          </span>
        </div>
      )}

      {available.length > 0 && (
        <>
          <SectionTitle hint={`${available.length} disponible${available.length === 1 ? "" : "s"}`}>
            Sumá funciones
          </SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((m) => (
              <div key={m.code} className="card p-5">
                <div className="flex items-center justify-between">
                  <span className="badge bg-surface-3 text-ink-muted ring-line">Disponible</span>
                  {showPrices && (
                    <span className="text-sm font-bold tabular-nums text-ink">
                      {formatMoney(m.monthlyPrice)}
                      <span className="text-xs font-normal text-ink-muted">/mes</span>
                    </span>
                  )}
                </div>
                <h3 className="mt-3 font-semibold text-ink">{m.name}</h3>
                <p className="mt-1 text-sm text-ink-muted">{m.description}</p>
                <a
                  href={businessWhatsappLink(
                    `¡Hola! Soy ${biz.name}. Quiero sumar el módulo "${m.name}" a mi cuenta de Vuelvo.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary mt-4 w-full !py-2 text-sm"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" /> Pedir por WhatsApp
                </a>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
