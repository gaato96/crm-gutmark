import "server-only";
import { db } from "./db";
import { presetFor } from "./rubro-presets";
import { recordSale } from "./sale-write";
import { currentCashSession } from "./cash-write";
import { DEFAULT_TZ, zonedParts } from "./tz";
import { dayStart, hash, mulberry32, randInt, weekdayIndex, weighted, type Clock } from "./demo-data";

const HOUR = 3600000;

// Ventas "de hoy" en una cuenta demo.
//
// refreshDemoDates corre las fechas por días enteros, así que el "hoy" de una
// demo es siempre una copia del momento en que se generó: si se generó a las
// 4 de la mañana, hoy nunca tendría ventas. Esto completa las ventas de las
// horas de atención que ya pasaron, con la misma cantidad diaria que usa el
// generador, y por el camino real de una venta (recordSale): caja, comisiones
// y puntos quedan coherentes.
//
// Se llama con after() desde el layout del panel: no frena la respuesta, y lo
// cargado aparece en la siguiente pantalla. Es idempotente por cantidad — si
// ya hay tantas ventas como corresponde a esta hora, no hace nada.
export async function topUpDemoToday(businessId: string): Promise<number> {
  const biz = await db.business.findUnique({
    where: { id: businessId },
    select: { isDemo: true, rubro: true, timezone: true, inactivityDays: true },
  });
  if (!biz?.isDemo) return 0;
  const profile = presetFor(biz.rubro).demo;
  if (!profile) return 0;

  const tz = biz.timezone || DEFAULT_TZ;
  const now = new Date();
  const clock: Clock = { now, tz, today: zonedParts(now, tz) };
  const w = profile.weekdays[weekdayIndex(clock, 0)];
  if (w === 0) return 0;

  const start = dayStart(clock, 0).getTime();
  const elapsedHours = profile.hours.filter(([h]) => start + (h + 1) * HOUR <= now.getTime());
  if (elapsedHours.length === 0) return 0;
  const totalWeight = profile.hours.reduce((s, [, hw]) => s + hw, 0);
  const elapsedWeight = elapsedHours.reduce((s, [, hw]) => s + hw, 0);

  // La meta del día sale de una semilla fija por fecha: todas las visitas del
  // mismo día calculan el mismo número.
  const rng = mulberry32(hash(`${businessId}:live:${clock.today.year}-${clock.today.month}-${clock.today.day}`));
  const avgWeekday =
    profile.weekdays.reduce((s, x) => s + x, 0) / profile.weekdays.filter((x) => x > 0).length;
  const dailyTarget = Math.round(randInt(rng, profile.dailySales[0], profile.dailySales[1]) * (w / avgWeekday));
  const target = Math.round((dailyTarget * elapsedWeight) / totalWeight);

  const existing = await db.purchase.count({ where: { businessId, date: { gte: new Date(start) } } });
  const missing = Math.min(12, target - existing);
  if (missing <= 0) return 0;

  const [services, employees, candidates] = await Promise.all([
    db.service.findMany({ where: { businessId, active: true } }),
    db.employee.findMany({ where: { businessId, active: true } }),
    // Clientes activos que no compraron en la última semana: los que
    // naturalmente vuelven hoy.
    db.customer.findMany({
      where: {
        businessId,
        lastPurchaseAt: {
          lt: new Date(now.getTime() - 7 * 86400000),
          gt: new Date(now.getTime() - biz.inactivityDays * 86400000),
        },
      },
      select: { id: true, lastPurchaseAt: true },
      take: 200,
    }),
  ]);
  if (candidates.length === 0) return 0;

  // Si el negocio usa Caja y todavía no abrió la de hoy, se abre: si no, las
  // ventas en efectivo no tendrían dónde caer.
  const hasCaja = await db.businessModule.findFirst({
    where: { businessId, moduleCode: "caja", enabled: true },
    select: { id: true },
  });
  if (hasCaja && !(await currentCashSession(businessId))) {
    const firstHour = Math.min(...profile.hours.map(([h]) => h));
    await db.cashSession.create({
      data: { businessId, openedAt: new Date(start + firstHour * HOUR - 20 * 60000), openingAmount: 20000 },
    });
  }

  const pickRng = mulberry32(hash(`${businessId}:${now.getTime()}`));
  const payments = Object.entries(profile.payments) as [string, number][];
  const weightOf = (name: string) => presetFor(biz.rubro).services.find((s) => s.name === name)?.weight ?? 1;
  const used = new Set<string>();
  let created = 0;

  for (let i = 0; i < missing; i++) {
    const c = candidates[Math.floor(pickRng() * candidates.length)];
    if (used.has(c.id)) continue;
    used.add(c.id);

    const [h] = weighted(pickRng, elapsedHours, ([, hw]) => hw);
    const date = new Date(start + h * HOUR + randInt(pickRng, 0, 55) * 60000);
    if (date.getTime() > now.getTime() - 5 * 60000) continue;

    const svc = services.length ? weighted(pickRng, services, (s) => weightOf(s.name)) : null;
    await recordSale({
      businessId,
      customerId: c.id,
      items: svc ? [{ serviceId: svc.id, name: svc.name, unitPrice: svc.price, quantity: 1 }] : [],
      freeAmount: svc ? null : randInt(pickRng, 5, 30) * 1000,
      paymentMethod: weighted(pickRng, payments, ([, pw]) => pw)[0],
      employeeId: employees.length ? employees[Math.floor(pickRng() * employees.length)].id : null,
      date,
    });
    created++;
  }
  return created;
}
