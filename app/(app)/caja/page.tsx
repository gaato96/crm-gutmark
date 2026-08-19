import { db } from "@/lib/db";
import { getCurrentBusiness } from "@/lib/queries";
import { currentCashSession } from "@/lib/cash-write";
import { cashExpected, periodRange } from "@/lib/cash";
import { commissionsByEmployee } from "@/lib/reports";
import { PageHeader } from "@/components/ui";
import { CajaView, type CajaData } from "@/components/caja-view";

export const dynamic = "force-dynamic";

export default async function CajaPage() {
  const biz = await getCurrentBusiness();
  const abierta = await currentCashSession(biz.id);

  const movimientos = abierta
    ? await db.cashMovement.findMany({
        where: { sessionId: abierta.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // El esperado se calcula al vuelo mientras la caja está abierta; recién al
  // cerrar se congela en la fila.
  const totals = abierta
    ? cashExpected({
        openingAmount: abierta.openingAmount,
        movements: movimientos.map((m) => ({
          kind: m.kind,
          amount: m.amount,
          paymentMethod: m.paymentMethod,
        })),
      })
    : null;

  const [empleados, reglas, cierres, comisionesHoy] = await Promise.all([
    db.employee.findMany({
      where: { businessId: biz.id },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    db.costRule.findMany({
      where: { businessId: biz.id },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    db.cashSession.findMany({
      where: { businessId: biz.id, closedAt: { not: null } },
      orderBy: { closedAt: "desc" },
      take: 10,
    }),
    commissionsByEmployee(biz.id, periodRange("semana")),
  ]);

  const usados = await db.saleCost.groupBy({
    by: ["employeeId"],
    where: { businessId: biz.id, employeeId: { not: null } },
    _count: { _all: true },
  });
  const ventasPorEmpleado = new Map(usados.map((u) => [u.employeeId!, u._count._all]));

  const data: CajaData = {
    sesion: abierta
      ? {
          id: abierta.id,
          openedAt: abierta.openedAt.toISOString(),
          openingAmount: abierta.openingAmount,
          notes: abierta.notes,
        }
      : null,
    totales: totals,
    movimientos: movimientos.map((m) => ({
      id: m.id,
      kind: m.kind,
      amount: m.amount,
      paymentMethod: m.paymentMethod,
      description: m.description,
      createdAt: m.createdAt.toISOString(),
    })),
    empleados: empleados.map((e) => ({
      id: e.id,
      name: e.name,
      commissionPct: e.commissionPct,
      active: e.active,
      ventas: ventasPorEmpleado.get(e.id) ?? 0,
    })),
    reglas: reglas.map((r) => ({
      id: r.id,
      name: r.name,
      kind: r.kind,
      value: r.value,
      paymentMethod: r.paymentMethod,
      active: r.active,
    })),
    cierres: cierres.map((c) => ({
      id: c.id,
      closedAt: c.closedAt!.toISOString(),
      expectedAmount: c.expectedAmount ?? 0,
      countedAmount: c.countedAmount ?? 0,
      difference: c.difference ?? 0,
    })),
    comisionesSemana: comisionesHoy,
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Caja"
        subtitle="Abrí la caja al empezar el día y cerrala contando la plata. Las ventas entran solas."
      />
      <CajaView data={data} />
    </div>
  );
}
