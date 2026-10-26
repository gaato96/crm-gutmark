import { db } from "@/lib/db";
import { getCurrentBusiness } from "@/lib/queries";
import { PageHeader } from "@/components/ui";
import { StockView } from "@/components/stock-view";
import type { StockItemRow, StockMovementRow } from "@/lib/stock";

export const dynamic = "force-dynamic";

const DAY = 86400000;

export default async function StockPage() {
  const biz = await getCurrentBusiness();
  const since30 = new Date(Date.now() - 30 * DAY);

  // Entran los productos y cualquier ítem al que se le haya activado el
  // control: un negocio de servicios puede querer contar, por ejemplo, las
  // ampollas que usa en un tratamiento.
  const [services, sold, movements, cajaAbierta] = await Promise.all([
    db.service.findMany({
      where: { businessId: biz.id, OR: [{ kind: "producto" }, { trackStock: true }] },
      orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    }),
    db.purchaseItem.groupBy({
      by: ["serviceId"],
      where: { businessId: biz.id, serviceId: { not: null }, date: { gte: since30 } },
      _sum: { quantity: true },
    }),
    db.stockMovement.findMany({
      where: { businessId: biz.id },
      orderBy: { createdAt: "desc" },
      take: 80,
      include: { service: { select: { name: true } } },
    }),
    biz.modules.includes("caja")
      ? db.cashSession.findFirst({
          where: { businessId: biz.id, closedAt: null },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  const soldById = new Map(sold.map((s) => [s.serviceId!, s._sum.quantity ?? 0]));

  const items: StockItemRow[] = services.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    sku: s.sku,
    price: s.price,
    cost: s.cost,
    stock: s.stock,
    minStock: s.minStock,
    active: s.active,
    trackStock: s.trackStock,
    sold30: soldById.get(s.id) ?? 0,
  }));

  const rows: StockMovementRow[] = movements.map((m) => ({
    id: m.id,
    createdAt: m.createdAt.toISOString(),
    kind: m.kind,
    quantity: m.quantity,
    stockAfter: m.stockAfter,
    unitCost: m.unitCost,
    supplier: m.supplier,
    note: m.note,
    serviceName: m.service.name,
    paidFromCash: Boolean(m.cashMovementId),
  }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Stock"
        subtitle="Cuánto te queda de cada producto, qué reponer y cuánta plata tenés en mercadería. Cada venta descuenta sola."
      />
      <StockView
        items={items}
        movements={rows}
        hasCaja={biz.modules.includes("caja")}
        cajaAbierta={Boolean(cajaAbierta)}
        businessName={biz.name}
      />
    </div>
  );
}
