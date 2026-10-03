import { daysSince } from "./format";
import { zonedParts } from "./tz";

export type Segment = "vip" | "frecuente" | "ocasional" | "nuevo" | "inactivo";

// Cinco segmentos, cinco tonos distinguibles entre sí. Los dos primeros usan
// los colores de marca (verde para el cliente sano, violeta para el VIP) y los
// otros son colores de dato, no de marca — están para diferenciar, no para
// significar. "nuevo" NO puede ser violeta: chocaría con VIP.
export const SEGMENT_META: Record<
  Segment,
  { label: string; className: string; dot: string; description: string }
> = {
  vip: {
    label: "VIP",
    className: "bg-accent-500/15 text-accent-700 ring-accent-500/25 dark:text-accent-300",
    dot: "bg-accent-500",
    description: "Tus mejores clientes por gasto acumulado",
  },
  frecuente: {
    label: "Frecuente",
    className: "bg-brand-500/15 text-brand-700 ring-brand-500/25 dark:text-brand-300",
    dot: "bg-brand-500",
    description: "Compran seguido y siguen activos",
  },
  ocasional: {
    label: "Ocasional",
    className: "bg-sky-500/15 text-sky-700 ring-sky-500/25 dark:text-sky-300",
    dot: "bg-sky-500",
    description: "Activos pero con pocas compras",
  },
  nuevo: {
    // amber-800 y no amber-700: sobre el propio fondo del badge (amber al 15%)
    // el 700 se queda en 4.48:1, justo por debajo de AA. El 800 da 6.32:1.
    label: "Nuevo",
    className: "bg-amber-500/15 text-amber-800 ring-amber-500/25 dark:text-amber-300",
    dot: "bg-amber-500",
    description: "Se sumaron hace poco",
  },
  inactivo: {
    label: "Inactivo",
    className: "bg-ink-muted/15 text-ink-muted ring-ink-muted/25",
    dot: "bg-ink-faint",
    description: "Hace tiempo que no vuelven",
  },
};

export interface BusinessConfig {
  inactivityDays: number;
  recompraDays: number;
  vipMinSpend: number;
}

export interface CustomerStats {
  createdAt: Date;
  lastPurchaseAt: Date | null;
  birthdate: Date | null;
  totalSpent: number;
  purchaseCount: number;
}

export function computeSegment(c: CustomerStats, cfg: BusinessConfig): Segment {
  const since = daysSince(c.lastPurchaseAt);

  // Inactivo: nunca compró hace mucho, o superó el umbral de inactividad
  if (since === null || since > cfg.inactivityDays) {
    // Un cliente sin compras muy reciente todavía es "nuevo", no inactivo
    const age = daysSince(c.createdAt);
    if (c.purchaseCount === 0 && age !== null && age <= 30) return "nuevo";
    return "inactivo";
  }

  if (c.totalSpent >= cfg.vipMinSpend) return "vip";
  if (c.purchaseCount >= 3) return "frecuente";
  if (c.purchaseCount <= 1) {
    const age = daysSince(c.createdAt);
    if (age !== null && age <= 30) return "nuevo";
  }
  return "ocasional";
}

export function isVip(c: CustomerStats, cfg: BusinessConfig): boolean {
  return c.totalSpent >= cfg.vipMinSpend;
}

// ¿Superó el tiempo esperado de recompra sin volver (pero no tanto como para estar "perdido")?
export function needsWinback(c: CustomerStats, cfg: BusinessConfig): boolean {
  const since = daysSince(c.lastPurchaseAt);
  if (since === null) return false;
  return since >= cfg.recompraDays;
}

// Los cumpleaños se guardan como fecha calendario a medianoche UTC (o a las
// 03:00 UTC en los cargados desde una máquina en hora argentina): en los dos
// casos el día UTC es el correcto, así que se leen con getUTC*. El "hoy", en
// cambio, es el de la hora del negocio — en UTC, después de las 21:00 el
// servidor ya creía que era mañana y anunciaba los cumpleaños un día antes.
function birthParts(birthdate: Date): { month: number; day: number; year: number } {
  const b = new Date(birthdate);
  return { year: b.getUTCFullYear(), month: b.getUTCMonth(), day: b.getUTCDate() };
}

function todayUtc(): Date {
  const t = zonedParts(new Date());
  return new Date(Date.UTC(t.year, t.month - 1, t.day));
}

// Días hasta el próximo cumpleaños (0 = hoy). null si no hay fecha.
export function daysToBirthday(birthdate: Date | null): number | null {
  if (!birthdate) return null;
  const today = todayUtc();
  const b = birthParts(birthdate);
  let next = new Date(Date.UTC(today.getUTCFullYear(), b.month, b.day));
  if (next < today) next = new Date(Date.UTC(today.getUTCFullYear() + 1, b.month, b.day));
  return Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function birthdayThisMonth(birthdate: Date | null): boolean {
  if (!birthdate) return false;
  return birthParts(birthdate).month === todayUtc().getUTCMonth();
}

export function ageTurning(birthdate: Date | null): number | null {
  if (!birthdate) return null;
  const b = birthParts(birthdate);
  const today = todayUtc();
  let age = today.getUTCFullYear() - b.year;
  const next = new Date(Date.UTC(today.getUTCFullYear(), b.month, b.day));
  if (next < today) age += 1;
  return age;
}
