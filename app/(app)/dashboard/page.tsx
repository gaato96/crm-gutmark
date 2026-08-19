import Link from "next/link";
import {
  Users,
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
  getCampaigns,
  getServices,
  ruleDefaults,
} from "@/lib/queries";
import { formatMoney } from "@/lib/format";
import { SEGMENT_META, Segment } from "@/lib/segmentation";
import { StatCard } from "@/components/stat-card";
import { SalesChart, SalesPoint } from "@/components/sales-chart";
import { PageHeader, Avatar, SegmentBadge, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

const DAY = 86400000;

function pctDelta(current: number, previous: number): number | undefined {
  if (previous === 0) return current > 0 ? 100 : undefined;
  return ((current - previous) / previous) * 100;
}

export default async function DashboardPage() {
  const biz = await getCurrentBusiness();
  const cfg = toConfig(biz);
  const customers = await getEnrichedCustomers(biz.id, cfg);
  const campaigns = await getCampaigns(biz.id);
  const stats = buildDashboard(
    customers,
    campaigns.filter((c) => c.active),
    ruleDefaults(biz, await getServices(biz.id))
  );

  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * DAY);
  const since60 = new Date(now.getTime() - 60 * DAY);

  const [purchasesLast30, purchasesPrev30] = await Promise.all([
    db.purchase.findMany({
      where: { businessId: biz.id, date: { gte: since30 } },
      select: { date: true, amount: true },
    }),
    db.purchase.aggregate({
      where: { businessId: biz.id, date: { gte: since60, lt: since30 } },
      _sum: { amount: true },
    }),
  ]);

  const last30Total = purchasesLast30.reduce((s, p) => s + p.amount, 0);
  const prev30Total = purchasesPrev30._sum.amount ?? 0;
  const salesDelta = pctDelta(last30Total, prev30Total);

  // Serie diaria para el gráfico
  const byDay = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY);
    byDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const p of purchasesLast30) {
    const key = new Date(p.date).toISOString().slice(0, 10);
    if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + p.amount);
  }
  const chartData: SalesPoint[] = [...byDay.entries()].map(([key, total]) => {
    const d = new Date(key + "T00:00:00");
    return {
      label: d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }),
      total,
    };
  });

  const newCustomers30 = customers.filter((c) => c.createdAt >= since30).length;
  const newCustomersPrev30 = customers.filter(
    (c) => c.createdAt >= since60 && c.createdAt < since30
  ).length;
  const customersDelta = pctDelta(newCustomers30, newCustomersPrev30);

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
          icon={<Users className="h-5 w-5" aria-hidden="true" />}
          delta={customersDelta}
          deltaLabel="clientes nuevos"
          hint={`${stats.activeCustomers} activos · ${stats.inactiveCustomers} inactivos`}
        />
        <StatCard
          label="Ticket promedio"
          value={formatMoney(stats.avgTicket)}
          tone="sky"
          icon={<Receipt className="h-5 w-5" aria-hidden="true" />}
          hint={
            stats.avgFrequencyDays
              ? `Compran cada ~${stats.avgFrequencyDays} días`
              : "Frecuencia de compra"
          }
        />
        <StatCard
          label="Ventas (30 días)"
          value={formatMoney(last30Total)}
          tone="brand"
          icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />}
          delta={salesDelta}
          hint={`${purchasesLast30.length} compras registradas`}
        />
        <StatCard
          label="Clientes VIP"
          value={stats.vipCustomers.toString()}
          tone="accent"
          icon={<Crown className="h-5 w-5" aria-hidden="true" />}
          hint={`Gastan más de ${formatMoney(cfg.vipMinSpend)}`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Ventas en el tiempo */}
          <div className="card p-5">
            <div className="mb-1 flex items-center justify-between">
              <SectionTitle hint="Últimos 30 días">Ventas</SectionTitle>
              {salesDelta !== undefined && (
                <span
                  className={`text-xs font-bold tabular-nums ${
                    salesDelta >= 0 ? "text-brand-600 dark:text-brand-400" : "text-rose-600"
                  }`}
                >
                  {salesDelta >= 0 ? "+" : ""}
                  {Math.round(salesDelta)}% vs. período anterior
                </span>
              )}
            </div>
            <SalesChart data={chartData} />
          </div>

          {/* Oportunidades de hoy */}
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
                Ver todo <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <OpportunityBlock
                title="Cumpleaños"
                icon={<Cake className="h-4 w-4" aria-hidden="true" />}
                tone="accent"
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
                icon={<RotateCcw className="h-4 w-4" aria-hidden="true" />}
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
                const pct = stats.totalCustomers
                  ? Math.round((count / stats.totalCustomers) * 100)
                  : 0;
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
                        className={`h-full rounded-full ${m.dot} transition-opacity group-hover:opacity-80`}
                        style={{ width: `${(count / maxSeg) * 100}%` }}
                      />
                    </div>
                    <div className="w-20 shrink-0 text-right text-sm text-ink-soft">
                      <span className="font-semibold tabular-nums text-ink">{count}</span>
                      <span className="ml-1 text-xs tabular-nums text-ink-muted">({pct}%)</span>
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
                  <div className="w-4 text-center text-sm font-bold tabular-nums text-ink-faint">
                    {i + 1}
                  </div>
                  <Avatar name={c.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ink">{c.name}</div>
                    <div className="text-xs text-ink-muted">{c.purchaseCount} compras</div>
                  </div>
                  <div className="text-right text-sm font-bold tabular-nums text-brand-700 dark:text-brand-400">
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
  tone: "accent" | "brand";
  items: { id: string; name: string; hint: string }[];
  empty: string;
  total: number;
}) {
  const toneCls = tone === "accent" ? "bg-accent-500/10 text-accent-600" : "bg-brand-500/10 text-brand-600";
  return (
    <div className="rounded-xl border border-line/70 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${toneCls}`}>{icon}</span>
        <span className="text-sm font-semibold text-ink">{title}</span>
        {total > 0 && (
          <span className="ml-auto rounded-full bg-surface-2 px-2 py-0.5 text-xs font-bold tabular-nums text-ink-soft">
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
