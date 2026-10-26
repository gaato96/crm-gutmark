import "server-only";
import { db } from "./db";
import { getPlatformSettings, businessMonthlyTotal, billingStatus, type BillingStatus } from "./platform";
import { pctDelta } from "./cash";
import { formatMoney } from "./format";
import { ACTIVATION_MIN_CUSTOMERS } from "./activation";
import type { Health, AdminAudience } from "./admin-crm-meta";

// El "CRM del CRM": cómo viene cada negocio cliente, calculado al leer como
// todo lo demás del sistema (no hay tabla de métricas que se pueda
// desincronizar). Una pasada de groupBy por métrica para TODOS los negocios a
// la vez, en vez de una consulta por negocio: con 50 negocios son ~12
// consultas y no 600.

const DAY = 86400000;

// Días sin cargar una venta para considerar que un negocio "dejó de usarlo".
// Es el número del Programa Fundadores (docs/marketing/programa-fundadores.md).
export const RISK_DAYS_WITHOUT_SALE = 5;
const RISK_DAYS_WITHOUT_LOGIN = 10;

export interface BusinessHealthRow {
  id: string;
  name: string;
  rubro: string;
  phone: string | null;
  active: boolean;
  createdAt: Date;
  crmStage: string;
  isFounder: boolean;
  trialEndsAt: Date | null;
  nextFollowUpAt: Date | null;
  owner: { name: string | null; email: string; lastLoginAt: Date | null } | null;
  modules: string[];
  monthly: number;
  billing: BillingStatus;
  inTrial: boolean;
  customers: number;
  lastSaleAt: Date | null;
  sales7: number;
  sales7Count: number;
  salesPrev7: number;
  sales30: number;
  salesPrev30: number;
  growth30: number | null;
  messages7: number;
  messages14: number;
  messages30: number;
  openFeedback: number;
  lastContactAt: Date | null;
  // Toca contactarlo: venció el seguimiento agendado o pasaron más de
  // followUpDays desde el último contacto (o nunca se lo contactó).
  followUpDue: boolean;
  health: Health;
  reasons: string[];
}

function daysSince(d: Date | null, now: number): number | null {
  return d ? Math.floor((now - d.getTime()) / DAY) : null;
}

export async function getBusinessHealth(opts: { ids?: string[] } = {}): Promise<{
  rows: BusinessHealthRow[];
  followUpDays: number;
}> {
  const settings = await getPlatformSettings();
  const now = Date.now();
  const d7 = new Date(now - 7 * DAY);
  const d14 = new Date(now - 14 * DAY);
  const d30 = new Date(now - 30 * DAY);
  const d60 = new Date(now - 60 * DAY);
  const today = new Date();

  const businesses = await db.business.findMany({
    where: {
      isDemo: false,
      // El negocio interno del superadmin no es un cliente.
      users: { none: { role: "superadmin" } },
      ...(opts.ids ? { id: { in: opts.ids } } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      rubro: true,
      phone: true,
      active: true,
      createdAt: true,
      crmStage: true,
      isFounder: true,
      trialEndsAt: true,
      nextFollowUpAt: true,
      billingExempt: true,
      users: {
        where: { role: "owner" },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { name: true, email: true, lastLoginAt: true },
      },
      modules: { where: { enabled: true }, include: { module: true } },
      payments: {
        where: { periodYear: today.getFullYear(), periodMonth: today.getMonth() + 1 },
        select: { id: true },
      },
      _count: { select: { customers: true } },
    },
  });
  const ids = businesses.map((b) => b.id);
  if (ids.length === 0) return { rows: [], followUpDays: settings.followUpDays };

  const inIds = { businessId: { in: ids } };
  const sumBy = (from: Date, to?: Date) =>
    db.purchase.groupBy({
      by: ["businessId"],
      where: { ...inIds, date: { gte: from, ...(to ? { lt: to } : {}) } },
      _sum: { amount: true },
      _count: { _all: true },
    });
  const msgsBy = (from: Date) =>
    db.contactLog.groupBy({ by: ["businessId"], where: { ...inIds, createdAt: { gte: from } }, _count: { _all: true } });

  const [lastSale, s7, sp7, s30, sp30, m7, m14, m30, fb, notes] = await Promise.all([
    db.purchase.groupBy({ by: ["businessId"], where: inIds, _max: { date: true } }),
    sumBy(d7),
    sumBy(d14, d7),
    sumBy(d30),
    sumBy(d60, d30),
    msgsBy(d7),
    msgsBy(d14),
    msgsBy(d30),
    db.feedback.groupBy({ by: ["businessId"], where: { ...inIds, status: { not: "resuelto" } }, _count: { _all: true } }),
    db.adminNote.groupBy({ by: ["businessId"], where: inIds, _max: { createdAt: true } }),
  ]);

  const mapOf = <T extends { businessId: string }, V>(rows: T[], pick: (r: T) => V) =>
    new Map(rows.map((r) => [r.businessId, pick(r)]));
  const lastSaleMap = mapOf(lastSale, (r) => r._max.date);
  const s7Map = mapOf(s7, (r) => ({ sum: r._sum.amount ?? 0, count: r._count._all }));
  const sp7Map = mapOf(sp7, (r) => r._sum.amount ?? 0);
  const s30Map = mapOf(s30, (r) => r._sum.amount ?? 0);
  const sp30Map = mapOf(sp30, (r) => r._sum.amount ?? 0);
  const m7Map = mapOf(m7, (r) => r._count._all);
  const m14Map = mapOf(m14, (r) => r._count._all);
  const m30Map = mapOf(m30, (r) => r._count._all);
  const fbMap = mapOf(fb, (r) => r._count._all);
  const notesMap = mapOf(notes, (r) => r._max.createdAt);

  const rows = businesses.map((b): BusinessHealthRow => {
    const owner = b.users[0] ?? null;
    // Mientras dura la prueba no se cobra: no es "exento" para siempre, pero
    // tampoco debe el mes ni suma al MRR. Y un negocio dado de alta este mes
    // no puede estar vencido por un día de vencimiento que pasó antes de que
    // existiera.
    const inTrial = b.crmStage === "prueba" && (!b.trialEndsAt || b.trialEndsAt.getTime() > now);
    const createdThisMonth =
      b.createdAt.getFullYear() === today.getFullYear() && b.createdAt.getMonth() === today.getMonth();
    const rawBilling = billingStatus({
      billingExempt: b.billingExempt || inTrial,
      hasPaidCurrentPeriod: b.payments.length > 0,
      dueDay: settings.dueDay,
    });
    const billing: BillingStatus = rawBilling === "vencido" && createdThisMonth ? "pendiente" : rawBilling;
    const lastSaleAt = lastSaleMap.get(b.id) ?? null;
    const sales30 = s30Map.get(b.id) ?? 0;
    const salesPrev30 = sp30Map.get(b.id) ?? 0;
    const sales7 = s7Map.get(b.id)?.sum ?? 0;
    const salesPrev7 = sp7Map.get(b.id) ?? 0;
    const messages7 = m7Map.get(b.id) ?? 0;
    const messages14 = m14Map.get(b.id) ?? 0;
    const openFeedback = fbMap.get(b.id) ?? 0;
    const lastContactAt = notesMap.get(b.id) ?? null;
    const ageDays = daysSince(b.createdAt, now) ?? 0;

    // --- Semáforo -----------------------------------------------------------
    // Rojo es "si no lo llamás esta semana, se va". Amarillo, "algo no está
    // del todo bien". Cada razón se muestra tal cual: el semáforo solo no dice
    // qué hacer.
    const red: string[] = [];
    const amber: string[] = [];
    const sinVenta = daysSince(lastSaleAt, now);
    const sinIngreso = daysSince(owner?.lastLoginAt ?? null, now);
    if (b.crmStage !== "baja" && b.active) {
      if (sinVenta === null) {
        if (ageDays > 7) red.push(`Nunca cargó una venta (alta hace ${ageDays} días)`);
        else amber.push("Todavía no cargó ventas");
      } else if (sinVenta > RISK_DAYS_WITHOUT_SALE) {
        red.push(`Hace ${sinVenta} días que no carga ventas`);
      }
      if (sinIngreso === null) red.push("El dueño nunca entró");
      else if (sinIngreso > RISK_DAYS_WITHOUT_LOGIN) red.push(`Hace ${sinIngreso} días que no entra`);
      if (billing === "vencido") red.push("Debe el mes (vencido)");
      if (openFeedback > 0) amber.push(`${openFeedback} ${openFeedback === 1 ? "reporte abierto" : "reportes abiertos"}`);
      if (b._count.customers < ACTIVATION_MIN_CUSTOMERS && ageDays > 7) {
        amber.push(`Solo ${b._count.customers} clientes cargados`);
      }
      if (messages14 === 0 && ageDays > 7) amber.push("No mandó mensajes en 14 días");
      const d = pctDelta(sales7, salesPrev7);
      if (d !== null && d <= -30 && salesPrev7 > 0) amber.push(`Ventas de la semana ${Math.round(d)}%`);
      if (b.trialEndsAt && b.trialEndsAt.getTime() - now < 5 * DAY && b.trialEndsAt.getTime() > now) {
        amber.push(`La prueba termina el ${b.trialEndsAt.toLocaleDateString("es-AR")}`);
      }
    }
    const health: Health = red.length ? "riesgo" : amber.length ? "atencion" : "bien";

    const nextDue = b.nextFollowUpAt
      ? b.nextFollowUpAt.getTime() <= now
      : !lastContactAt || now - lastContactAt.getTime() >= settings.followUpDays * DAY;

    return {
      id: b.id,
      name: b.name,
      rubro: b.rubro,
      phone: b.phone,
      active: b.active,
      createdAt: b.createdAt,
      crmStage: b.crmStage,
      isFounder: b.isFounder,
      trialEndsAt: b.trialEndsAt,
      nextFollowUpAt: b.nextFollowUpAt,
      owner,
      modules: b.modules.map((m) => m.moduleCode),
      monthly: businessMonthlyTotal(settings.basePlanPrice, b.modules),
      billing,
      inTrial,
      customers: b._count.customers,
      lastSaleAt,
      sales7,
      sales7Count: s7Map.get(b.id)?.count ?? 0,
      salesPrev7,
      sales30,
      salesPrev30,
      growth30: pctDelta(sales30, salesPrev30),
      messages7,
      messages14,
      messages30: m30Map.get(b.id) ?? 0,
      openFeedback,
      lastContactAt,
      followUpDue: b.active && b.crmStage !== "baja" && nextDue,
      health,
      reasons: [...red, ...amber],
    };
  });

  return { rows, followUpDays: settings.followUpDays };
}

export function matchesAudience(row: BusinessHealthRow, audience: AdminAudience | string): boolean {
  if (!row.active || row.crmStage === "baja") return false;
  switch (audience) {
    case "todos":
      return true;
    case "riesgo":
      return row.health === "riesgo";
    case "atencion":
      return row.health === "atencion";
    case "fundadores":
      return row.isFounder;
    case "prueba":
      return row.crmStage === "prueba";
    case "sin-mensajes":
      return row.messages14 === 0;
    case "creciendo":
      return row.growth30 !== null && row.growth30 > 0 && row.salesPrev30 > 0;
    case "sin-pagar":
      return row.billing === "pendiente" || row.billing === "vencido";
    default:
      return false;
  }
}

export function adminMessageVars(row: BusinessHealthRow): Record<string, string> {
  const first = (row.owner?.name ?? "").trim().split(/\s+/)[0];
  return {
    "dueño": first || row.name,
    dueno: first || row.name,
    negocio: row.name,
    ventas_semana: formatMoney(row.sales7),
    ventas_mes: formatMoney(row.sales30),
    crecimiento:
      row.growth30 === null ? "sin datos del mes anterior" : `${row.growth30 >= 0 ? "+" : ""}${Math.round(row.growth30)}%`,
    mensajes_semana: String(row.messages7),
    clientes: String(row.customers),
  };
}

// Teléfono para wa.me: solo dígitos, con 54 adelante si parece un número
// argentino cargado sin código de país.
export function whatsappNumber(phone: string | null): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (!digits.startsWith("54")) digits = `54${digits}`;
  return digits;
}

// Último envío de cada campaña a cada negocio, para saber a quién le toca de
// nuevo (pasaron `everyDays`) y a quién no.
export async function adminCampaignSends(): Promise<Map<string, Map<string, Date>>> {
  const rows = await db.adminNote.groupBy({
    by: ["campaignId", "businessId"],
    where: { campaignId: { not: null } },
    _max: { createdAt: true },
  });
  const out = new Map<string, Map<string, Date>>();
  for (const r of rows) {
    if (!r.campaignId || !r._max.createdAt) continue;
    const m = out.get(r.campaignId) ?? new Map<string, Date>();
    m.set(r.businessId, r._max.createdAt);
    out.set(r.campaignId, m);
  }
  return out;
}
