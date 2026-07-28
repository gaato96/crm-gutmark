import { Gift } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentBusiness } from "@/lib/queries";
import { pointsBalancesByCustomer } from "@/lib/points";
import { PageHeader, EmptyState } from "@/components/ui";
import { PointsConfigForm } from "@/components/points-config-form";
import { PointsRedeemRow } from "@/components/points-redeem-row";

export const dynamic = "force-dynamic";

export default async function PuntosPage() {
  const biz = await getCurrentBusiness();

  const [business, balances] = await Promise.all([
    db.business.findUnique({ where: { id: biz.id }, select: { pointsPerAmount: true } }),
    pointsBalancesByCustomer(biz.id),
  ]);

  const withBalance = [...balances.entries()].filter(([, pts]) => pts > 0);
  const customers = withBalance.length
    ? await db.customer.findMany({
        where: { id: { in: withBalance.map(([id]) => id) }, businessId: biz.id },
        select: { id: true, name: true },
      })
    : [];
  const nameById = new Map(customers.map((c) => [c.id, c.name]));

  const rows = withBalance
    .map(([customerId, points]) => ({ customerId, points, name: nameById.get(customerId) ?? "Cliente" }))
    .sort((a, b) => b.points - a.points);

  const totalOutstanding = rows.reduce((s, r) => s + r.points, 0);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Puntos y beneficios"
        subtitle="Programa de fidelización: tus clientes suman puntos con cada compra."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <PointsConfigForm pointsPerAmount={business?.pointsPerAmount ?? 1000} />
        <div className="card flex flex-col justify-center p-5">
          <div className="text-sm text-ink-muted">Puntos vigentes (todos los clientes)</div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-ink">{totalOutstanding}</div>
          <div className="mt-0.5 text-xs text-ink-muted">
            {rows.length} {rows.length === 1 ? "cliente con saldo" : "clientes con saldo"}
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Gift className="h-7 w-7" aria-hidden="true" />}
          title="Todavía nadie ganó puntos"
          description="Los puntos se suman solos con cada venta que registres. Volvé por acá cuando tus clientes empiecen a acumular."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="border-b border-line-soft px-5 py-4">
            <h2 className="font-bold text-ink">Clientes con saldo</h2>
          </div>
          <ul className="divide-y divide-line-soft">
            {rows.map((r) => (
              <PointsRedeemRow key={r.customerId} customerId={r.customerId} name={r.name} balance={r.points} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
