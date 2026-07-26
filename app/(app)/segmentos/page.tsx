import { getCurrentBusiness, getEnrichedCustomers, toConfig } from "@/lib/queries";
import { SEGMENT_META, Segment } from "@/lib/segmentation";
import { PageHeader, SectionTitle } from "@/components/ui";
import { CustomersList, CustomerRow } from "@/components/customers-list";
import { SegmentDonut } from "@/components/segment-donut";

export const dynamic = "force-dynamic";

const SEGMENTS = Object.keys(SEGMENT_META) as Segment[];

export default async function SegmentosPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  const { s } = await searchParams;
  const biz = await getCurrentBusiness();
  const cfg = toConfig(biz);
  const customers = await getEnrichedCustomers(biz.id, cfg);

  const initial = (SEGMENTS.includes(s as Segment) ? (s as Segment) : "todos") as
    | "todos"
    | Segment;

  const counts: Record<string, number> = {};
  SEGMENTS.forEach((seg) => (counts[seg] = customers.filter((c) => c.segment === seg).length));

  const rows: CustomerRow[] = customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    segment: c.segment,
    isVip: c.isVip,
    totalSpent: c.totalSpent,
    purchaseCount: c.purchaseCount,
    daysSinceLast: c.daysSinceLast,
    birthdayInDays: c.birthdayInDays,
    tags: c.tags,
  }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Segmentos"
        subtitle="Tus clientes agrupados automáticamente según su comportamiento de compra."
      />

      <div className="mb-6 grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
        <div className="card p-5">
          <SectionTitle>Distribución</SectionTitle>
          <SegmentDonut counts={counts as Record<Segment, number>} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
        {SEGMENTS.map((seg) => {
          const m = SEGMENT_META[seg];
          return (
            <div key={seg} className="card p-5">
              <div className="flex items-center justify-between">
                <span className={`badge ${m.className}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
                  {m.label}
                </span>
                <span className="text-2xl font-bold tabular-nums text-ink">{counts[seg]}</span>
              </div>
              <p className="mt-3 text-sm text-ink-muted">{m.description}</p>
            </div>
          );
        })}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-4 font-bold text-ink">Explorar clientes por segmento</h2>
        <CustomersList customers={rows} initialFilter={initial} />
      </div>
    </div>
  );
}
