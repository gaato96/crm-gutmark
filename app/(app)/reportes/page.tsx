import { getCurrentBusiness } from "@/lib/queries";
import { periodRange, type PeriodKind } from "@/lib/cash";
import { buildComparison, commissionsByEmployee } from "@/lib/reports";
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

  const [comparacion, comisiones] = await Promise.all([
    buildComparison(biz.id, actual, anterior),
    commissionsByEmployee(biz.id, actual),
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
      />
    </div>
  );
}
