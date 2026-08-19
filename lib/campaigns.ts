// Disparadores de campaña. Archivo PURO a propósito — sin "server-only" y sin
// import de Prisma — porque el editor de campañas es un componente client y
// necesita las etiquetas y la forma de cada disparador para armar el formulario.
//
// No hay cron en el proyecto: una campaña no "se dispara", se evalúa cada vez
// que se lee la lista de clientes (igual que el segmento, ver lib/segmentation).
// Por eso `matchesCampaign` es una función sincrónica sobre datos ya cargados.

import { daysSince } from "./format";
import type { Segment } from "./segmentation";

export const TRIGGER_TYPES = [
  "birthday",
  "days-since-purchase",
  "service-recompra",
  "days-since-signup",
  "segment",
  "total-spent",
  "all",
] as const;

export type TriggerType = (typeof TRIGGER_TYPES)[number];

export function isTriggerType(v: string): v is TriggerType {
  return (TRIGGER_TYPES as readonly string[]).includes(v);
}

// `field` dice qué control extra mostrar en el editor y qué columna guardar.
// Los disparadores sin campo extra no necesitan más que el tipo.
export const TRIGGER_META: Record<
  TriggerType,
  {
    label: string;
    help: string;
    field: "days" | "segment" | "amount" | "service" | null;
    daysLabel?: string;
    defaultDays?: number;
  }
> = {
  birthday: {
    label: "Cumpleaños",
    help: "Se activa para quienes cumplen años dentro de los próximos días.",
    field: "days",
    daysLabel: "Días de anticipación",
    defaultDays: 7,
  },
  "days-since-purchase": {
    label: "Días sin comprar",
    help: "Para quienes pasaron cierto tiempo sin volver. Ideal para recompra y reactivación.",
    field: "days",
    daysLabel: "Días sin comprar (o más)",
    defaultDays: 45,
  },
  "service-recompra": {
    label: "Servicio + días desde esa compra",
    help: "Para quienes compraron un servicio puntual y ya pasó el tiempo en que se espera que vuelvan. Es el disparador de 'al que se hizo corte + barba, escribile a los 15 días'.",
    field: "service",
    daysLabel: "Días desde ese servicio (o más)",
  },
  "days-since-signup": {
    label: "Antigüedad como cliente",
    help: "Cuenta desde que lo cargaste. Sirve para bienvenidas y aniversarios.",
    field: "days",
    daysLabel: "Días desde el alta (o más)",
    defaultDays: 365,
  },
  segment: {
    label: "Segmento",
    help: "Todos los clientes de un segmento (VIP, frecuente, inactivo…).",
    field: "segment",
  },
  "total-spent": {
    label: "Gasto acumulado",
    help: "Quienes gastaron más de cierto monto en total.",
    field: "amount",
  },
  all: {
    label: "Todos los clientes",
    help: "Sin filtro. Para anuncios generales.",
    field: null,
  },
};

// Lo que el disparador necesita saber de una campaña. `Campaign` de Prisma lo
// cumple estructuralmente, así que no hace falta convertir nada.
export interface CampaignRule {
  triggerType: string;
  triggerDays: number | null;
  segment: string | null;
  minSpend: number | null;
  serviceId: string | null;
  excludeInactive: boolean;
}

// Lo que el disparador necesita saber de un cliente. `EnrichedCustomer` de
// lib/queries.ts también lo cumple estructuralmente.
export interface CampaignTarget {
  segment: Segment;
  birthdayInDays: number | null;
  daysSinceLast: number | null;
  createdAt: Date;
  totalSpent: number;
  // Días desde la última vez que compró cada servicio, por id de servicio. Un
  // servicio ausente del diccionario significa "nunca lo compró", que no es lo
  // mismo que "hace 0 días" — por eso es un Record y no un array.
  daysSinceService?: Record<string, number>;
}

// Valores del negocio que sirven de default cuando la campaña no fija el suyo.
// La campaña de recompra de fábrica deja `triggerDays` en null justamente para
// seguir el ajuste de Configuración en vez de duplicarlo.
export interface RuleDefaults {
  recompraDays: number;
  // Recompra esperada de cada servicio (Service.recompraDays). Se usa cuando la
  // campaña no fija sus propios días: el negocio ya dijo "el corte se repite a
  // los 15" al cargar el servicio, no tiene que repetirlo en cada campaña.
  serviceRecompraDays?: Record<string, number | null>;
  // Nombre de cada servicio, solo para describeTrigger. El motor no lo necesita
  // para decidir a quién alcanza; es para que la tarjeta diga "Se hicieron
  // Corte + Barba hace 15 días" en vez de mostrar un id.
  serviceNames?: Record<string, string>;
}

export function matchesCampaign(
  c: CampaignTarget,
  rule: CampaignRule,
  defaults: RuleDefaults
): boolean {
  if (rule.excludeInactive && c.segment === "inactivo") return false;

  switch (rule.triggerType) {
    case "birthday": {
      const within = rule.triggerDays ?? TRIGGER_META.birthday.defaultDays!;
      return c.birthdayInDays !== null && c.birthdayInDays <= within;
    }
    case "days-since-purchase": {
      const min = rule.triggerDays ?? defaults.recompraDays;
      return c.daysSinceLast !== null && c.daysSinceLast >= min;
    }
    case "service-recompra": {
      if (!rule.serviceId) return false;
      const since = c.daysSinceService?.[rule.serviceId];
      // Nunca compró ese servicio: no entra. La campaña habla de volver a algo
      // concreto, no tendría sentido mandársela a quien nunca lo probó.
      if (since === undefined) return false;
      const wait =
        rule.triggerDays ??
        defaults.serviceRecompraDays?.[rule.serviceId] ??
        defaults.recompraDays;
      return since >= wait;
    }
    case "days-since-signup": {
      const min = rule.triggerDays ?? TRIGGER_META["days-since-signup"].defaultDays!;
      const age = daysSince(c.createdAt);
      return age !== null && age >= min;
    }
    case "segment":
      return rule.segment !== null && c.segment === rule.segment;
    case "total-spent":
      return c.totalSpent >= (rule.minSpend ?? 0);
    case "all":
      return true;
    default:
      // Un tipo desconocido (dato viejo, o escrito a mano en la base) no
      // matchea a nadie. Mejor una audiencia vacía que mandarle a todos.
      return false;
  }
}

// Resumen legible del disparador, para las tarjetas de la lista de campañas.
export function describeTrigger(rule: CampaignRule, defaults: RuleDefaults): string {
  switch (rule.triggerType) {
    case "birthday": {
      const d = rule.triggerDays ?? TRIGGER_META.birthday.defaultDays!;
      return d === 0 ? "Cumplen años hoy" : `Cumplen años en los próximos ${d} días`;
    }
    case "days-since-purchase": {
      const d = rule.triggerDays ?? defaults.recompraDays;
      const base = `Hace ${d} días o más que no compran`;
      return rule.excludeInactive ? `${base} (sin los inactivos)` : base;
    }
    case "service-recompra": {
      if (!rule.serviceId) return "Sin servicio elegido (no alcanza a nadie)";
      const name = defaults.serviceNames?.[rule.serviceId] ?? "ese servicio";
      const d =
        rule.triggerDays ??
        defaults.serviceRecompraDays?.[rule.serviceId] ??
        defaults.recompraDays;
      const base = `Se hicieron ${name} hace ${d} días o más`;
      return rule.excludeInactive ? `${base} (sin los inactivos)` : base;
    }
    case "days-since-signup": {
      const d = rule.triggerDays ?? TRIGGER_META["days-since-signup"].defaultDays!;
      return `Son clientes desde hace ${d} días o más`;
    }
    case "segment":
      return `Están en el segmento ${rule.segment ?? "—"}`;
    case "total-spent":
      return `Gastaron $${Math.round(rule.minSpend ?? 0).toLocaleString("es-AR")} o más en total`;
    case "all":
      return "Todos los clientes";
    default:
      return "Disparador desconocido";
  }
}

// --- Campañas de fábrica ----------------------------------------------------

// Las dos que todo negocio tiene al arrancar. Se crean en el alta (registro y
// alta desde /admin) y las usa scripts/migrate-templates.cjs como destino de
// las plantillas viejas. `builtin` las hace no borrables.
export interface CampaignSeed {
  builtin: string;
  name: string;
  description: string;
  triggerType: TriggerType;
  triggerDays: number | null;
  excludeInactive: boolean;
  sortOrder: number;
  whatsappBody: string;
  emailSubject: string;
  emailBody: string;
}

export const CAMPAIGN_SEED: CampaignSeed[] = [
  {
    builtin: "birthday",
    name: "Cumpleaños",
    description: "El saludo con un beneficio, unos días antes del cumpleaños.",
    triggerType: "birthday",
    triggerDays: 7,
    excludeInactive: false,
    sortOrder: 0,
    whatsappBody:
      "¡Hola {nombre}! 🎂 De parte de {negocio} te deseamos un muy feliz cumpleaños. Como regalo, tenés un beneficio especial en tu próxima compra esta semana. ¡Te esperamos! 💚",
    emailSubject: "🎂 ¡Feliz cumpleaños, {nombre}!",
    emailBody:
      "¡Hola {nombre}!\n\nEn {negocio} queremos desearte un muy feliz cumpleaños. Para celebrarlo, te regalamos un beneficio especial en tu próxima compra durante esta semana.\n\n¡Te esperamos!\nEquipo de {negocio}",
  },
  {
    builtin: "winback",
    name: "Recompra",
    description:
      "Para los que pasaron el tiempo esperado sin volver, pero todavía no se dieron por perdidos.",
    // triggerDays en null a propósito: sigue el valor de Configuración
    // (recompraDays) en vez de duplicarlo acá.
    triggerType: "days-since-purchase",
    triggerDays: null,
    excludeInactive: true,
    sortOrder: 1,
    whatsappBody:
      "¡Hola {nombre}! 👋 Hace un tiempo que no te vemos por {negocio} y te extrañamos. Si venís esta semana, tenés un beneficio especial esperándote. 😊",
    emailSubject: "Te extrañamos en {negocio} 💚",
    emailBody:
      "¡Hola {nombre}!\n\nHace un tiempo que no pasás por {negocio}. Tenemos un beneficio especial reservado para vos si volvés esta semana.\n\n¡Nos encantaría verte de nuevo!\nEquipo de {negocio}",
  },
];
