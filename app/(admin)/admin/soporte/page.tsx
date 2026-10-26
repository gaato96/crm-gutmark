import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { FeedbackInbox, type FeedbackRow } from "@/components/admin-feedback";
import { FEEDBACK_KINDS } from "@/lib/feedback";

export const dynamic = "force-dynamic";

const VIEWS = [
  { code: "abiertos", label: "Abiertos" },
  { code: "resueltos", label: "Resueltos" },
  { code: "todos", label: "Todos" },
] as const;

// Lo que mandan los negocios desde "Reportar o sugerir". Es la columna
// vertebral del Programa Fundadores: lo que no se ve acá, no se arregla.
export default async function SoportePage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string; k?: string }>;
}) {
  const { v = "abiertos", k = "" } = await searchParams;
  const rows = await db.feedback.findMany({
    where: {
      ...(v === "abiertos" ? { status: { not: "resuelto" } } : v === "resueltos" ? { status: "resuelto" } : {}),
      ...(k ? { kind: k } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { business: { select: { name: true } } },
  });
  const counts = await db.feedback.groupBy({
    by: ["kind"],
    where: { status: { not: "resuelto" } },
    _count: { _all: true },
  });
  const countBy = new Map(counts.map((c) => [c.kind, c._count._all]));

  const data: FeedbackRow[] = rows.map((r) => ({
    id: r.id,
    businessId: r.businessId,
    businessName: r.business.name,
    kind: r.kind,
    message: r.message,
    path: r.path,
    userAgent: r.userAgent,
    viewport: r.viewport,
    screenshot: r.screenshot,
    fromImpersonation: r.fromImpersonation,
    status: r.status,
    reply: r.reply,
    createdAt: r.createdAt.toISOString(),
    seenAt: r.seenAt?.toISOString() ?? null,
  }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Soporte"
        subtitle="Problemas, ideas y dudas que mandan los negocios desde el panel, con la pantalla y el dispositivo."
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl bg-surface-2 p-1">
          {VIEWS.map((x) => (
            <Link
              key={x.code}
              href={`/admin/soporte?v=${x.code}${k ? `&k=${k}` : ""}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${v === x.code ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink-soft"}`}
            >
              {x.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Link href={`/admin/soporte?v=${v}`} className={`badge ${!k ? "bg-ink/10 text-ink ring-ink/15" : "bg-surface-2 text-ink-muted ring-line"}`}>
            Todo
          </Link>
          {FEEDBACK_KINDS.map((x) => (
            <Link
              key={x.code}
              href={`/admin/soporte?v=${v}&k=${x.code}`}
              className={`badge ${k === x.code ? "bg-ink/10 text-ink ring-ink/15" : "bg-surface-2 text-ink-muted ring-line"}`}
            >
              {x.short} {countBy.get(x.code) ? `(${countBy.get(x.code)})` : ""}
            </Link>
          ))}
        </div>
      </div>
      <FeedbackInbox rows={data} />
    </div>
  );
}
