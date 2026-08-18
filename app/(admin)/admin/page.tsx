import Link from "next/link";
import {
  Building2,
  Plus,
  Users,
  Wallet,
  Clock,
  LogIn,
  Ban,
  CheckCircle2,
} from "lucide-react";
import { db } from "@/lib/db";
import { formatMoney, formatDate } from "@/lib/format";
import { getPlatformSettings, businessMonthlyTotal, billingStatus, type BillingStatus } from "@/lib/platform";
import { PageHeader, EmptyState } from "@/components/ui";
import { ImpersonateButton, ToggleActiveButton } from "@/components/admin-actions-buttons";

export const dynamic = "force-dynamic";

const STATUS_META: Record<BillingStatus, { label: string; cls: string }> = {
  "al-dia": { label: "Al día", cls: "bg-brand-500/15 text-brand-700 ring-brand-500/25 dark:text-brand-300" },
  pendiente: { label: "Pendiente", cls: "bg-accent-500/15 text-accent-700 ring-accent-500/25 dark:text-accent-300" },
  vencido: { label: "Vencido", cls: "bg-rose-500/15 text-rose-600 ring-rose-500/25" },
  exento: { label: "Exento", cls: "bg-surface-3 text-ink-muted ring-line" },
};

export default async function AdminPage() {
  const now = new Date();
  const [businesses, revenueByBusiness, settings] = await Promise.all([
    db.business.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { customers: true } },
        users: {
          where: { role: "owner" },
          orderBy: { createdAt: "asc" },
          take: 1,
          select: { email: true, name: true, lastLoginAt: true },
        },
        modules: { where: { enabled: true }, include: { module: true } },
        payments: {
          where: { periodYear: now.getFullYear(), periodMonth: now.getMonth() + 1 },
          select: { id: true },
        },
      },
    }),
    db.purchase.groupBy({ by: ["businessId"], _sum: { amount: true } }),
    getPlatformSettings(),
  ]);

  const revenueMap = new Map(revenueByBusiness.map((r) => [r.businessId, r._sum.amount ?? 0]));
  const totalRevenue = revenueByBusiness.reduce((s, r) => s + (r._sum.amount ?? 0), 0);
  const activeCount = businesses.filter((b) => b.active).length;
  const mrr = businesses.reduce(
    (s, b) => s + businessMonthlyTotal(settings.basePlanPrice, b.modules),
    0
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Negocios"
        subtitle={`${businesses.length} cuentas · ${activeCount} activas`}
        action={
          <Link href="/admin/negocios/nuevo" className="btn-primary">
            <Plus className="h-4 w-4" aria-hidden="true" /> Nuevo negocio
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card p-5">
          <div className="text-sm text-ink-muted">Negocios totales</div>
          <div className="mt-2 text-2xl font-bold tabular-nums text-ink">
            {businesses.length}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-ink-muted">Activos</div>
          <div className="mt-2 text-2xl font-bold tabular-nums text-brand-600 dark:text-brand-400">
            {activeCount}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-ink-muted">MRR (plan + módulos)</div>
          <div className="mt-2 text-2xl font-bold tabular-nums text-ink">
            {formatMoney(mrr)}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-ink-muted">Facturado (todos)</div>
          <div className="mt-2 text-2xl font-bold tabular-nums text-ink">
            {formatMoney(totalRevenue)}
          </div>
        </div>
      </div>

      {businesses.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-7 w-7" aria-hidden="true" />}
          title="Todavía no cargaste ningún negocio"
          description="Cuando alguien te pida acceso, creá su cuenta acá."
          action={
            <Link href="/admin/negocios/nuevo" className="btn-primary">
              <Plus className="h-4 w-4" aria-hidden="true" /> Nuevo negocio
            </Link>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line-soft bg-surface-2/60 text-left">
                  <th className="px-5 py-3 font-semibold text-ink-soft">Negocio</th>
                  <th className="px-5 py-3 font-semibold text-ink-soft">Dueño</th>
                  <th className="px-5 py-3 font-semibold text-ink-soft">Módulos</th>
                  <th className="px-5 py-3 font-semibold text-ink-soft">$/mes</th>
                  <th className="px-5 py-3 font-semibold text-ink-soft">Pago</th>
                  <th className="px-5 py-3 font-semibold text-ink-soft">Último ingreso</th>
                  <th className="px-5 py-3 font-semibold text-ink-soft">Estado</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {businesses.map((b) => {
                  const owner = b.users[0];
                  const total = businessMonthlyTotal(settings.basePlanPrice, b.modules);
                  const status = billingStatus({
                    billingExempt: b.billingExempt,
                    hasPaidCurrentPeriod: b.payments.length > 0,
                    dueDay: settings.dueDay,
                  });
                  return (
                    <tr key={b.id} className="border-b border-line-soft last:border-0 hover:bg-surface-2/40">
                      <td className="px-5 py-3.5">
                        <Link href={`/admin/negocios/${b.id}`} className="hover:underline">
                          <div className="font-semibold text-ink">{b.name}</div>
                          <div className="text-xs text-ink-muted">{b.rubro}</div>
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-ink-soft">{owner?.name || "—"}</div>
                        <div className="text-xs text-ink-muted">{owner?.email ?? "sin usuario"}</div>
                        <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink-faint">
                          <Users className="h-3 w-3" aria-hidden="true" />
                          <span className="tabular-nums">{b._count.customers}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {b.modules.length === 0 ? (
                          <span className="text-xs text-ink-faint">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {b.modules.map((m) => (
                              <span key={m.moduleCode} className="badge bg-surface-3 text-ink-soft ring-line">
                                {m.module.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 tabular-nums text-ink-soft">
                        {formatMoney(total)}
                        <div className="text-xs text-ink-faint">{formatMoney(revenueMap.get(b.id) ?? 0)} facturado</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`badge ${STATUS_META[status].cls}`}>
                          {STATUS_META[status].label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-ink-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />
                          {owner?.lastLoginAt ? formatDate(owner.lastLoginAt) : "Nunca"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {b.active ? (
                          <span className="badge bg-brand-500/15 text-brand-700 ring-brand-500/25 dark:text-brand-300">
                            <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Activo
                          </span>
                        ) : (
                          <span className="badge bg-rose-500/10 text-rose-600 ring-rose-500/20">
                            <Ban className="h-3 w-3" aria-hidden="true" /> Suspendido
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-2">
                          <ImpersonateButton
                            businessId={b.id}
                            disabled={!owner}
                            label={
                              <>
                                <LogIn className="h-3.5 w-3.5" aria-hidden="true" /> Entrar como
                              </>
                            }
                          />
                          <ToggleActiveButton businessId={b.id} active={b.active} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-1.5 text-xs text-ink-muted">
        <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
        Los montos incluyen todo el historial cargado por cada negocio.
      </div>
    </div>
  );
}
