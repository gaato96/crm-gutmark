import Link from "next/link";
import {
  Users,
  UserCheck,
  Receipt,
  Crown,
  Cake,
  RotateCcw,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  getCurrentBusiness,
  getEnrichedCustomers,
  buildDashboard,
  toConfig,
} from "@/lib/queries";
import { formatMoney } from "@/lib/format";
import { SEGMENT_META, Segment } from "@/lib/segmentation";
import { StatCard } from "@/components/stat-card";
import { PageHeader, Avatar, SegmentBadge, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const biz = await getCurrentBusiness();
  const cfg = toConfig(biz);
  const customers = await getEnrichedCustomers(biz.id, cfg);
  const stats = buildDashboard(customers);

  const since30 = new Date(Date.now() - 30 * 86400000);
  const last30 = await db.purchase.aggregate({
    where: { businessId: biz.id, date: { gte: since30 } },
    _sum: { amount: true },
    _count: true,
  });

  const birthdaysSoon = customers
    .filter((c) => c.birthdayInDays !== null && c.birthdayInDays <= 7)
    .sort((a, b) => (a.birthdayInDays ?? 99) - (b.birthdayInDays ?? 99));

  const winback = customers
    .filter((c) => c.needsWinback && c.segment !== "inactivo")
    .sort((a, b) => (b.daysSinceLast ?? 0) - (a.daysSinceLast ?? 0));

  const topVip = [...customers]
    .filter((c) => c.isVip)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  const segments = Object.keys(SEGMENT_META) as Segment[];
  const maxSeg = Math.max(1, ...segments.map((s) => stats.segmentCounts[s]));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Hola, ${biz.name} 👋`}
        subtitle="Este es el resumen de tu cartera de clientes y las oportunidades de venta de hoy."
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Clientes totales"
          value={stats.totalCustomers.toString()}
          icon={<Users className="h-5 w-5" />}
          hint={`${stats.activeCustomers} activos · ${stats.inactiveCustomers} inactivos`}
        />
        <StatCard
          label="Ticket promedio"
          value={formatMoney(stats.avgTicket)}
          tone="sky"
          icon={<Receipt className="h-5 w-5" />}
          hint={
            stats.avgFrequencyDays
              ? `Compran cada ~${stats.avgFrequencyDays} días`
              : "Frecuencia de compra"
          }
        />
        <StatCard
          label="Ventas (30 días)"
          value={formatMoney(last30._sum.amount ?? 0)}
          tone="brand"
          icon={<TrendingUp className="h-5 w-5" />}
          hint={`${last30._count} compras registradas`}
        />
        <StatCard
          label="Clientes VIP"
          value={stats.vipCustomers.toString()}
          tone="gold"
          icon={<Crown className="h-5 w-5" />}
          hint={`Gastan más de ${formatMoney(cfg.vipMinSpend)}`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Oportunidades de hoy */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-ink">Oportunidades de hoy</h2>
                <p className="text-sm text-ink-muted">
                  {stats.pendingReminders > 0
                    ? `${stats.pendingReminders} clientes que podés contactar ahora.`
                    : "No hay acciones pendientes por ahora."}
                </p>
              </div>
              <Link href="/recordatorios" className="btn-secondary !py-2 text-xs">
                Ver todo <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <OpportunityBlock
                title="Cumpleaños"
                icon={<Cake className="h-4 w-4" />}
                tone="gold"
                empty="Sin cumpleaños esta semana"
                items={birthdaysSoon.slice(0, 3).map((c) => ({
                  id: c.id,
                  name: c.name,
                  hint:
                    c.birthdayInDays === 0
                      ? "¡Es hoy! 🎉"
                      : c.birthdayInDays === 1
                      ? "Mañana"
                      : `En ${c.birthdayInDays} días`,
                }))}
                total={birthdaysSoon.length}
              />
              <OpportunityBlock
                title="Hora de que vuelvan"
                icon={<RotateCcw className="h-4 w-4" />}
                tone="brand"
                empty="Nadie pendiente de recompra"
                items={winback.slice(0, 3).map((c) => ({
                  id: c.id,
                  name: c.name,
                  hint: `Hace ${c.daysSinceLast} días`,
                }))}
                total={winback.length}
              />
            </div>
          </div>

          {/* Distribución por segmento */}
          <div className="card p-5">
            <SectionTitle hint={`${stats.totalCustomers} clientes`}>
              Distribución por segmento
            </SectionTitle>
            <div className="space-y-3">
              {segments.map((s) => {
                const count = stats.segmentCounts[s];
                const m = SEGMENT_META[s];
                return (
                  <Link
                    key={s}
                    href={`/segmentos?s=${s}`}
                    className="group flex items-center gap-3"
                  >
                    <div className="w-20 shrink-0">
                      <SegmentBadge segment={s} />
                    </div>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className={`h-full rounded-full ${m.dot} transition-all group-hover:opacity-80`}
                        style={{ width: `${(count / maxSeg) * 100}%` }}
                      />
                    </div>
                    <div className="w-8 shrink-0 text-right text-sm font-semibold text-ink">
                      {count}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top VIP */}
        <div className="card p-5">
          <SectionTitle hint="Por gasto acumulado">Tus mejores clientes</SectionTitle>
          {topVip.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">
              Todavía no hay clientes VIP.
            </p>
          ) : (
            <div className="space-y-1">
              {topVip.map((c, i) => (
                <Link
                  key={c.id}
                  href={`/clientes/${c.id}`}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-surface-2"
                >
                  <div className="w-4 text-center text-sm font-bold text-ink-faint">
                    {i + 1}
                  </div>
                  <Avatar name={c.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ink">{c.name}</div>
                    <div className="text-xs text-ink-muted">{c.purchaseCount} compras</div>
                  </div>
                  <div className="text-right text-sm font-bold text-brand-700 dark:text-brand-400">
                    {formatMoney(c.totalSpent)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OpportunityBlock({
  title,
  icon,
  tone,
  items,
  empty,
  total,
}: {
  title: string;
  icon: React.ReactNode;
  tone: "gold" | "brand";
  items: { id: string; name: string; hint: string }[];
  empty: string;
  total: number;
}) {
  const toneCls = tone === "gold" ? "bg-gold-500/10 text-gold-600" : "bg-brand-500/10 text-brand-600";
  return (
    <div className="rounded-xl border border-line/70 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${toneCls}`}>{icon}</span>
        <span className="text-sm font-semibold text-ink">{title}</span>
        {total > 0 && (
          <span className="ml-auto rounded-full bg-surface-2 px-2 py-0.5 text-xs font-bold text-ink-soft">
            {total}
          </span>
        )}
      </div>
      {items.length === 0 ? (
        <p className="py-2 text-sm text-ink-muted">{empty}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((it) => (
            <li key={it.id}>
              <Link
                href={`/clientes/${it.id}`}
                className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition hover:bg-surface-2"
              >
                <Avatar name={it.name} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                  {it.name}
                </span>
                <span className="shrink-0 text-xs font-medium text-ink-muted">{it.hint}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
