import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { periodRange, pctDelta } from "@/lib/cash";
import { buildPeriodReport } from "@/lib/reports";
import { campaignImpactBetween } from "@/lib/insights";
import { formatMoney } from "@/lib/format";
import { paymentLabel } from "@/lib/sales";
import { catalogWords, rubroLabel } from "@/lib/rubros";
import { accentCss } from "@/lib/appearance";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Informe del mes · Vuelvo CRM", robots: { index: false } };
export const dynamic = "force-dynamic";

// Informe mensual para imprimir o guardar como PDF y mandárselo al contador o
// al socio. Vive fuera de (app) a propósito: es una hoja, sin menú ni barra de
// navegación, que se imprime tal cual se ve. Cada informe que se comparte
// lleva la marca de Vuelvo al pie: es publicidad que el dueño hace solo.
export default async function InformePage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  const biz = session.business;

  const { m } = await searchParams;
  const offset = Math.min(Math.max(parseInt(m ?? "0", 10) || 0, 0), 12);
  const period = periodRange("mes", offset, biz.timezone);
  const prev = periodRange("mes", offset + 1, biz.timezone);

  const [report, prevReport, impact, mensajes, nuevosClientes] = await Promise.all([
    buildPeriodReport(biz.id, period, biz.timezone),
    buildPeriodReport(biz.id, prev, biz.timezone),
    campaignImpactBetween(biz.id, period.from, period.to),
    db.contactLog.count({ where: { businessId: biz.id, createdAt: { gte: period.from, lt: period.to } } }),
    db.customer.count({ where: { businessId: biz.id, createdAt: { gte: period.from, lt: period.to } } }),
  ]);

  const hasCaja = biz.modules.includes("caja");
  const words = catalogWords(biz.catalogMode);
  const delta = pctDelta(report.facturacion, prevReport.facturacion);
  const logoUrl = biz.logoVersion ? `/mi-logo?v=${biz.logoVersion}` : null;
  const accent = accentCss(biz.accentColor);
  const months = Array.from({ length: 6 }, (_, i) => ({ i, label: cap(periodRange("mes", i, biz.timezone).label) }));

  return (
    <div className="min-h-screen bg-canvas print:bg-white">
      {accent && <style>{accent}</style>}
      {/* La hoja siempre en claro: un PDF oscuro no se imprime. */}
      <style>{`@media print { @page { size: A4; margin: 14mm; } .no-print { display: none !important; } }`}</style>

      <div className="no-print mx-auto flex max-w-3xl flex-wrap items-center gap-3 px-4 pt-6">
        <Link href="/reportes" className="btn-ghost !px-2 text-sm">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <form className="flex items-center gap-2">
            <select name="m" defaultValue={offset} className="input !w-auto !py-2 text-sm">
              {months.map((mo) => (
                <option key={mo.i} value={mo.i}>
                  {mo.label}
                </option>
              ))}
            </select>
            <button className="btn-secondary !py-2 text-sm">Ver</button>
          </form>
          <PrintButton />
        </div>
      </div>

      <article className="mx-auto my-6 max-w-3xl rounded-2xl bg-white p-8 text-slate-900 shadow-card ring-1 ring-slate-200 print:my-0 print:rounded-none print:p-0 print:shadow-none print:ring-0">
        <header className="flex items-center gap-4 border-b border-slate-200 pb-5">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-14 w-14 rounded-xl object-cover" />
          ) : (
            <div className="grid h-14 w-14 place-items-center rounded-xl bg-accent-600 font-display text-2xl font-bold text-white">
              {biz.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-bold">{biz.name}</h1>
            <p className="text-sm text-slate-500">
              Informe de {period.label} · {rubroLabel(biz.rubro)}
            </p>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Metric label="Facturación" value={formatMoney(report.facturacion)} hint={delta === null ? "Sin mes anterior" : `${delta >= 0 ? "+" : ""}${Math.round(delta)}% vs. ${prev.label}`} />
          <Metric label="Ventas" value={String(report.ventas)} hint={`Ticket promedio ${formatMoney(report.ticketPromedio)}`} />
          <Metric label="Clientes atendidos" value={String(report.clientes)} hint={`${report.clientesRecurrentes} volvieron · ${report.clientesNuevos} nuevos`} />
          <Metric label="Clientes nuevos cargados" value={String(nuevosClientes)} hint="Alta en el sistema" />
        </section>

        <section className="mt-5 rounded-xl bg-emerald-50 p-4 print:border print:border-emerald-200">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-emerald-900">Lo que trajeron tus mensajes</h2>
          <p className="mt-1 text-sm text-emerald-950">
            Mandaste <strong>{mensajes}</strong> mensajes.{" "}
            {impact.customers > 0 ? (
              <>
                <strong>{impact.customers}</strong> {impact.customers === 1 ? "cliente volvió" : "clientes volvieron"} a comprar dentro de los 14 días y{" "}
                {impact.customers === 1 ? "dejó" : "dejaron"} <strong>{formatMoney(impact.revenue)}</strong>.
              </>
            ) : (
              "Todavía no hubo compras atribuibles a un mensaje en este mes."
            )}
          </p>
        </section>

        {hasCaja && (
          <section className="mt-5 grid grid-cols-3 gap-4">
            <Metric label="Costos" value={formatMoney(report.costos)} hint="Comisiones, tarjetas y mercadería" />
            <Metric label="Neto" value={formatMoney(report.neto)} hint="Lo que te quedó" />
            <Metric label="Descuentos" value={formatMoney(report.descuentos)} hint="Hechos en el mes" />
          </section>
        )}

        <div className="mt-6 grid gap-6 sm:grid-cols-2 print:grid-cols-2">
          <Table title={words.reportBreakdown} rows={report.porServicio.slice(0, 10).map((r) => [r.label, formatMoney(r.amount)])} />
          <Table title="Por método de pago" rows={report.porMetodoPago.map((r) => [paymentLabel(r.label), formatMoney(r.amount)])} />
          {hasCaja && report.porEmpleado.length > 0 && (
            <Table title="Por persona" rows={report.porEmpleado.map((r) => [r.label, formatMoney(r.amount)])} />
          )}
          {hasCaja && report.costosPorConcepto.length > 0 && (
            <Table title="Costos" rows={report.costosPorConcepto.map((r) => [r.label, formatMoney(r.amount)])} />
          )}
          <Table
            title="Por día de la semana"
            rows={report.porDiaSemana.map((r) => [r.label, `${formatMoney(r.amount)} · ${r.count}`])}
          />
        </div>

        <footer className="mt-8 border-t border-slate-200 pt-3 text-xs text-slate-400">
          Generado el {new Date().toLocaleDateString("es-AR", { timeZone: biz.timezone })} con Vuelvo CRM ·
          vendé más sin conseguir un solo cliente nuevo.
        </footer>
      </article>
    </div>
  );
}

// "octubre de 2026" → "Octubre de 2026" (`capitalize` de CSS haría "De").
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 font-display text-lg font-bold tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div>}
    </div>
  );
}

function Table({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <section className="break-inside-avoid">
      <h2 className="mb-1.5 font-display text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">Sin datos.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([a, b], i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                <td className="py-1.5 pr-2">{a}</td>
                <td className="py-1.5 text-right font-semibold tabular-nums">{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
