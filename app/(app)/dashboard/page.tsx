import Link from "next/link";
import {
  Users,
  Receipt,
  Crown,
  Cake,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  Send,
  CheckCircle2,
  Repeat,
  Hourglass,
  UserCheck,
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
  getCampaignContacts,
  coveringContact,
} from "@/lib/queries";
import { matchesCampaign } from "@/lib/campaigns";
import { campaignImpact, moneyAtStake } from "@/lib/insights";
import { zonedDayKey } from "@/lib/tz";
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
  const [customers, campaigns, services, contacts, impact] = await Promise.all([
    getEnrichedCustomers(biz.id, cfg),
    getCampaigns(biz.id),
    getServices(biz.id),
    getCampaignContacts(biz.id),
    campaignImpact(biz.id),
  ]);
  const defaults = ruleDefaults(biz, services);
  const activeCampaigns = campaigns.filter((c) => c.active);
  const stats = buildDashboard(customers, activeCampaigns, defaults, contacts);
  const stake = moneyAtStake(customers);

  // Plan del día: por campaña, cuántos faltan y cuántos ya recibieron el
  // mensaje en este ciclo. Es lo primero que se ve: el panel no es un reporte,
  // es la lista de cosas que hoy traen plata.
  const pendingSet = new Set<string>();
  const sentSet = new Set<string>();
  const plan = activeCampaigns
    .map((c) => {
      let pending = 0;
      let sent = 0;
      for (const cu of customers) {
        if (!matchesCampaign(cu, c, defaults)) continue;
        if (coveringContact(contacts, c, cu)) {
          sent++;
          sentSet.add(cu.id);
        } else {
          pending++;
          pendingSet.add(cu.id);
        }
      }
      return { id: c.id, name: c.name, pending, sent };
    })
    .filter((p) => p.pending + p.sent > 0)
    .sort((a, b) => b.pending - a.pending);
  for (const id of pendingSet) sentSet.delete(id);
  const planTotal = pendingSet.size + sentSet.size;
  const planPct = planTotal ? Math.round((sentSet.size / planTotal) * 100) : 0;

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

  // Serie diaria para el gráfico, por día calendario del negocio: con
  // toISOString (UTC) las ventas de después de las 21:00 caían al día siguiente.
  const byDay = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    byDay.set(zonedDayKey(new Date(now.getTime() - i * DAY), biz.timezone), 0);
  }
  for (const p of purchasesLast30) {
    const key = zonedDayKey(new Date(p.date), biz.timezone);
    if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + p.amount);
  }
  const chartData: SalesPoint[] = [...byDay.entries()].map(([key, total]) => ({
    label: `${key.slice(8, 10)}/${key.slice(5, 7)}`,
    total,
  }));

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
  const todayLabel = now.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: biz.timezone,
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Hola, ${biz.name}`}
        subtitle={`${todayLabel.charAt(0).toUpperCase()}${todayLabel.slice(1)} · Esto es lo que hoy te puede traer ventas.`}
      />

      {/* Plan de hoy, compacto: una franja y no media pantalla. Antes ocupaba
          casi todo el primer scroll y tapaba el resto del panel. */}
      <section aria-labelledby="plan-hoy" className="card mb-4 flex flex-col overflow-hidden lg:flex-row">
        <div className="grain relative flex items-center gap-4 overflow-hidden bg-gradient-to-br from-accent-600 to-accent-800 px-5 py-4 text-white lg:w-[24rem] lg:shrink-0">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-400/20 blur-2xl" />
          <div className="relative min-w-0">
            <h2
              id="plan-hoy"
              className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-100"
            >
              Tu plan de hoy
            </h2>
            <p className="mt-0.5 flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold tabular-nums">{pendingSet.size}</span>
              <span className="text-sm font-medium text-accent-100">
                {pendingSet.size === 1 ? "cliente para contactar" : "clientes para contactar"}
              </span>
            </p>
            {planTotal > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-brand-400" style={{ width: `${planPct}%` }} />
                </div>
                <span className="whitespace-nowrap text-[11px] font-medium text-accent-100">
                  {sentSet.size} de {planTotal} contactados
                </span>
              </div>
            )}
          </div>
          <Link
            href="/campanas"
            className="btn relative ml-auto shrink-0 bg-white !px-4 !py-2.5 text-sm text-accent-700 hover:bg-accent-50"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            {pendingSet.size > 0 ? "Enviar" : "Ver"}
          </Link>
        </div>
        <div className="flex-1 p-2.5">
          {plan.length === 0 ? (
            <p className="px-2.5 py-3 text-sm text-ink-muted">
              Ninguna campaña activa tiene clientes hoy.
            </p>
          ) : (
            <ul className="grid gap-1 sm:grid-cols-2 xl:grid-cols-3">
              {plan.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link
                    href="/campanas"
                    className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition hover:bg-surface-2"
                  >
                    {p.pending === 0 ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                    ) : (
                      <Send className="h-4 w-4 shrink-0 text-accent-600 dark:text-accent-300" aria-hidden="true" />
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{p.name}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                        p.pending === 0
                          ? "bg-brand-500/15 text-brand-700 dark:text-brand-300"
                          : "bg-surface-2 text-ink-soft"
                      }`}
                      title={`${p.pending} por enviar · ${p.sent} enviados`}
                    >
                      {p.pending === 0 ? "Listo" : p.pending}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Lo que está en juego, en plata y en clientes del propio negocio */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <ValueCard
          tone="brand"
          icon={<Repeat className="h-5 w-5" aria-hidden="true" />}
          label="Volvieron por tus mensajes"
          value={formatMoney(impact.revenue)}
          detail={
            impact.customers > 0
              ? `${impact.customers} ${impact.customers === 1 ? "cliente compró" : "clientes compraron"} dentro de los 14 días de recibir un mensaje (últimos 30 días).`
              : "Cuando mandes mensajes desde Campañas, acá vas a ver cuánta plata vuelve gracias a eso."
          }
        />
        <ValueCard
          tone="accent"
          icon={<Hourglass className="h-5 w-5" aria-hidden="true" />}
          label="Recompra pendiente"
          value={formatMoney(stake.dueRevenue)}
          detail={`${stake.dueCustomers} ${stake.dueCustomers === 1 ? "cliente ya debería" : "clientes ya deberían"} haber vuelto. Si cada uno vuelve una vez, entra esto.`}
        />
        <ValueCard
          tone="sky"
          icon={<UserCheck className="h-5 w-5" aria-hidden="true" />}
          label="Clientes que vuelven"
          value={stake.repeatRate === null ? "—" : `${Math.round(stake.repeatRate * 100)}%`}
          detail={
            stake.repeatRate === null
              ? "Cuando registres ventas, acá vas a ver cuántos de tus clientes vuelven a comprar."
              : `De los que te compraron, este porcentaje volvió al menos una vez. Tenés ${stake.inactiveCustomers} inactivos para recuperar desde Campañas.`
          }
        />
      </div>

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

function ValueCard({
  tone,
  icon,
  label,
  value,
  detail,
}: {
  tone: "brand" | "accent" | "sky";
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  const tones = {
    brand: "bg-brand-500/12 text-brand-700 dark:text-brand-300",
    accent: "bg-accent-500/10 text-accent-600 dark:text-accent-300",
    sky: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  };
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2.5">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
          {icon}
        </span>
        <span className="text-sm font-semibold text-ink-soft">{label}</span>
      </div>
      <div className="mt-3 break-words font-display text-xl font-bold tabular-nums text-ink lg:text-2xl">{value}</div>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">{detail}</p>
    </div>
  );
}
