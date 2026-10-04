import "server-only";
import { db } from "./db";
import type { EnrichedCustomer } from "./queries";

// Lo que hace que el sistema se pague solo, en números del propio negocio.
//
// Un CRM de fidelización se vende con una pregunta: "¿cuánta plata te trajo?".
// Antes el panel mostraba clientes y ventas, pero no conectaba un mensaje con
// la venta que vino después — y esa conexión es justamente el valor.

// Cuántos días después de un mensaje una compra cuenta como "volvió por el
// mensaje". Dos semanas es generoso pero razonable para un negocio de barrio:
// el cliente lee el WhatsApp hoy y pasa el sábado.
export const ATTRIBUTION_DAYS = 14;

export interface CampaignImpact {
  // Clientes distintos que compraron dentro de los 14 días posteriores a un
  // mensaje de campaña, en los últimos 30 días.
  customers: number;
  // Lo que facturaron esas compras (la primera después de cada mensaje).
  revenue: number;
  // Clientes distintos a los que se les escribió en los últimos 30 días.
  contacted: number;
  byCampaign: Map<string, { customers: number; revenue: number }>;
}

export async function campaignImpact(businessId: string, days = 30): Promise<CampaignImpact> {
  const now = Date.now();
  const since = new Date(now - days * 86400000);
  const contactsSince = new Date(since.getTime() - ATTRIBUTION_DAYS * 86400000);

  const [contacts, purchases] = await Promise.all([
    db.contactLog.findMany({
      where: { businessId, campaignId: { not: null }, createdAt: { gte: contactsSince } },
      select: { customerId: true, campaignId: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    db.purchase.findMany({
      where: { businessId, date: { gte: since } },
      select: { customerId: true, date: true, amount: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const byCustomer = new Map<string, { campaignId: string; at: Date }[]>();
  const contactedRecently = new Set<string>();
  for (const c of contacts) {
    const arr = byCustomer.get(c.customerId) ?? [];
    arr.push({ campaignId: c.campaignId!, at: c.createdAt });
    byCustomer.set(c.customerId, arr);
    if (c.createdAt >= since) contactedRecently.add(c.customerId);
  }

  // Cada mensaje se acredita UNA vez, con la primera compra que vino después.
  const used = new Set<string>();
  const customers = new Set<string>();
  let revenue = 0;
  const byCampaign = new Map<string, { customers: Set<string>; revenue: number }>();
  for (const p of purchases) {
    const list = byCustomer.get(p.customerId);
    if (!list) continue;
    // El mensaje más reciente anterior a la compra, dentro de la ventana.
    let match: { campaignId: string; at: Date } | null = null;
    for (const c of list) {
      if (c.at >= p.date) break;
      if (p.date.getTime() - c.at.getTime() <= ATTRIBUTION_DAYS * 86400000) match = c;
    }
    if (!match) continue;
    const key = `${p.customerId}:${match.at.getTime()}`;
    if (used.has(key)) continue;
    used.add(key);
    customers.add(p.customerId);
    revenue += p.amount;
    const agg = byCampaign.get(match.campaignId) ?? { customers: new Set<string>(), revenue: 0 };
    agg.customers.add(p.customerId);
    agg.revenue += p.amount;
    byCampaign.set(match.campaignId, agg);
  }

  return {
    customers: customers.size,
    revenue,
    contacted: contactedRecently.size,
    byCampaign: new Map(
      [...byCampaign.entries()].map(([id, v]) => [id, { customers: v.customers.size, revenue: v.revenue }])
    ),
  };
}

export interface MoneyAtStake {
  // Clientes a los que ya les venció la recompra pero todavía no se fueron.
  dueCustomers: number;
  // Si cada uno vuelve una vez, lo que entra (su ticket promedio).
  dueRevenue: number;
  inactiveCustomers: number;
  // De los que compraron alguna vez, cuántos volvieron a comprar.
  repeatRate: number | null;
}

export function moneyAtStake(customers: EnrichedCustomer[]): MoneyAtStake {
  const due = customers.filter((c) => c.needsWinback && c.segment !== "inactivo");
  const inactive = customers.filter((c) => c.segment === "inactivo" && c.purchaseCount > 0);

  const buyers = customers.filter((c) => c.purchaseCount > 0);
  const repeaters = buyers.filter((c) => c.purchaseCount >= 2);

  return {
    dueCustomers: due.length,
    dueRevenue: due.reduce((s, c) => s + c.avgTicket, 0),
    inactiveCustomers: inactive.length,
    repeatRate: buyers.length ? repeaters.length / buyers.length : null,
  };
}
