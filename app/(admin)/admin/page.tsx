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
import { PageHeader, EmptyState } from "@/components/ui";
import { ImpersonateButton, ToggleActiveButton } from "@/components/admin-actions-buttons";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const businesses = await db.business.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { customers: true } },
      users: {
        where: { role: "owner" },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { email: true, name: true, lastLoginAt: true },
      },
      purchases: { select: { amount: true } },
    },
  });

  const totalRevenue = businesses.reduce(
    (s, b) => s + b.purchases.reduce((s2, p) => s2 + p.amount, 0),
    0
  );
  const activeCount = businesses.filter((b) => b.active).length;

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

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
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
        <div className="card p-5 col-span-2 sm:col-span-1">
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
                  <th className="px-5 py-3 font-semibold text-ink-soft">Clientes</th>
                  <th className="px-5 py-3 font-semibold text-ink-soft">Último ingreso</th>
                  <th className="px-5 py-3 font-semibold text-ink-soft">Estado</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {businesses.map((b) => {
                  const owner = b.users[0];
                  return (
                    <tr key={b.id} className="border-b border-line-soft last:border-0">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-ink">{b.name}</div>
                        <div className="text-xs text-ink-muted">{b.rubro}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-ink-soft">{owner?.name || "—"}</div>
                        <div className="text-xs text-ink-muted">{owner?.email ?? "sin usuario"}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-ink-soft">
                          <Users className="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />
                          <span className="tabular-nums">{b._count.customers}</span>
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
