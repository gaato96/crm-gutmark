import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Phone,
  Mail,
  Cake,
  Crown,
  Receipt,
  Wallet,
  CalendarClock,
  ShoppingBag,
} from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentBusiness, toConfig } from "@/lib/queries";
import { formatMoney, formatDate, daysSince } from "@/lib/format";
import {
  computeSegment,
  isVip,
  needsWinback,
  daysToBirthday,
  ageTurning,
} from "@/lib/segmentation";
import { renderTemplate } from "@/lib/messages";
import { Avatar, SegmentBadge, Pill } from "@/components/ui";
import { AddPurchaseForm } from "@/components/add-purchase-form";
import { QuickContact } from "@/components/quick-contact";
import { DeleteCustomerButton } from "@/components/delete-customer-button";

export const dynamic = "force-dynamic";

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const biz = await getCurrentBusiness();
  const cfg = toConfig(biz);

  const customer = await db.customer.findFirst({
    where: { id, businessId: biz.id },
    include: { purchases: { orderBy: { date: "desc" } } },
  });
  if (!customer) notFound();

  const templates = await db.template.findMany({ where: { businessId: biz.id } });

  const purchaseCount = customer.purchases.length;
  const totalSpent = customer.purchases.reduce((s, p) => s + p.amount, 0);
  const avgTicket = purchaseCount ? totalSpent / purchaseCount : 0;
  const stats = {
    createdAt: customer.createdAt,
    lastPurchaseAt: customer.lastPurchaseAt,
    birthdate: customer.birthdate,
    totalSpent,
    purchaseCount,
  };
  const segment = computeSegment(stats, cfg);
  const vip = isVip(stats, cfg);
  const winback = needsWinback(stats, cfg);
  const bdayIn = daysToBirthday(customer.birthdate);
  const tags = customer.tags ? customer.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  // Determinar mensaje sugerido según contexto
  const vars = { nombre: customer.name, negocio: biz.name };
  const pick = (type: string, channel: string) =>
    templates.find((t) => t.type === type && t.channel === channel);

  let reason = "Agradecer y fidelizar";
  let waTpl = pick("winback", "whatsapp");
  let emTpl = pick("winback", "email");

  if (bdayIn !== null && bdayIn <= 7) {
    reason = bdayIn === 0 ? "¡Cumple hoy! 🎂" : `Cumpleaños en ${bdayIn} días`;
    waTpl = pick("birthday", "whatsapp") ?? waTpl;
    emTpl = pick("birthday", "email") ?? emTpl;
  } else if (winback) {
    reason = `Sin comprar hace ${daysSince(customer.lastPurchaseAt)} días`;
  }

  const genericWa = `¡Hola ${vars.nombre.split(" ")[0]}! Gracias por elegir ${biz.name}. Cualquier cosa que necesites, escribinos. 💚`;
  const whatsappBody = waTpl ? renderTemplate(waTpl.body, vars) : genericWa;
  const emailSubject = emTpl ? renderTemplate(emTpl.subject, vars) : `Un mensaje de ${biz.name}`;
  const emailBody = emTpl ? renderTemplate(emTpl.body, vars) : genericWa;

  return (
    <div className="animate-fade-in">
      <Link
        href="/clientes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a clientes
      </Link>

      {/* Encabezado */}
      <div className="card mb-6 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={customer.name} size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl text-ink">{customer.name}</h1>
                {vip && (
                  <span className="badge bg-gold-500/15 text-gold-700 ring-gold-500/25 dark:text-gold-300">
                    <Crown className="h-3 w-3" /> VIP
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <SegmentBadge segment={segment} />
                {tags.map((t) => (
                  <Pill key={t} tone="slate">
                    #{t}
                  </Pill>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/clientes/${customer.id}/editar`} className="btn-secondary">
              <Pencil className="h-4 w-4" /> Editar
            </Link>
            <DeleteCustomerButton id={customer.id} name={customer.name} />
          </div>
        </div>

        {/* Contacto */}
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-line-soft pt-4 text-sm">
          {customer.phone && (
            <span className="inline-flex items-center gap-2 text-ink-soft">
              <Phone className="h-4 w-4 text-ink-faint" /> {customer.phone}
            </span>
          )}
          {customer.email && (
            <span className="inline-flex items-center gap-2 text-ink-soft">
              <Mail className="h-4 w-4 text-ink-faint" /> {customer.email}
            </span>
          )}
          {customer.birthdate && (
            <span className="inline-flex items-center gap-2 text-ink-soft">
              <Cake className="h-4 w-4 text-ink-faint" />
              {formatDate(customer.birthdate)}
              {ageTurning(customer.birthdate) !== null && (
                <span className="text-ink-muted">(cumple {ageTurning(customer.birthdate)})</span>
              )}
            </span>
          )}
        </div>

        {customer.notes && (
          <div className="mt-4 rounded-xl bg-surface-2 p-3 text-sm text-ink-soft">
            <span className="font-semibold text-ink">Notas: </span>
            {customer.notes}
          </div>
        )}
      </div>

      {/* Métricas del cliente */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat icon={<Wallet className="h-4 w-4" />} label="Gastado" value={formatMoney(totalSpent)} />
        <MiniStat icon={<ShoppingBag className="h-4 w-4" />} label="Compras" value={purchaseCount.toString()} />
        <MiniStat icon={<Receipt className="h-4 w-4" />} label="Ticket prom." value={formatMoney(avgTicket)} />
        <MiniStat
          icon={<CalendarClock className="h-4 w-4" />}
          label="Última compra"
          value={
            customer.lastPurchaseAt
              ? `hace ${daysSince(customer.lastPurchaseAt)}d`
              : "Nunca"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Historial */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line-soft px-5 py-4">
              <h2 className="font-bold text-ink">Historial de compras</h2>
              <span className="text-sm text-ink-muted">{purchaseCount} compras</span>
            </div>
            {purchaseCount === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-ink-muted">
                Todavía no registraste compras de este cliente.
              </div>
            ) : (
              <ul className="divide-y divide-line-soft">
                {customer.purchases.map((p) => (
                  <li key={p.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500/10 text-brand-600">
                        <ShoppingBag className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-ink">
                          {p.description || "Compra"}
                        </div>
                        <div className="text-xs text-ink-muted">{formatDate(p.date)}</div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-ink">{formatMoney(p.amount)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="space-y-5">
          <AddPurchaseForm customerId={customer.id} />
          <QuickContact
            phone={customer.phone}
            email={customer.email}
            whatsappBody={whatsappBody}
            emailSubject={emailSubject}
            emailBody={emailBody}
            reason={reason}
          />
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
        <span className="text-ink-faint">{icon}</span>
        {label}
      </div>
      <div className="mt-1.5 text-lg font-bold text-ink">{value}</div>
    </div>
  );
}
