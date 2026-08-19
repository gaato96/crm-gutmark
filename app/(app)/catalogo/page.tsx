import { getCurrentBusiness, getServices } from "@/lib/queries";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { ServicesView, type ServiceItem } from "@/components/services-view";
import { catalogWords } from "@/lib/rubros";

export const dynamic = "force-dynamic";

export default async function CatalogoPage() {
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

  const words = catalogWords(biz.catalogMode);

  const items: ServiceItem[] = services.map((s) => ({
    id: s.id,
    name: s.name,
    kind: s.kind,
    description: s.description,
    price: s.price,
    category: s.category,
    recompraDays: s.recompraDays,
    active: s.active,
    timesSold: soldById.get(s.id) ?? 0,
  }));

  return (
    <div className="animate-fade-in">
      <PageHeader title={words.title} subtitle={words.subtitle} />
      <ServicesView
        services={items}
        recompraDaysDefault={biz.recompraDays}
        catalogMode={biz.catalogMode}
      />
    </div>
  );
}
