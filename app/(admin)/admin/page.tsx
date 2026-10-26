import Link from "next/link";
import {
  Building2,
  Plus,
  Wallet,
  LogIn,
  AlertTriangle,
  CalendarClock,
  MessageSquareWarning,
  TrendingUp,
  TrendingDown,
  Star,
  Search,
} from "lucide-react";
import { db } from "@/lib/db";
import { formatMoney, formatDate } from "@/lib/format";
import { type BillingStatus } from "@/lib/platform";
import { PageHeader, EmptyState } from "@/components/ui";
import { ImpersonateButton } from "@/components/admin-actions-buttons";
import { rubroLabel } from "@/lib/rubros";
import { AdminDemoAccounts } from "@/components/admin-demo-accounts";
import { DEMO_PASSWORD } from "@/lib/demo-data";
import { getBusinessHealth, type BusinessHealthRow } from "@/lib/admin-crm";
import { HEALTH_META, crmStageMeta } from "@/lib/admin-crm-meta";
import { matchesSearch } from "@/lib/search";

export const dynamic = "force-dynamic";
// Restaurar una cuenta demo genera miles de filas: le damos margen a la
// Server Action, que hereda la configuración de esta página.
export const maxDuration = 60;

const STATUS_META: Record<BillingStatus, { label: string; cls: string }> = {
  "al-dia": { label: "Al día", cls: "bg-brand-500/15 text-brand-700 ring-brand-500/25 dark:text-brand-300" },
  pendiente: { label: "Pendiente", cls: "bg-accent-500/15 text-accent-700 ring-accent-500/25 dark:text-accent-300" },
  vencido: { label: "Vencido", cls: "bg-rose-500/15 text-rose-600 ring-rose-500/25" },
  exento: { label: "Exento", cls: "bg-surface-3 text-ink-muted ring-line" },
};

const FILTERS = [
  { code: "todos", label: "Todos" },
  { code: "riesgo", label: "En riesgo" },
  { code: "atencion", label: "Atención" },
  { code: "seguimiento", label: "Contactar hoy" },
  { code: "fundadores", label: "Fundadores" },
  { code: "prueba", label: "En prueba" },
  { code: "baja", label: "Pausados y bajas" },
] as const;

function applyFilter(rows: BusinessHealthRow[], f: string): BusinessHealthRow[] {
  switch (f) {
    case "riesgo":
      return rows.filter((r) => r.health === "riesgo");
    case "atencion":
      return rows.filter((r) => r.health === "atencion");
    case "seguimiento":
      return rows.filter((r) => r.followUpDue);
    case "fundadores":
      return rows.filter((r) => r.isFounder);
    case "prueba":
      return rows.filter((r) => r.crmStage === "prueba");
    case "baja":
      return rows.filter((r) => r.crmStage === "pausado" || r.crmStage === "baja" || !r.active);
    default:
      return rows.filter((r) => r.crmStage !== "baja");
  }
}

// Los que más necesitan atención, primero: rojo, después amarillo, y dentro
// de cada grupo el que hace más que no vende.
const HEALTH_ORDER = { riesgo: 0, atencion: 1, bien: 2 } as const;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string; q?: string }>;
}) {
  const { f = "todos", q = "" } = await searchParams;
  const [{ rows }, demos, revenueAll, openFeedback] = await Promise.all([
    getBusinessHealth(),
    db.business.findMany({
      where: { isDemo: true },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { customers: true, purchases: true } },
        users: { where: { role: "owner" }, take: 1, select: { email: true } },
      },
    }),
    db.purchase.aggregate({ where: { business: { isDemo: false } }, _sum: { amount: true } }),
    db.feedback.count({ where: { status: { not: "resuelto" }, business: { isDemo: false } } }),
  ]);

  const live = rows.filter((r) => r.active && r.crmStage !== "baja");
  // Lo que se cobra todos los meses: sin exentos ni negocios en prueba.
  const mrr = live.reduce((s, r) => s + (r.billing === "exento" ? 0 : r.monthly), 0);
  const enPrueba = live.filter((r) => r.inTrial);
  const enRiesgo = live.filter((r) => r.health === "riesgo").length;
  const contactarHoy = live.filter((r) => r.followUpDue).length;
  const sales30 = live.reduce((s, r) => s + r.sales30, 0);
  const salesPrev30 = live.reduce((s, r) => s + r.salesPrev30, 0);
  const growth = salesPrev30 > 0 ? Math.round(((sales30 - salesPrev30) / salesPrev30) * 100) : null;

  const visible = applyFilter(rows, f)
    .filter((r) => !q.trim() || matchesSearch(`${r.name} ${r.owner?.name ?? ""} ${r.owner?.email ?? ""}`, q))
    .sort(
      (a, b) =>
        HEALTH_ORDER[a.health] - HEALTH_ORDER[b.health] ||
        (a.lastSaleAt?.getTime() ?? 0) - (b.lastSaleAt?.getTime() ?? 0)
    );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Negocios"
        subtitle={`${live.length} activos · cómo viene cada uno, quién necesita una llamada y qué hay que cobrar.`}
        action={
          <Link href="/admin/negocios/nuevo" className="btn-primary">
            <Plus className="h-4 w-4" aria-hidden="true" /> Nuevo negocio
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi
          label="MRR (plan + módulos)"
          value={formatMoney(mrr)}
          hint={
            enPrueba.length
              ? `+ ${formatMoney(enPrueba.reduce((s, r) => s + r.monthly, 0))} si pasan a pago los ${enPrueba.length} en prueba`
              : `${live.length} negocios activos`
          }
        />
        <Kpi
          label="Ventas de los negocios"
          value={formatMoney(sales30)}
          hint={growth === null ? "Últimos 30 días" : `${growth >= 0 ? "+" : ""}${growth}% vs. 30 días anteriores`}
          tone={growth !== null && growth < 0 ? "bad" : "good"}
        />
        <Kpi label="En riesgo" value={String(enRiesgo)} hint="Llamalos esta semana" tone={enRiesgo ? "bad" : undefined} href="/admin?f=riesgo" />
        <Kpi label="Contactar hoy" value={String(contactarHoy)} hint="Seguimiento vencido" href="/admin/seguimiento" />
        <Kpi label="Reportes abiertos" value={String(openFeedback)} hint="Problemas e ideas" tone={openFeedback ? "warn" : undefined} href="/admin/soporte" />
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="inline-flex max-w-full overflow-x-auto rounded-xl bg-surface-2 p-1">
          {FILTERS.map((x) => (
            <Link
              key={x.code}
              href={`/admin?f=${x.code}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                f === x.code ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink-soft"
              }`}
            >
              {x.label}
            </Link>
          ))}
        </div>
        <form className="relative lg:ml-auto lg:w-72">
          <input type="hidden" name="f" value={f} />
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input name="q" defaultValue={q} placeholder="Buscar negocio o dueño…" className="input !py-2 !pl-9" />
        </form>
      </div>

      {rows.length === 0 ? (
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
      ) : visible.length === 0 ? (
        <p className="card px-5 py-10 text-center text-sm text-ink-muted">Ningún negocio en este filtro.</p>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="border-b border-line-soft bg-surface-2/60 text-left">
                  <th className="px-4 py-3 font-semibold text-ink-soft">Negocio</th>
                  <th className="px-4 py-3 font-semibold text-ink-soft">Salud</th>
                  <th className="px-4 py-3 font-semibold text-ink-soft">Ventas 30 días</th>
                  <th className="px-4 py-3 font-semibold text-ink-soft">Uso</th>
                  <th className="px-4 py-3 font-semibold text-ink-soft">$/mes · pago</th>
                  <th className="px-4 py-3 font-semibold text-ink-soft">Seguimiento</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const stage = crmStageMeta(r.crmStage);
                  const h = HEALTH_META[r.health];
                  return (
                    <tr key={r.id} className="border-b border-line-soft align-top last:border-0 hover:bg-surface-2/40">
                      <td className="px-4 py-3">
                        <Link href={`/admin/negocios/${r.id}`} className="group">
                          <div className="flex items-center gap-1.5 font-semibold text-ink group-hover:underline">
                            {r.isFounder && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" aria-label="Fundador" />}
                            {r.name}
                          </div>
                          <div className="text-xs text-ink-muted">
                            {rubroLabel(r.rubro)} · {r.owner?.name || r.owner?.email || "sin dueño"}
                          </div>
                        </Link>
                        <span className={`badge mt-1 ${stage.cls}`}>{stage.label}</span>
                      </td>
                      <td className="max-w-[16rem] px-4 py-3">
                        <span className={`badge ${h.cls}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${h.dot}`} /> {h.label}
                        </span>
                        {r.reasons.length > 0 && (
                          <ul className="mt-1 space-y-0.5 text-xs text-ink-muted">
                            {r.reasons.slice(0, 2).map((x) => (
                              <li key={x}>· {x}</li>
                            ))}
                            {r.reasons.length > 2 && <li>· y {r.reasons.length - 2} más</li>}
                          </ul>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold tabular-nums text-ink">{formatMoney(r.sales30)}</div>
                        {r.growth30 !== null && (
                          <div
                            className={`inline-flex items-center gap-0.5 text-xs font-bold tabular-nums ${
                              r.growth30 >= 0 ? "text-brand-700 dark:text-brand-300" : "text-rose-600"
                            }`}
                          >
                            {r.growth30 >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {r.growth30 >= 0 ? "+" : ""}
                            {Math.round(r.growth30)}%
                          </div>
                        )}
                        <div className="text-xs text-ink-muted">{r.sales7Count} ventas en 7 días</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-muted">
                        <div>Última venta: {r.lastSaleAt ? formatDate(r.lastSaleAt) : "nunca"}</div>
                        <div>Último ingreso: {r.owner?.lastLoginAt ? formatDate(r.owner.lastLoginAt) : "nunca"}</div>
                        <div>
                          {r.customers} clientes · {r.messages7} mensajes en 7 días
                        </div>
                        {r.openFeedback > 0 && (
                          <div className="mt-0.5 inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-300">
                            <MessageSquareWarning className="h-3 w-3" /> {r.openFeedback} reporte(s)
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="tabular-nums text-ink-soft">{formatMoney(r.monthly)}</div>
                        {r.inTrial ? (
                          <span className="badge mt-1 bg-sky-500/15 text-sky-700 ring-sky-500/25 dark:text-sky-300">
                            Prueba{r.trialEndsAt ? ` hasta ${formatDate(r.trialEndsAt)}` : ""}
                          </span>
                        ) : (
                          <span className={`badge mt-1 ${STATUS_META[r.billing].cls}`}>{STATUS_META[r.billing].label}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {r.followUpDue ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-accent-700 dark:text-accent-300">
                            <CalendarClock className="h-3.5 w-3.5" /> Contactar hoy
                          </span>
                        ) : (
                          <span className="text-ink-muted">
                            {r.nextFollowUpAt ? `Próximo: ${formatDate(r.nextFollowUpAt)}` : "—"}
                          </span>
                        )}
                        <div className="mt-0.5 text-ink-faint">
                          Último contacto: {r.lastContactAt ? formatDate(r.lastContactAt) : "nunca"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <ImpersonateButton
                            businessId={r.id}
                            disabled={!r.owner}
                            label={
                              <>
                                <LogIn className="h-3.5 w-3.5" aria-hidden="true" /> Entrar
                              </>
                            }
                          />
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

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
          Facturado por todos los negocios desde el alta: {formatMoney(revenueAll._sum.amount ?? 0)} (sin demos).
        </span>
        <span className="inline-flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
          En riesgo = más de 5 días sin cargar ventas, más de 10 sin entrar o el mes vencido.
        </span>
      </div>

      <div className="mt-10">
        <AdminDemoAccounts
          password={DEMO_PASSWORD}
          rows={demos.map((d) => ({
            id: d.id,
            name: d.name,
            rubro: d.rubro,
            email: d.users[0]?.email ?? null,
            customers: d._count.customers,
            purchases: d._count.purchases,
          }))}
        />
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  tone,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "good" | "bad" | "warn";
  href?: string;
}) {
  const valueCls =
    tone === "bad" ? "text-rose-600" : tone === "warn" ? "text-amber-700 dark:text-amber-300" : "text-ink";
  const body = (
    <>
      <div className="text-xs text-ink-muted">{label}</div>
      <div className={`mt-1.5 break-words font-display text-xl font-bold tabular-nums ${valueCls}`}>{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-ink-muted">{hint}</div>}
    </>
  );
  return href ? (
    <Link href={href} className="card p-4 transition hover:bg-surface-2">
      {body}
    </Link>
  ) : (
    <div className="card p-4">{body}</div>
  );
}
