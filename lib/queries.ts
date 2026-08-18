import { redirect } from "next/navigation";
import { db } from "./db";
import { getSessionUser } from "./auth";
import {
  BusinessConfig,
  Segment,
  computeSegment,
  isVip,
  needsWinback,
  daysToBirthday,
  birthdayThisMonth,
} from "./segmentation";
import { daysSince } from "./format";
import { matchesCampaign, CampaignRule, RuleDefaults } from "./campaigns";
import type { Campaign } from "@prisma/client";

export interface EnrichedCustomer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  birthdate: Date | null;
  notes: string | null;
  tags: string[];
  lastPurchaseAt: Date | null;
  createdAt: Date;
  totalSpent: number;
  purchaseCount: number;
  avgTicket: number;
  daysSinceLast: number | null;
  segment: Segment;
  isVip: boolean;
  needsWinback: boolean;
  birthdayInDays: number | null;
  birthdayThisMonth: boolean;
}

// Devuelve el negocio del usuario autenticado. Si no hay sesión, redirige al login.
// Así todas las consultas quedan aisladas por negocio (multi-tenant).
export async function getCurrentBusiness() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  return session.business;
}

export function toConfig(biz: {
  inactivityDays: number;
  recompraDays: number;
  vipMinSpend: number;
}): BusinessConfig {
  return {
    inactivityDays: biz.inactivityDays,
    recompraDays: biz.recompraDays,
    vipMinSpend: biz.vipMinSpend,
  };
}

export async function getEnrichedCustomers(
  businessId: string,
  cfg: BusinessConfig
): Promise<EnrichedCustomer[]> {
  const customers = await db.customer.findMany({
    where: { businessId },
    include: {
      purchases: { select: { amount: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return customers.map((c) => {
    const purchaseCount = c.purchases.length;
    const totalSpent = c.purchases.reduce((s, p) => s + p.amount, 0);
    const stats = {
      createdAt: c.createdAt,
      lastPurchaseAt: c.lastPurchaseAt,
      birthdate: c.birthdate,
      totalSpent,
      purchaseCount,
    };
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      birthdate: c.birthdate,
      notes: c.notes,
      tags: c.tags ? c.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      lastPurchaseAt: c.lastPurchaseAt,
      createdAt: c.createdAt,
      totalSpent,
      purchaseCount,
      avgTicket: purchaseCount ? totalSpent / purchaseCount : 0,
      daysSinceLast: daysSince(c.lastPurchaseAt),
      segment: computeSegment(stats, cfg),
      isVip: isVip(stats, cfg),
      needsWinback: needsWinback(stats, cfg),
      birthdayInDays: daysToBirthday(c.birthdate),
      birthdayThisMonth: birthdayThisMonth(c.birthdate),
    };
  });
}

// Las campañas del negocio, en el orden en que se muestran. Único lugar que
// las lee: /campanas, /recordatorios y el dashboard pasan por acá para que las
// tres pantallas cuenten exactamente la misma audiencia.
export async function getCampaigns(businessId: string): Promise<Campaign[]> {
  return db.campaign.findMany({
    where: { businessId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export function ruleDefaults(biz: { recompraDays: number }): RuleDefaults {
  return { recompraDays: biz.recompraDays };
}

export function campaignRecipients(
  campaign: CampaignRule,
  customers: EnrichedCustomer[],
  defaults: RuleDefaults
): EnrichedCustomer[] {
  return customers.filter((c) => matchesCampaign(c, campaign, defaults));
}

export interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  vipCustomers: number;
  avgTicket: number;
  totalRevenue: number;
  purchasesLast30: number;
  revenueLast30: number;
  avgFrequencyDays: number | null;
  pendingReminders: number;
  segmentCounts: Record<Segment, number>;
}

export function buildDashboard(
  customers: EnrichedCustomer[],
  campaigns: CampaignRule[],
  defaults: RuleDefaults
): DashboardStats {
  const totalCustomers = customers.length;
  const inactiveCustomers = customers.filter((c) => c.segment === "inactivo").length;
  const vipCustomers = customers.filter((c) => c.isVip).length;
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const totalPurchases = customers.reduce((s, c) => s + c.purchaseCount, 0);
  const avgTicket = totalPurchases ? totalRevenue / totalPurchases : 0;

  const segmentCounts: Record<Segment, number> = {
    vip: 0,
    frecuente: 0,
    ocasional: 0,
    nuevo: 0,
    inactivo: 0,
  };
  customers.forEach((c) => (segmentCounts[c.segment] += 1));

  // Frecuencia media: promedio de días entre compras de clientes con >=2 compras
  const withHistory = customers.filter((c) => c.purchaseCount >= 2 && c.daysSinceLast !== null);
  const avgFrequencyDays =
    withHistory.length > 0
      ? Math.round(
          withHistory.reduce((s, c) => {
            const spanDays = daysSince(c.createdAt) ?? 0;
            return s + spanDays / Math.max(c.purchaseCount - 1, 1);
          }, 0) / withHistory.length
        )
      : null;

  // Clientes alcanzados por al menos una campaña activa, contados una sola vez.
  // Antes eran dos filtros hardcodeados que sumaban por separado: quien cumplía
  // años y además debía recompra se contaba dos veces, y el número no coincidía
  // con lo que después mostraba /recordatorios.
  const reached = new Set<string>();
  for (const campaign of campaigns) {
    for (const c of customers) {
      if (matchesCampaign(c, campaign, defaults)) reached.add(c.id);
    }
  }
  const pendingReminders = reached.size;

  return {
    totalCustomers,
    activeCustomers: totalCustomers - inactiveCustomers,
    inactiveCustomers,
    vipCustomers,
    avgTicket,
    totalRevenue,
    purchasesLast30: 0,
    revenueLast30: 0,
    avgFrequencyDays,
    pendingReminders,
    segmentCounts,
  };
}
