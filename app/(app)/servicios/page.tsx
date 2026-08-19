import { getCurrentBusiness, getServices } from "@/lib/queries";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { ServicesView, type ServiceItem } from "@/components/services-view";

export const dynamic = "force-dynamic";

export default async function ServiciosPage() {
  const biz = await getCurrentBusiness();
  const services = await getServices(biz.id);

  // Cuántas veces se vendió cada uno, para que el negocio vea qué le funciona
  // y para avisar antes de borrar algo que ya tiene historia.
  const sold = await db.purchaseItem.groupBy({
    by: ["serviceId"],
    where: { businessId: biz.id, serviceId: { not: null } },
    _count: { _all: true },
  });
  const soldById = new Map(sold.map((s) => [s.serviceId!, s._count._all]));

  const items: ServiceItem[] = services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    price: s.price,
    category: s.category,
    recompraDays: s.recompraDays,
    active: s.active,
    timesSold: soldById.get(s.id) ?? 0,
  }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Servicios y productos"
        subtitle="Cargá lo que vendés con su precio. Después lo elegís al registrar una venta y podés armar campañas por servicio."
      />
      <ServicesView services={items} recompraDaysDefault={biz.recompraDays} />
    </div>
  );
}
