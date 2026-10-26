import "server-only";
import { db } from "./db";
import { periodRange, pctDelta } from "./cash";
import { campaignImpactBetween } from "./insights";
import { loadDailyPlan } from "./queries";
import { formatMoney } from "./format";
import { sendEmail, appUrl, emailLayout, escapeHtml } from "./email";
import { round2 } from "./sales";

// Resumen semanal para el dueño: un email los lunes con la semana que pasó y
// lo que tiene para hacer hoy. Es lo que hace que el sistema se sienta vivo
// aunque no lo abra todos los días — y lo que más baja la tasa de baja.
//
// Lo dispara el cron de Vercel (app/api/cron/resumen-semanal, ver vercel.json).
// No hay otro cron en el sistema: las campañas siguen calculándose al leer.

export interface WeeklySummary {
  businessName: string;
  greeting: string;
  weekLabel: string;
  ventas: number;
  facturacion: number;
  deltaFacturacion: number | null;
  clientesAtendidos: number;
  volvieron: number;
  volvieronMonto: number;
  mensajes: number;
  pendientesHoy: number;
  cumplesSemana: number;
}

export async function buildWeeklySummary(businessId: string): Promise<WeeklySummary | null> {
  const biz = await db.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      displayName: true,
      timezone: true,
      inactivityDays: true,
      recompraDays: true,
      vipMinSpend: true,
      catalogMode: true,
    },
  });
  if (!biz) return null;

  // "La semana pasada" es la semana calendario anterior, lunes a domingo, en
  // la hora del negocio: el email sale el lunes y habla de lo que ya cerró.
  const semana = periodRange("semana", 1, biz.timezone);
  const anterior = periodRange("semana", 2, biz.timezone);

  const [ventas, ventasAnt, mensajes, impact, plan, cumples] = await Promise.all([
    db.purchase.findMany({
      where: { businessId, date: { gte: semana.from, lt: semana.to } },
      select: { amount: true, customerId: true },
    }),
    db.purchase.aggregate({
      where: { businessId, date: { gte: anterior.from, lt: anterior.to } },
      _sum: { amount: true },
    }),
    db.contactLog.count({ where: { businessId, createdAt: { gte: semana.from, lt: semana.to } } }),
    campaignImpactBetween(businessId, semana.from, semana.to),
    loadDailyPlan(biz),
    db.customer.findMany({ where: { businessId, birthdate: { not: null } }, select: { birthdate: true } }),
  ]);

  const facturacion = round2(ventas.reduce((s, v) => s + v.amount, 0));
  const hoy = new Date();
  const cumplesSemana = cumples.filter((c) => {
    const b = c.birthdate!;
    for (let i = 0; i < 7; i++) {
      const d = new Date(hoy.getTime() + i * 86400000);
      if (d.getUTCMonth() === b.getUTCMonth() && d.getUTCDate() === b.getUTCDate()) return true;
    }
    return false;
  }).length;

  return {
    businessName: biz.name,
    greeting: biz.displayName || biz.name,
    weekLabel: semana.label,
    ventas: ventas.length,
    facturacion,
    deltaFacturacion: pctDelta(facturacion, ventasAnt._sum.amount ?? 0),
    clientesAtendidos: new Set(ventas.map((v) => v.customerId)).size,
    volvieron: impact.customers,
    volvieronMonto: round2(impact.revenue),
    mensajes,
    pendientesHoy: plan.pending,
    cumplesSemana,
  };
}

export function renderWeeklySummary(s: WeeklySummary, link: string): { subject: string; html: string; text: string } {
  const delta =
    s.deltaFacturacion === null
      ? ""
      : ` (${s.deltaFacturacion >= 0 ? "+" : ""}${Math.round(s.deltaFacturacion)}% vs. la anterior)`;
  const volvieron =
    s.volvieron > 0
      ? `${s.volvieron} ${s.volvieron === 1 ? "cliente volvió" : "clientes volvieron"} por tus mensajes y ${s.volvieron === 1 ? "dejó" : "dejaron"} ${formatMoney(s.volvieronMonto)}.`
      : s.mensajes > 0
        ? `Mandaste ${s.mensajes} mensajes. Las compras que vengan en los próximos 14 días se van a contar acá.`
        : "No mandaste mensajes la semana pasada. Esta semana es una buena para arrancar.";
  const hoy =
    s.pendientesHoy > 0
      ? `Hoy tenés ${s.pendientesHoy} ${s.pendientesHoy === 1 ? "cliente" : "clientes"} para escribirle${s.pendientesHoy === 1 ? "" : "s"}${s.cumplesSemana > 0 ? `, y ${s.cumplesSemana} ${s.cumplesSemana === 1 ? "cumple" : "cumplen"} años esta semana` : ""}.`
      : "Hoy no tenés mensajes pendientes. ¡Bien ahí!";

  const subject =
    s.volvieron > 0
      ? `Volvieron ${s.volvieron} clientes por tus mensajes · tu semana en Vuelvo`
      : `Tu semana en Vuelvo: ${formatMoney(s.facturacion)} en ventas`;

  const row = (label: string, value: string) =>
    `<tr><td style="padding:8px 0;color:#64748B;font-size:14px">${escapeHtml(label)}</td><td style="padding:8px 0;text-align:right;font-weight:700;font-size:15px">${escapeHtml(value)}</td></tr>`;

  const html = emailLayout({
    title: `Hola, ${s.greeting}`,
    body: `<p style="margin:0 0 6px">Así te fue la ${escapeHtml(s.weekLabel.toLowerCase())}:</p>
<table style="width:100%;border-collapse:collapse;margin:8px 0 16px">
${row("Ventas", `${formatMoney(s.facturacion)}${delta}`)}
${row("Cantidad de ventas", String(s.ventas))}
${row("Clientes atendidos", String(s.clientesAtendidos))}
${row("Mensajes enviados", String(s.mensajes))}
</table>
<p style="background:#E7F9F4;border-radius:12px;padding:12px 14px;margin:0 0 12px;color:#003E2C"><strong>${escapeHtml(volvieron)}</strong></p>
<p style="margin:0">${escapeHtml(hoy)}</p>`,
    cta: { label: s.pendientesHoy > 0 ? "Ver a quién escribirle" : "Abrir Vuelvo", href: link },
  });

  const text = [
    `Hola, ${s.greeting}`,
    "",
    `Así te fue la ${s.weekLabel.toLowerCase()}:`,
    `- Ventas: ${formatMoney(s.facturacion)}${delta}`,
    `- Cantidad de ventas: ${s.ventas}`,
    `- Clientes atendidos: ${s.clientesAtendidos}`,
    `- Mensajes enviados: ${s.mensajes}`,
    "",
    volvieron,
    hoy,
    "",
    link,
  ].join("\n");

  return { subject, html, text };
}

// Negocios a los que les toca el resumen: activos, reales, con el resumen
// prendido y que no lo recibieron en los últimos 6 días (el guardado es lo que
// permite reintentar sin mandar dos veces).
export async function sendWeeklySummaries(limit = 40): Promise<{ sent: number; skipped: number; pending: number }> {
  const sixDaysAgo = new Date(Date.now() - 6 * 86400000);
  const due = await db.business.findMany({
    where: {
      active: true,
      isDemo: false,
      weeklySummary: true,
      users: { some: { role: "owner" } },
      OR: [{ lastWeeklySummaryAt: null }, { lastWeeklySummaryAt: { lt: sixDaysAgo } }],
    },
    select: {
      id: true,
      users: { where: { role: "owner" }, orderBy: { createdAt: "asc" }, take: 1, select: { email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const base = await appUrl();
  let sent = 0;
  let skipped = 0;
  for (const b of due.slice(0, limit)) {
    const to = b.users[0]?.email;
    const summary = await buildWeeklySummary(b.id);
    if (!to || !summary) {
      skipped++;
      continue;
    }
    const mail = renderWeeklySummary(summary, `${base}/campanas`);
    const ok = await sendEmail({ to, ...mail });
    if (ok) {
      await db.business.update({ where: { id: b.id }, data: { lastWeeklySummaryAt: new Date() } });
      sent++;
    } else {
      skipped++;
    }
  }
  return { sent, skipped, pending: Math.max(0, due.length - limit) };
}
