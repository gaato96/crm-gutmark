import { getCurrentBusiness } from "@/lib/queries";
import { periodRange, type PeriodKind } from "@/lib/cash";
import { buildComparison, commissionsByEmployee } from "@/lib/reports";
import { periodSales, SALES_DETAIL_LIMIT } from "@/lib/cash-read";
import { PageHeader } from "@/components/ui";
import { ReportesView } from "@/components/reportes-view";

export const dynamic = "force-dynamic";

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
  const kind: PeriodKind = p === "mes" ? "mes" : "semana";

  const biz = await getCurrentBusiness();
  const actual = periodRange(kind, 0);
  const anterior = periodRange(kind, 1);

  const [comparacion, comisiones, ventas] = await Promise.all([
    buildComparison(biz.id, actual, anterior),
    commissionsByEmployee(biz.id, actual),
    // Las ventas una por una, con cliente e ítems: los cortes de arriba dicen
    // cuánto entró, pero no a quién se le vendió ni qué se llevó.
    periodSales(biz.id, actual),
  ]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Reportes"
        subtitle="Cómo viene el negocio esta semana y este mes, comparado con el período anterior."
      />
      <ReportesView
        kind={kind}
        periodLabel={actual.label}
        anteriorLabel={anterior.label}
        data={comparacion}
        comisiones={comisiones}
        ventas={ventas}
        ventasLimite={SALES_DETAIL_LIMIT}
        catalogMode={biz.catalogMode}
      />
    </div>
  );
}
