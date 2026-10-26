import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, LogIn, Users, ShoppingBag, Clock } from "lucide-react";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";
import { getPlatformSettings, businessMonthlyTotal, billingStatus } from "@/lib/platform";
import { formatMoney, formatDate } from "@/lib/format";
import { PageHeader, SectionTitle } from "@/components/ui";
import { ImpersonateButton, ToggleActiveButton } from "@/components/admin-actions-buttons";
import { AdminBusinessModules } from "@/components/admin-business-modules";
import { AdminBusinessCatalog } from "@/components/admin-business-catalog";
import { rubroLabel } from "@/lib/rubros";
import { AdminPayments } from "@/components/admin-payments";
import { getBusinessHealth } from "@/lib/admin-crm";
import { campaignImpact } from "@/lib/insights";
import { HEALTH_META, crmStageMeta } from "@/lib/admin-crm-meta";
import { BusinessCrmForm, NoteForm, NotesTimeline, ResetLinkButton } from "@/components/admin-crm";
import { FeedbackInbox } from "@/components/admin-feedback";
import { TrendingUp, TrendingDown, Star } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NegocioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperAdmin();
  const { id } = await params;

  const [business, catalog, settings] = await Promise.all([
    db.business.findUnique({
      where: { id },
      include: {
        users: { orderBy: { createdAt: "asc" }, select: { id: true, email: true, name: true, role: true, lastLoginAt: true } },
        modules: { include: { module: true } },
        payments: { orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }] },
        _count: { select: { customers: true, purchases: true } },
      },
    }),
    db.module.findMany({ orderBy: { sortOrder: "asc" } }),
    getPlatformSettings(),
  ]);

  if (!business) notFound();

  const WEEKS = 12;
  const since = new Date(Date.now() - WEEKS * 7 * 86400000);
  const [{ rows: healthRows }, impact, notes, feedback, weekly] = await Promise.all([
    getBusinessHealth({ ids: [business.id] }),
    campaignImpact(business.id),
    db.adminNote.findMany({ where: { businessId: business.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.feedback.findMany({ where: { businessId: business.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.purchase.findMany({ where: { businessId: business.id, date: { gte: since } }, select: { date: true, amount: true } }),
  ]);
  const health = healthRows[0] ?? null;

  // Ventas por semana (últimas 12), para ver la tendencia de un vistazo.
  const weeks = Array.from({ length: WEEKS }, (_, i) => ({ i, total: 0 }));
  for (const p of weekly) {
    const idx = WEEKS - 1 - Math.floor((Date.now() - p.date.getTime()) / (7 * 86400000));
    if (idx >= 0 && idx < WEEKS) weeks[idx].total += p.amount;
  }
  const maxWeek = Math.max(1, ...weeks.map((w) => w.total));

  const owner = business.users.find((u) => u.role === "owner");
  const now = new Date();
  const hasPaidCurrentPeriod = business.payments.some(
    (p) => p.periodYear === now.getFullYear() && p.periodMonth === now.getMonth() + 1
  );
  const status = billingStatus({
    billingExempt: business.billingExempt,
    hasPaidCurrentPeriod,
    dueDay: settings.dueDay,
  });
  const total = businessMonthlyTotal(settings.basePlanPrice, business.modules);

  const statusMeta: Record<string, { label: string; cls: string }> = {
    "al-dia": { label: "Al día", cls: "bg-brand-500/15 text-brand-700 ring-brand-500/25 dark:text-brand-300" },
    pendiente: { label: "Pendiente", cls: "bg-accent-500/15 text-accent-700 ring-accent-500/25 dark:text-accent-300" },
    vencido: { label: "Vencido", cls: "bg-rose-500/15 text-rose-600 ring-rose-500/25" },
    exento: { label: "Exento", cls: "bg-surface-3 text-ink-muted ring-line" },
  };

  return (
    <div className="animate-fade-in">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a negocios
      </Link>

      <PageHeader
        title={business.name}
        subtitle={`${rubroLabel(business.rubro)} · alta el ${formatDate(business.createdAt)}${business.isFounder ? " · Fundador" : ""}`}
        action={
          <>
            <ImpersonateButton
              businessId={business.id}
              disabled={!owner}
              label={
                <>
                  <LogIn className="h-3.5 w-3.5" aria-hidden="true" /> Entrar como
                </>
              }
            />
            <ToggleActiveButton businessId={business.id} active={business.active} />
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-center gap-1.5 text-xs text-ink-muted">
            <Users className="h-3.5 w-3.5" aria-hidden="true" /> Clientes
          </div>
          <div className="mt-1 text-xl font-bold tabular-nums text-ink">
            {business._count.customers}
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-1.5 text-xs text-ink-muted">
            <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" /> Compras
          </div>
          <div className="mt-1 text-xl font-bold tabular-nums text-ink">
            {business._count.purchases}
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-1.5 text-xs text-ink-muted">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Último ingreso
          </div>
          <div className="mt-1 text-sm font-semibold text-ink">
            {owner?.lastLoginAt ? formatDate(owner.lastLoginAt) : "Nunca"}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-ink-muted">Estado de pago</div>
          <div className="mt-1.5">
            {health?.inTrial ? (
              <span className="badge bg-sky-500/15 text-sky-700 ring-sky-500/25 dark:text-sky-300">En prueba</span>
            ) : (
              <span className={`badge ${statusMeta[health?.billing ?? status].cls}`}>
                {statusMeta[health?.billing ?? status].label}
              </span>
            )}
          </div>
        </div>
      </div>

      {health && (
        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <div className="card p-5 lg:col-span-2">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={`badge ${HEALTH_META[health.health].cls}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${HEALTH_META[health.health].dot}`} />
                {HEALTH_META[health.health].label}
              </span>
              <span className={`badge ${crmStageMeta(health.crmStage).cls}`}>{crmStageMeta(health.crmStage).label}</span>
              {health.isFounder && (
                <span className="badge bg-amber-500/15 text-amber-700 ring-amber-500/25 dark:text-amber-300">
                  <Star className="h-3 w-3" /> Fundador
                </span>
              )}
            </div>
            {health.reasons.length > 0 ? (
              <ul className="mb-4 space-y-1 text-sm text-ink-soft">
                {health.reasons.map((r) => (
                  <li key={r}>· {r}</li>
                ))}
              </ul>
            ) : (
              <p className="mb-4 text-sm text-ink-muted">Usa el sistema con normalidad: vende, entra y manda mensajes.</p>
            )}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Mini label="Ventas 7 días" value={formatMoney(health.sales7)} hint={`${health.sales7Count} ventas`} />
              <Mini
                label="Ventas 30 días"
                value={formatMoney(health.sales30)}
                hint={health.growth30 === null ? "Sin mes anterior" : `${health.growth30 >= 0 ? "+" : ""}${Math.round(health.growth30)}% vs. anterior`}
                trend={health.growth30}
              />
              <Mini label="Mensajes 30 días" value={String(health.messages30)} hint={`${health.messages7} en 7 días`} />
              <Mini
                label="Volvieron por mensajes"
                value={formatMoney(impact.revenue)}
                hint={`${impact.customers} clientes en 30 días`}
              />
            </div>
            <div className="mt-5">
              <div className="mb-1 text-xs text-ink-muted">Ventas por semana (últimas {WEEKS})</div>
              <div className="flex h-20 items-end gap-1">
                {weeks.map((w) => (
                  <div
                    key={w.i}
                    className="flex-1 rounded-t bg-accent-500/70"
                    style={{ height: `${Math.max(2, (w.total / maxWeek) * 100)}%` }}
                    title={formatMoney(w.total)}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="mb-3 text-sm font-semibold text-ink">Seguimiento</div>
            <BusinessCrmForm
              businessId={business.id}
              data={{
                crmStage: business.crmStage,
                isFounder: business.isFounder,
                trialEndsAt: business.trialEndsAt?.toISOString() ?? null,
                nextFollowUpAt: business.nextFollowUpAt?.toISOString() ?? null,
                phone: business.phone,
              }}
            />
          </div>
        </div>
      )}

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <div className="mb-1 text-sm text-ink-muted">Dueño de la cuenta</div>
          <div className="font-semibold text-ink">{owner?.name || "—"}</div>
          <div className="text-sm text-ink-muted">{owner?.email ?? "Sin usuario dueño"}</div>
          {(business.instagram || business.address) && (
            <div className="mt-2 text-xs text-ink-muted">
              {business.instagram && <div>Instagram: @{business.instagram}</div>}
              {business.address && <div>{business.address}</div>}
            </div>
          )}
          <div className="mt-4">
            <ResetLinkButton businessId={business.id} />
          </div>
        </div>
        <div className="card p-5 lg:col-span-2">
          <div className="mb-3 text-sm font-semibold text-ink">Notas y contactos</div>
          <NoteForm businessId={business.id} />
          <div className="mt-4 max-h-80 overflow-y-auto border-t border-line-soft pt-4">
            <NotesTimeline
              businessId={business.id}
              notes={notes.map((n) => ({ id: n.id, kind: n.kind, body: n.body, createdAt: n.createdAt.toISOString() }))}
            />
          </div>
        </div>
      </div>

      {feedback.length > 0 && (
        <>
          <SectionTitle hint={`${feedback.length} reportes`}>Soporte</SectionTitle>
          <div className="mb-6">
            <FeedbackInbox
              showBusiness={false}
              rows={feedback.map((r) => ({
                id: r.id,
                businessId: r.businessId,
                businessName: business.name,
                kind: r.kind,
                message: r.message,
                path: r.path,
                userAgent: r.userAgent,
                viewport: r.viewport,
                screenshot: r.screenshot,
                fromImpersonation: r.fromImpersonation,
                status: r.status,
                reply: r.reply,
                createdAt: r.createdAt.toISOString(),
                seenAt: r.seenAt?.toISOString() ?? null,
              }))}
            />
          </div>
        </>
      )}

      <SectionTitle hint="Se cobra aparte del plan base">Módulos</SectionTitle>
      <div className="mb-6">
        <AdminBusinessCatalog
          businessId={business.id}
          rubro={business.rubro}
          catalogMode={business.catalogMode}
        />

        <AdminBusinessModules
          businessId={business.id}
          catalog={catalog}
          current={business.modules.map((m) => ({
            moduleCode: m.moduleCode,
            enabled: m.enabled,
            priceOverride: m.priceOverride,
          }))}
        />
      </div>

      <SectionTitle>Facturación</SectionTitle>
      <div className="mb-6 card divide-y divide-line-soft p-5">
        <div className="flex items-center justify-between py-2 text-sm">
          <span className="text-ink-soft">Plan base</span>
          <span className="tabular-nums text-ink">{formatMoney(settings.basePlanPrice)}</span>
        </div>
        {business.modules
          .filter((m) => m.enabled)
          .map((m) => (
            <div key={m.moduleCode} className="flex items-center justify-between py-2 text-sm">
              <span className="text-ink-soft">
                {m.module.name}
                {m.priceOverride !== null && (
                  <span className="ml-1.5 text-xs text-accent-600">(precio especial)</span>
                )}
              </span>
              <span className="tabular-nums text-ink">
                {formatMoney(m.priceOverride ?? m.module.monthlyPrice)}
              </span>
            </div>
          ))}
        <div className="flex items-center justify-between pt-3 text-base font-bold">
          <span className="text-ink">Total mensual</span>
          <span className="tabular-nums text-ink">{formatMoney(total)}</span>
        </div>
      </div>

      <SectionTitle>Pagos</SectionTitle>
      <AdminPayments
        businessId={business.id}
        suggestedAmount={total}
        payments={business.payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          periodYear: p.periodYear,
          periodMonth: p.periodMonth,
          method: p.method,
          paidAt: p.paidAt.toISOString(),
        }))}
      />
    </div>
  );
}

function Mini({
  label,
  value,
  hint,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: number | null;
}) {
  return (
    <div className="rounded-xl bg-surface-2 p-3">
      <div className="text-[11px] text-ink-muted">{label}</div>
      <div className="mt-0.5 break-words font-display text-base font-bold tabular-nums text-ink">{value}</div>
      {hint && (
        <div
          className={`mt-0.5 inline-flex items-center gap-0.5 text-[11px] ${
            trend == null ? "text-ink-muted" : trend >= 0 ? "text-brand-700 dark:text-brand-300" : "text-rose-600"
          }`}
        >
          {trend != null && (trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />)}
          {hint}
        </div>
      )}
    </div>
  );
}
