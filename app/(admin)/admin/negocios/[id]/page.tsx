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
import { AdminPayments } from "@/components/admin-payments";

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
        subtitle={business.rubro}
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
            <span className={`badge ${statusMeta[status].cls}`}>{statusMeta[status].label}</span>
          </div>
        </div>
      </div>

      <div className="mb-6 card p-5">
        <div className="mb-1 text-sm text-ink-muted">Dueño de la cuenta</div>
        <div className="font-semibold text-ink">{owner?.name || "—"}</div>
        <div className="text-sm text-ink-muted">{owner?.email ?? "Sin usuario dueño"}</div>
      </div>

      <SectionTitle hint="Se cobra aparte del plan base">Módulos</SectionTitle>
      <div className="mb-6">
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
