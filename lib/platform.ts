import "server-only";
import { cache } from "react";
import { db } from "./db";

// El singleton se autocrea la primera vez que se pide (con los defaults del
// schema). React.cache() deduplica llamadas dentro de la misma request.
export const getPlatformSettings = cache(async () => {
  return db.platformSetting.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });
});

export interface BusinessModuleWithPrice {
  enabled: boolean;
  priceOverride: number | null;
  module: { monthlyPrice: number };
}

export function moduleMonthlyPrice(bm: BusinessModuleWithPrice): number {
  return bm.priceOverride ?? bm.module.monthlyPrice;
}

export function businessMonthlyTotal(
  basePlanPrice: number,
  mods: BusinessModuleWithPrice[]
): number {
  return (
    basePlanPrice +
    mods.filter((m) => m.enabled).reduce((s, m) => s + moduleMonthlyPrice(m), 0)
  );
}

export type BillingStatus = "al-dia" | "pendiente" | "vencido" | "exento";

// Un negocio está "al día" si ya pagó el período actual (año/mes calendario).
// "Vencido" si pasó el día de vencimiento configurado sin pago; si no, "pendiente".
export function billingStatus(params: {
  billingExempt: boolean;
  hasPaidCurrentPeriod: boolean;
  dueDay: number;
  now?: Date;
}): BillingStatus {
  if (params.billingExempt) return "exento";
  if (params.hasPaidCurrentPeriod) return "al-dia";
  const now = params.now ?? new Date();
  return now.getDate() > params.dueDay ? "vencido" : "pendiente";
}
