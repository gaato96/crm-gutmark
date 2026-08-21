import "server-only";
import { db } from "./db";
import { round2 } from "./sales";
import { pctDelta, type Period } from "./cash";

export interface ReportRow {
  label: string;
  amount: number;
  count: number;
}

export interface PeriodReport {
  facturacion: number;
  costos: number;
  neto: number;
  ventas: number;
  ticketPromedio: number;
  descuentos: number;
  // Clientes distintos que compraron en el período.
  clientes: number;
  // De esos, cuántos compraban por primera vez. Es el número que conecta la
  // caja con la razón de ser del sistema: facturar más siempre con gente nueva
  // significa que no estás fidelizando.
  clientesNuevos: number;
  clientesRecurrentes: number;
  porServicio: ReportRow[];
  porEmpleado: ReportRow[];
  porMetodoPago: ReportRow[];
  costosPorConcepto: ReportRow[];
  // Facturación por día de la semana (0 = lunes) y por hora, para saber
  // cuándo conviene tener más gente atendiendo.
  porDiaSemana: ReportRow[];
  porHora: ReportRow[];
}

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function toRows(map: Map<string, { amount: number; count: number }>): ReportRow[] {
  return [...map.entries()]
    .map(([label, v]) => ({ label, amount: round2(v.amount), count: v.count }))
    .sort((a, b) => b.amount - a.amount);
}

function bump(
  map: Map<string, { amount: number; count: number }>,
  key: string,
  amount: number
) {
  const cur = map.get(key) ?? { amount: 0, count: 0 };
  cur.amount += amount;
  cur.count += 1;
  map.set(key, cur);
}

export async function buildPeriodReport(
  businessId: string,
  period: Period
): Promise<PeriodReport> {
  const [purchases, costs] = await Promise.all([
    db.purchase.findMany({
      where: { businessId, date: { gte: period.from, lt: period.to } },
      include: {
        items: { select: { name: true, subtotal: true } },
        employee: { select: { name: true } },
      },
    }),
    db.saleCost.findMany({
      where: { businessId, date: { gte: period.from, lt: period.to } },
      select: { label: true, amount: true },
    }),
  ]);

  const facturacion = round2(purchases.reduce((s, p) => s + p.amount, 0));
  const descuentos = round2(purchases.reduce((s, p) => s + p.discount, 0));
  const costos = round2(costs.reduce((s, c) => s + c.amount, 0));

  const porServicio = new Map<string, { amount: number; count: number }>();
  const porEmpleado = new Map<string, { amount: number; count: number }>();
  const porMetodoPago = new Map<string, { amount: number; count: number }>();
  const porDiaSemana = new Map<string, { amount: number; count: number }>();
  const porHora = new Map<string, { amount: number; count: number }>();
  const costosPorConcepto = new Map<string, { amount: number; count: number }>();

  const clientes = new Set<string>();
  for (const p of purchases) {
    clientes.add(p.customerId);

    for (const it of p.items) bump(porServicio, it.name, it.subtotal);
    bump(porEmpleado, p.employee?.name ?? "Sin asignar", p.amount);
    bump(porMetodoPago, p.paymentMethod, p.amount);

    const d = new Date(p.date);
    const dow = d.getDay();
    bump(porDiaSemana, DIAS[dow === 0 ? 6 : dow - 1], p.amount);
    bump(porHora, `${String(d.getHours()).padStart(2, "0")}:00`, p.amount);
  }
  for (const c of costs) bump(costosPorConcepto, c.label, c.amount);

  // Un cliente es "nuevo" si su primera compra de la historia cayó dentro del
  // período. Se mira contra el historial completo, no contra el período: si no,
  // cualquiera que no hubiera comprado esta semana contaría como nuevo.
  let clientesNuevos = 0;
  if (clientes.size > 0) {
    const primeras = await db.purchase.groupBy({
      by: ["customerId"],
      where: { businessId, customerId: { in: [...clientes] } },
      _min: { date: true },
    });
    for (const row of primeras) {
      const first = row._min.date;
      if (first && first >= period.from && first < period.to) clientesNuevos++;
    }
  }

  return {
    facturacion,
    costos,
    neto: round2(facturacion - costos),
    ventas: purchases.length,
    ticketPromedio: purchases.length ? round2(facturacion / purchases.length) : 0,
    descuentos,
    clientes: clientes.size,
    clientesNuevos,
    clientesRecurrentes: clientes.size - clientesNuevos,
    porServicio: toRows(porServicio),
    porEmpleado: toRows(porEmpleado),
    porMetodoPago: toRows(porMetodoPago),
    costosPorConcepto: toRows(costosPorConcepto),
    // Estos dos NO se ordenan por monto: el orden cronológico es la
    // información (ver en qué franja se concentra la facturación).
    porDiaSemana: DIAS.map((d) => ({
      label: d,
      amount: round2(porDiaSemana.get(d)?.amount ?? 0),
      count: porDiaSemana.get(d)?.count ?? 0,
    })),
    porHora: [...porHora.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, v]) => ({ label, amount: round2(v.amount), count: v.count })),
  };
}

export interface ReportComparison {
  actual: PeriodReport;
  anterior: PeriodReport;
  deltaFacturacion: number | null;
  deltaNeto: number | null;
  deltaTicket: number | null;
  deltaVentas: number | null;
}

export async function buildComparison(
  businessId: string,
  actual: Period,
  anterior: Period
): Promise<ReportComparison> {
  const [a, b] = await Promise.all([
    buildPeriodReport(businessId, actual),
    buildPeriodReport(businessId, anterior),
  ]);

  return {
    actual: a,
    anterior: b,
    deltaFacturacion: pctDelta(a.facturacion, b.facturacion),
    deltaNeto: pctDelta(a.neto, b.neto),
    deltaTicket: pctDelta(a.ticketPromedio, b.ticketPromedio),
    deltaVentas: pctDelta(a.ventas, b.ventas),
  };
}

// Cuánto se le debe a cada empleado en el período: la suma de sus comisiones
// TODAVÍA NO PAGADAS. Es la respuesta a "cuánto le tengo que pagar hoy a cada
// uno" — si ya se le pagó una venta del período, no tiene sentido que siga
// apareciendo acá.
export async function commissionsByEmployee(
  businessId: string,
  period: Period
): Promise<{ employeeId: string | null; name: string; amount: number; ventas: number }[]> {
  const rows = await db.saleCost.findMany({
    where: {
      businessId,
      kind: "comision",
      date: { gte: period.from, lt: period.to },
      paidAt: null,
    },
    select: { employeeId: true, label: true, amount: true, employee: { select: { name: true } } },
  });

  const map = new Map<string, { employeeId: string | null; name: string; amount: number; ventas: number }>();
  for (const r of rows) {
    const key = r.employeeId ?? r.label;
    const cur = map.get(key) ?? {
      employeeId: r.employeeId,
      // Si el empleado fue borrado, queda el nombre congelado en la etiqueta.
      name: r.employee?.name ?? r.label.replace(/^Comisión /, ""),
      amount: 0,
      ventas: 0,
    };
    cur.amount = round2(cur.amount + r.amount);
    cur.ventas += 1;
    map.set(key, cur);
  }

  return [...map.values()].sort((a, b) => b.amount - a.amount);
}

// Cuánto le debe el negocio a cada empleado en total, sin cortar por período:
// la suma de TODAS sus comisiones sin pagar desde que existe. Es lo que se
// muestra en la tarjeta de cada integrante del equipo, y lo que se salda de
// un saque al tocar "Marcar pagado".
export async function commissionDebtByEmployee(businessId: string): Promise<Map<string, number>> {
  const rows = await db.saleCost.groupBy({
    by: ["employeeId"],
    where: { businessId, kind: "comision", paidAt: null, employeeId: { not: null } },
    _sum: { amount: true },
  });
  return new Map(rows.map((r) => [r.employeeId!, round2(r._sum.amount ?? 0)]));
}
