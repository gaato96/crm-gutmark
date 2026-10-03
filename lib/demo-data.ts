// Datos de demostración: cuentas que se ven como un negocio real después de
// meses de uso, para mostrar el sistema a potenciales clientes.
//
// Sin "server-only": lo usa también scripts/demo-accounts.ts (tsx, fuera de
// Next). Todo lo que importa es puro o es lib/db.
//
// Dos piezas:
//
// 1. `resetDemoBusiness` BORRA los clientes y ventas de una cuenta demo y
//    genera todo de nuevo: cientos de clientes repartidos en segmentos,
//    ventas todos los días del último mes, cumpleaños hoy y esta semana,
//    recompras vencidas, inactivos, comisiones, cajas cerradas, puntos y
//    mensajes ya enviados. Solo corre sobre negocios con `isDemo` — nunca
//    sobre uno real.
//
// 2. `refreshDemoDates` corre todas las fechas hacia adelante cuando cambia
//    el día. Sin esto, una demo generada el lunes el jueves ya tendría tres
//    días sin ventas y los "cumple hoy" serían de antier. Se mueve TODO junto
//    (ventas, cumpleaños, cajas, mensajes), así la foto se mantiene igual
//    respecto de hoy. Son unos pocos UPDATE: es barato correrlo al entrar.

import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { demoEmail, demoPresets, presetFor, type DemoProfile, type RubroPreset } from "./rubro-presets";
import { applyRubroPreset } from "./rubro-setup";
import { computeSaleCosts, signedAmount } from "./cash";
import { matchesCampaign } from "./campaigns";
import { computeSegment } from "./segmentation";
import { modeForRubro } from "./rubros";
import { round2 } from "./sales";
import { DEFAULT_TZ, zonedMidnight, zonedParts } from "./tz";

export const DEMO_PASSWORD = "demo1234";
const DAY = 86400000;
const HOUR = 3600000;
// Ids propios (en vez de los cuid de Prisma) para poder insertar en bloque con
// createMany y relacionar filas antes de escribirlas.
const uid = (): string => randomUUID();

// --- Azar reproducible -----------------------------------------------------

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export type Rng = () => number;
export const randInt = (rng: Rng, min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
const pick = <T,>(rng: Rng, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
export function weighted<T>(rng: Rng, items: readonly T[], weight: (t: T) => number): T {
  const total = items.reduce((s, it) => s + Math.max(0, weight(it)), 0);
  let r = rng() * total;
  for (const it of items) {
    r -= Math.max(0, weight(it));
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

// --- Nombres ----------------------------------------------------------------

const MALE = [
  "Juan", "Martín", "Lucas", "Mateo", "Santiago", "Matías", "Nicolás", "Facundo", "Agustín", "Tomás",
  "Franco", "Gonzalo", "Diego", "Pablo", "Sebastián", "Federico", "Ignacio", "Joaquín", "Emiliano", "Lautaro",
  "Bruno", "Ramiro", "Ezequiel", "Leandro", "Maximiliano", "Rodrigo", "Gustavo", "Sergio", "Marcos", "Alejandro",
  "Patricio", "Hernán", "Esteban", "Cristian", "Damián", "Julián", "Nahuel", "Thiago", "Benjamín", "Valentín",
  "Fernando", "Carlos", "Jorge", "Raúl", "Luis", "Andrés", "Germán", "Mariano", "Walter", "Iván",
];
const FEMALE = [
  "María", "Lucía", "Sofía", "Valentina", "Camila", "Martina", "Julieta", "Florencia", "Agustina", "Paula",
  "Antonella", "Rocío", "Brenda", "Carla", "Daniela", "Micaela", "Gabriela", "Ana", "Josefina", "Emilia",
  "Victoria", "Milagros", "Belén", "Luciana", "Natalia", "Carolina", "Romina", "Silvina", "Lorena", "Mariana",
  "Constanza", "Pilar", "Abril", "Catalina", "Delfina", "Guadalupe", "Jimena", "Lara", "Mía", "Renata",
  "Verónica", "Claudia", "Andrea", "Laura", "Soledad", "Eugenia", "Celeste", "Noelia", "Ayelén", "Candela",
];
const SURNAMES = [
  "González", "Rodríguez", "Gómez", "Fernández", "López", "Díaz", "Martínez", "Pérez", "García", "Sánchez",
  "Romero", "Sosa", "Álvarez", "Torres", "Ruiz", "Ramírez", "Flores", "Benítez", "Acosta", "Medina",
  "Herrera", "Suárez", "Aguirre", "Giménez", "Gutiérrez", "Pereyra", "Rojas", "Molina", "Castro", "Ortiz",
  "Silva", "Núñez", "Luna", "Juárez", "Cabrera", "Ríos", "Ferreyra", "Godoy", "Morales", "Domínguez",
  "Moreno", "Peralta", "Vega", "Carrizo", "Quiroga", "Ponce", "Figueroa", "Córdoba", "Vargas", "Paz",
  "Ledesma", "Maldonado", "Ibáñez", "Coronel", "Navarro", "Arias", "Villalba", "Robles", "Bustos", "Campos",
];
const NOTES = [
  "Prefiere que le escriban por WhatsApp.",
  "Paga siempre con transferencia.",
  "Llegó recomendado por un amigo.",
  "Cliente de muchos años.",
  "Prefiere los turnos a última hora.",
  "Le gusta enterarse de las novedades.",
  "Viene con la familia.",
];

function ascii(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// --- Calendario en la hora del negocio ---------------------------------------

export interface Clock {
  now: Date;
  tz: string;
  // Partes del "hoy" del negocio.
  today: ReturnType<typeof zonedParts>;
}

export function dayStart(clock: Clock, daysAgo: number): Date {
  const d = new Date(Date.UTC(clock.today.year, clock.today.month - 1, clock.today.day - daysAgo));
  return zonedMidnight(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), clock.tz);
}

// Índice de la semana del perfil (0 = lunes … 6 = domingo).
export function weekdayIndex(clock: Clock, daysAgo: number): number {
  const wd = (((clock.today.weekday - daysAgo) % 7) + 7) % 7; // 0 = domingo
  return wd === 0 ? 6 : wd - 1;
}

function isOpen(profile: DemoProfile, clock: Clock, daysAgo: number): boolean {
  return profile.weekdays[weekdayIndex(clock, daysAgo)] > 0;
}

// El día abierto más cercano hacia atrás (si el elegido cae en domingo y el
// negocio cierra, la venta pasa al sábado).
function openDay(profile: DemoProfile, clock: Clock, daysAgo: number): number {
  let d = Math.max(0, daysAgo);
  for (let i = 0; i < 7; i++, d++) if (isOpen(profile, clock, d)) return d;
  return daysAgo;
}

// Un instante dentro del horario de atención de ese día. Hoy, solo horas que
// ya pasaron; si todavía no abrió, devuelve null.
function saleTime(profile: DemoProfile, clock: Clock, daysAgo: number, rng: Rng): Date | null {
  const start = dayStart(clock, daysAgo);
  const hours =
    daysAgo === 0
      ? profile.hours.filter(([h]) => start.getTime() + (h + 1) * HOUR <= clock.now.getTime() - 10 * 60000)
      : profile.hours;
  if (hours.length === 0) return null;
  const [h] = weighted(rng, hours, ([, w]) => w);
  return new Date(start.getTime() + h * HOUR + randInt(rng, 0, 55) * 60000);
}

// --- Cuentas demo -------------------------------------------------------------

// Crea (o reutiliza) el negocio y el usuario de una demo. Si el usuario ya
// existe, solo se asegura de que el negocio quede marcado como demo.
export async function ensureDemoBusiness(preset: RubroPreset & { demo: DemoProfile }): Promise<string> {
  const email = demoEmail(preset.demo);
  const mode = modeForRubro(preset.rubro);
  const existing = await db.user.findUnique({ where: { email }, select: { businessId: true } });

  if (existing) {
    await db.business.update({
      where: { id: existing.businessId },
      data: {
        isDemo: true,
        billingExempt: true,
        name: preset.demo.businessName,
        rubro: preset.rubro,
        catalogMode: mode,
        active: true,
      },
    });
    return existing.businessId;
  }

  const business = await db.business.create({
    data: {
      name: preset.demo.businessName,
      rubro: preset.rubro,
      catalogMode: mode,
      isDemo: true,
      billingExempt: true,
    },
  });
  await db.user.create({
    data: {
      email,
      name: preset.demo.ownerName,
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
      businessId: business.id,
      role: "owner",
    },
  });
  return business.id;
}

async function wipeBusinessData(businessId: string) {
  // El orden importa poco (casi todo cae en cascada desde Customer), pero
  // explícito es más fácil de auditar: esto es lo único que borra en masa.
  await db.contactLog.deleteMany({ where: { businessId } });
  await db.pointsEntry.deleteMany({ where: { businessId } });
  await db.saleCost.deleteMany({ where: { businessId } });
  await db.cashMovement.deleteMany({ where: { businessId } });
  await db.purchaseItem.deleteMany({ where: { businessId } });
  await db.purchase.deleteMany({ where: { businessId } });
  await db.cashSession.deleteMany({ where: { businessId } });
  await db.customer.deleteMany({ where: { businessId } });
  await db.employee.deleteMany({ where: { businessId } });
  await db.costRule.deleteMany({ where: { businessId } });
  await db.campaign.deleteMany({ where: { businessId } });
  await db.service.deleteMany({ where: { businessId } });
  await db.template.deleteMany({ where: { businessId } });
  await db.businessModule.updateMany({ where: { businessId }, data: { enabled: false } });
}

async function insertChunks<T>(rows: T[], insert: (chunk: T[]) => Promise<unknown>, size = 800) {
  for (let i = 0; i < rows.length; i += size) await insert(rows.slice(i, i + size));
}

export interface DemoResetResult {
  customers: number;
  purchases: number;
}

// Borra y regenera TODOS los datos de una cuenta demo.
export async function resetDemoBusiness(businessId: string): Promise<DemoResetResult> {
  const biz = await db.business.findUnique({
    where: { id: businessId },
    select: { id: true, isDemo: true, rubro: true, name: true, timezone: true },
  });
  // La única protección que importa: esto borra la cartera entera.
  if (!biz || !biz.isDemo) throw new Error("Solo se pueden restaurar cuentas demo.");

  const preset = presetFor(biz.rubro);
  const profile: DemoProfile =
    preset.demo ?? demoPresets().find((p) => p.rubro === "barberia")!.demo;

  await wipeBusinessData(businessId);
  await applyRubroPreset(businessId, biz.rubro, { modules: true });

  const now = new Date();
  const clock: Clock = { now, tz: biz.timezone || DEFAULT_TZ, today: zonedParts(now, biz.timezone || DEFAULT_TZ) };
  const rng = mulberry32(hash(`${businessId}:${clock.today.year}-${clock.today.month}-${clock.today.day}`));

  const [business, services, campaigns] = await Promise.all([
    db.business.findUniqueOrThrow({ where: { id: businessId } }),
    db.service.findMany({ where: { businessId }, orderBy: { sortOrder: "asc" } }),
    db.campaign.findMany({ where: { businessId } }),
  ]);
  const hasCaja = preset.modules.includes("caja");
  const hasPuntos = preset.modules.includes("puntos");
  const R = business.recompraDays;
  const I = business.inactivityDays;

  // Empleados y reglas de costo (Caja).
  const employees = hasCaja
    ? (profile.employees ?? []).map((e, i) => ({
        id: uid(),
        businessId,
        name: e.name,
        commissionValue: e.commissionValue,
        commissionKind: e.commissionKind,
        sortOrder: i,
      }))
    : [];
  const costRules = hasCaja
    ? (profile.costRules ?? []).map((r, i) => ({
        id: uid(),
        businessId,
        name: r.name,
        kind: r.kind,
        value: r.value,
        paymentMethod: r.paymentMethod,
        active: true,
        sortOrder: i,
      }))
    : [];
  if (employees.length) await db.employee.createMany({ data: employees });
  if (costRules.length) await db.costRule.createMany({ data: costRules });

  const weightOf = (name: string) =>
    preset.services.find((s) => s.name === name)?.weight ?? 1;
  const cadenceOf = (svc: (typeof services)[number] | undefined) =>
    Math.min(400, Math.max(7, svc?.recompraDays ?? R));
  // Al menos ~14 meses de historia: hay campañas de aniversario (365 días) y
  // de controles anuales que sin eso no tendrían a quién alcanzar.
  const maxHistory = Math.min(760, Math.max(430, Math.round(I * 2.2)));

  // --- Clientes ------------------------------------------------------------
  type Archetype = "vip" | "frecuente" | "ocasional" | "due" | "inactivo" | "nuevo" | "sin-compras";
  const MIX: [Archetype, number][] = [
    ["vip", 0.09],
    ["frecuente", 0.25],
    ["ocasional", 0.15],
    ["due", 0.16],
    ["inactivo", 0.22],
    ["nuevo", 0.09],
    ["sin-compras", 0.04],
  ];

  interface DraftCustomer {
    id: string;
    name: string;
    archetype: Archetype;
    primary: (typeof services)[number] | undefined;
    cadence: number;
    // Días atrás de cada compra.
    days: number[];
    createdDaysAgo: number;
  }

  const usedNames = new Set<string>();
  const drafts: DraftCustomer[] = [];
  for (let i = 0; i < profile.customers; i++) {
    let r = rng();
    let archetype: Archetype = "frecuente";
    for (const [a, share] of MIX) {
      if ((r -= share) <= 0) {
        archetype = a;
        break;
      }
    }

    let name = "";
    for (let tries = 0; tries < 20; tries++) {
      const first = rng() < profile.maleShare ? pick(rng, MALE) : pick(rng, FEMALE);
      name = `${first} ${pick(rng, SURNAMES)}`;
      if (!usedNames.has(name)) break;
    }
    usedNames.add(name);

    const primary = services.length ? weighted(rng, services, (s) => weightOf(s.name)) : undefined;
    const C = cadenceOf(primary);
    const days: number[] = [];
    let createdDaysAgo = 0;

    const history = (last: number, gapMin: number, gapMax: number, count: number) => {
      let d = last;
      for (let k = 0; k < count && d <= maxHistory; k++) {
        days.push(d);
        d += Math.max(2, Math.round(C * (gapMin + rng() * (gapMax - gapMin))));
      }
    };

    switch (archetype) {
      case "vip":
        history(randInt(rng, 0, Math.max(1, Math.min(Math.round(C * 0.5), I - 1))), 0.6, 0.95, randInt(rng, 7, 16));
        break;
      case "frecuente":
        history(randInt(rng, 0, Math.max(1, Math.min(Math.round(C * 0.8), R - 1))), 0.85, 1.25, randInt(rng, 3, 8));
        break;
      case "ocasional": {
        const last = randInt(rng, 3, Math.max(4, Math.min(R - 1, I - 1)));
        days.push(last, last + randInt(rng, C, C * 2));
        break;
      }
      case "due":
        history(randInt(rng, R + 1, Math.max(R + 2, I - 1)), 0.9, 1.3, randInt(rng, 1, 5));
        break;
      case "inactivo":
        history(randInt(rng, I + 3, Math.max(I + 4, Math.min(I * 3, maxHistory - 30))), 0.9, 1.4, randInt(rng, 1, 5));
        break;
      case "nuevo":
        createdDaysAgo = randInt(rng, 0, 25);
        if (rng() < 0.75) days.push(createdDaysAgo);
        break;
      case "sin-compras":
        createdDaysAgo = randInt(rng, 35, 200);
        break;
    }

    // Cada compra en un día que el negocio abre.
    const normalized = days.map((d) => openDay(profile, clock, d));
    if (normalized.length) createdDaysAgo = Math.max(...normalized) + randInt(rng, 0, 3);

    drafts.push({ id: uid(), name, archetype, primary, cadence: C, days: normalized, createdDaysAgo });
  }

  // Relleno del último mes: un negocio real vende todos los días. Se completa
  // con clientes VIP y frecuentes (los que ya vienen seguido), respetando un
  // mínimo de días entre visitas para que nadie compre tres veces por semana.
  const avgWeekday = profile.weekdays.reduce((s, w) => s + w, 0) / profile.weekdays.filter((w) => w > 0).length;
  const regulars = drafts.filter((d) => d.archetype === "vip" || d.archetype === "frecuente");
  const totalHourWeight = profile.hours.reduce((s, [, w]) => s + w, 0);
  for (let d = 0; d < 30; d++) {
    const w = profile.weekdays[weekdayIndex(clock, d)];
    if (w === 0) continue;
    let target = Math.round(randInt(rng, profile.dailySales[0], profile.dailySales[1]) * (w / avgWeekday));
    if (d === 0) {
      // Hoy, solo la parte del día que ya pasó.
      const start = dayStart(clock, 0).getTime();
      const elapsed = profile.hours
        .filter(([h]) => start + (h + 1) * HOUR <= now.getTime())
        .reduce((s, [, hw]) => s + hw, 0);
      target = Math.round((target * elapsed) / totalHourWeight);
    }
    const count = () => drafts.reduce((s, c) => s + c.days.filter((x) => x === d).length, 0);
    let guard = 0;
    while (count() < target && guard++ < 400) {
      const c = pick(rng, regulars);
      const minGap = Math.max(3, Math.round(c.cadence * 0.45));
      if (c.days.some((x) => Math.abs(x - d) < minGap)) continue;
      c.days.push(d);
      c.createdDaysAgo = Math.max(c.createdDaysAgo, d);
    }
  }

  // --- Cumpleaños: dos hoy, uno por día esta semana, unos recién pasados ---
  const order = [...drafts].sort(() => rng() - 0.5);
  const birthOffsets = new Map<string, number>();
  order.forEach((c, i) => {
    if (i < 2) birthOffsets.set(c.id, 0);
    else if (i < 9) birthOffsets.set(c.id, i - 1); // 1..7
    else if (i < 15) birthOffsets.set(c.id, -randInt(rng, 2, 20));
  });

  const usedPhones = new Set<string>();
  const customerRows = drafts.map((c) => {
    let birthdate: Date | null = null;
    const offset = birthOffsets.get(c.id);
    const age = randInt(rng, 18, 64);
    if (offset !== undefined) {
      const b = new Date(Date.UTC(clock.today.year, clock.today.month - 1, clock.today.day + offset));
      birthdate = new Date(Date.UTC(b.getUTCFullYear() - age, b.getUTCMonth(), b.getUTCDate()));
    } else if (rng() > 0.08) {
      birthdate = new Date(Date.UTC(clock.today.year - age, randInt(rng, 0, 11), randInt(rng, 1, 28)));
    }

    let phone: string | null = null;
    if (rng() > 0.04) {
      do phone = `549381${randInt(rng, 4000000, 6999999)}`;
      while (usedPhones.has(phone));
      usedPhones.add(phone);
    }
    const [first, ...rest] = c.name.split(" ");
    const email =
      rng() < 0.62
        ? `${ascii(first)}.${ascii(rest.join(""))}${rng() < 0.4 ? randInt(rng, 1, 99) : ""}@${pick(rng, ["gmail.com", "gmail.com", "hotmail.com", "yahoo.com.ar"])}`
        : null;

    return {
      id: c.id,
      businessId,
      name: c.name,
      phone,
      email,
      birthdate,
      notes: rng() < 0.1 ? pick(rng, NOTES) : null,
      tags: c.archetype === "vip" ? "fiel" : rng() < 0.06 ? "recomendó" : "",
      createdAt: new Date(dayStart(clock, c.createdDaysAgo).getTime() + randInt(rng, 9, 19) * HOUR),
      lastPurchaseAt: null as Date | null,
    };
  });
  const customerById = new Map(customerRows.map((c) => [c.id, c]));

  // --- Ventas --------------------------------------------------------------
  const paymentMethods = Object.entries(profile.payments) as [string, number][];
  const commissionEmployees = employees;

  const purchases: {
    id: string;
    businessId: string;
    customerId: string;
    date: Date;
    amount: number;
    subtotal: number;
    discount: number;
    discountNote: string | null;
    paymentMethod: string;
    employeeId: string | null;
    cashSessionId: string | null;
  }[] = [];
  const items: {
    id: string;
    businessId: string;
    customerId: string;
    purchaseId: string;
    serviceId: string | null;
    name: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    date: Date;
  }[] = [];

  for (const c of drafts) {
    for (const d of c.days) {
      let date = saleTime(profile, clock, d, rng);
      if (!date) date = saleTime(profile, clock, openDay(profile, clock, d + 1), rng);
      if (!date) continue;

      const lines: { svc: (typeof services)[number] | null; qty: number }[] = [];
      if (services.length) {
        const main = c.primary && rng() < 0.7 ? c.primary : weighted(rng, services, (s) => weightOf(s.name));
        lines.push({ svc: main, qty: main.kind === "producto" && rng() < 0.12 ? 2 : 1 });
        const extraChance = c.archetype === "vip" ? 0.55 : 0.22;
        if (rng() < extraChance && services.length > 1) {
          const extra = weighted(rng, services.filter((s) => s.id !== main.id), (s) => weightOf(s.name));
          lines.push({ svc: extra, qty: 1 });
        }
      } else {
        lines.push({ svc: null, qty: 1 });
      }

      const purchaseId = uid();
      let subtotal = 0;
      for (const l of lines) {
        const unitPrice = l.svc?.price ?? randInt(rng, 5, 40) * 1000;
        const sub = round2(unitPrice * l.qty);
        subtotal += sub;
        items.push({
          id: uid(),
          businessId,
          customerId: c.id,
          purchaseId,
          serviceId: l.svc?.id ?? null,
          name: l.svc?.name ?? "Venta",
          unitPrice,
          quantity: l.qty,
          subtotal: sub,
          date,
        });
      }
      const hasDiscount = rng() < 0.07;
      const discount = hasDiscount ? Math.round((subtotal * 0.1) / 100) * 100 : 0;
      const employee = commissionEmployees.length ? pick(rng, commissionEmployees) : null;

      purchases.push({
        id: purchaseId,
        businessId,
        customerId: c.id,
        date,
        amount: round2(subtotal - discount),
        subtotal: round2(subtotal),
        discount,
        discountNote: hasDiscount ? pick(rng, ["Cumpleaños", "Cliente frecuente", "Promo de la semana"]) : null,
        paymentMethod: weighted(rng, paymentMethods, ([, w]) => w)[0],
        employeeId: employee?.id ?? null,
        cashSessionId: null,
      });

      const cust = customerById.get(c.id)!;
      if (!cust.lastPurchaseAt || date > cust.lastPurchaseAt) cust.lastPurchaseAt = date;
      if (cust.createdAt > date) cust.createdAt = new Date(date.getTime() - randInt(rng, 0, 3) * DAY);
    }
  }

  // --- Caja: sesiones de los últimos 14 días + la de hoy abierta ------------
  const sessions: {
    id: string;
    businessId: string;
    openedAt: Date;
    closedAt: Date | null;
    openingAmount: number;
    countedAmount: number | null;
    expectedAmount: number | null;
    difference: number | null;
  }[] = [];
  const movements: {
    id: string;
    businessId: string;
    sessionId: string;
    kind: string;
    amount: number;
    paymentMethod: string;
    description: string;
    purchaseId: string | null;
    createdAt: Date;
  }[] = [];
  if (hasCaja) {
    const firstHour = Math.min(...profile.hours.map(([h]) => h));
    const lastHour = Math.max(...profile.hours.map(([h]) => h));
    for (let d = 14; d >= 0; d--) {
      if (!isOpen(profile, clock, d)) continue;
      const start = dayStart(clock, d).getTime();
      const openedAt = new Date(start + firstHour * HOUR - 20 * 60000);
      if (openedAt > now) continue;
      const closedAt = d === 0 ? null : new Date(start + (lastHour + 1) * HOUR + 15 * 60000);
      const sessionId = uid();
      const opening = 20000;
      let cash = 0;
      for (const p of purchases) {
        if (p.date < openedAt || (closedAt && p.date > closedAt) || (!closedAt && p.date > now)) continue;
        p.cashSessionId = sessionId;
        if (p.paymentMethod !== "efectivo") continue;
        cash += p.amount;
        movements.push({
          id: uid(),
          businessId,
          sessionId,
          kind: "venta",
          amount: signedAmount("venta", p.amount),
          paymentMethod: "efectivo",
          description: "Venta",
          purchaseId: p.id,
          createdAt: p.date,
        });
      }
      let egresos = 0;
      if (rng() < 0.35 && closedAt) {
        const monto = randInt(rng, 5, 25) * 1000;
        egresos -= monto;
        movements.push({
          id: uid(),
          businessId,
          sessionId,
          kind: "egreso",
          amount: signedAmount("egreso", monto),
          paymentMethod: "efectivo",
          description: pick(rng, ["Pago a proveedor", "Artículos de limpieza", "Insumos"]),
          purchaseId: null,
          createdAt: new Date(start + (firstHour + 3) * HOUR),
        });
      }
      const expected = round2(opening + cash + egresos);
      const diff = closedAt ? pick(rng, [0, 0, 0, 0, 0, -500, 200, -1000]) : null;
      sessions.push({
        id: sessionId,
        businessId,
        openedAt,
        closedAt,
        openingAmount: opening,
        countedAmount: closedAt ? round2(expected + (diff ?? 0)) : null,
        expectedAmount: closedAt ? expected : null,
        difference: closedAt ? diff : null,
      });
    }
  }

  // --- Costos por venta (comisiones y reglas) -------------------------------
  const saleCosts: {
    id: string;
    businessId: string;
    purchaseId: string;
    kind: string;
    label: string;
    amount: number;
    employeeId: string | null;
    costRuleId: string | null;
    date: Date;
    paidAt: Date | null;
  }[] = [];
  if (hasCaja) {
    // Lo de semanas anteriores ya se pagó (el lunes siguiente); lo de esta
    // semana está pendiente — así "A pagar" tiene números reales.
    const back = clock.today.weekday === 0 ? 6 : clock.today.weekday - 1;
    const thisMonday = dayStart(clock, back);
    const empById = new Map(employees.map((e) => [e.id, e]));
    for (const p of purchases) {
      const emp = p.employeeId ? empById.get(p.employeeId) ?? null : null;
      const costs = computeSaleCosts({
        total: p.amount,
        paymentMethod: p.paymentMethod,
        employee: emp,
        rules: costRules,
      });
      for (const cost of costs) {
        let paidAt: Date | null = null;
        if (cost.kind === "comision" && p.date < thisMonday) {
          const daysAgo = Math.floor((now.getTime() - p.date.getTime()) / DAY);
          const wd = weekdayIndex(clock, daysAgo); // 0 = lunes
          paidAt = new Date(p.date.getTime() + (7 - wd) * DAY);
          if (paidAt > now) paidAt = new Date(thisMonday.getTime() + 20 * HOUR);
        }
        saleCosts.push({
          id: uid(),
          businessId,
          purchaseId: p.id,
          kind: cost.kind,
          label: cost.label,
          amount: cost.amount,
          employeeId: cost.employeeId,
          costRuleId: cost.costRuleId,
          date: p.date,
          paidAt,
        });
      }
    }
  }

  // --- Puntos -----------------------------------------------------------------
  const points: {
    id: string;
    businessId: string;
    customerId: string;
    points: number;
    reason: string;
    note: string | null;
    purchaseId: string | null;
    createdAt: Date;
  }[] = [];
  if (hasPuntos) {
    const ppa = business.pointsPerAmount || 1000;
    const balance = new Map<string, number>();
    for (const p of purchases) {
      const pts = Math.floor(p.amount / ppa);
      if (pts <= 0) continue;
      points.push({
        id: uid(),
        businessId,
        customerId: p.customerId,
        points: pts,
        reason: "compra",
        note: null,
        purchaseId: p.id,
        createdAt: p.date,
      });
      balance.set(p.customerId, (balance.get(p.customerId) ?? 0) + pts);
    }
    for (const [customerId, bal] of balance) {
      if (bal < 60 || rng() > 0.25) continue;
      const last = customerById.get(customerId)?.lastPurchaseAt;
      if (!last) continue;
      points.push({
        id: uid(),
        businessId,
        customerId,
        points: -Math.min(bal - 10, randInt(rng, 3, 6) * 10),
        reason: "canje",
        note: pick(rng, ["Canje de premio", "Servicio de regalo", "Descuento por puntos"]),
        purchaseId: null,
        createdAt: last,
      });
    }
  }

  // --- Mensajes ya enviados -------------------------------------------------
  // Para que se vea el historial y, sobre todo, la plata que volvió después
  // de un mensaje. Cada contacto "de recompra" va unos días ANTES de una
  // compra real: es la historia que cuenta el dashboard.
  const byBuiltin = (b: string) => campaigns.find((c) => c.builtin === b);
  const recompraCampaign =
    campaigns.find((c) => c.triggerType === "service-recompra" && c.triggerUnit === "dias") ?? byBuiltin("winback");
  const reactivacion = campaigns.find((c) => c.triggerType === "segment" && c.segment === "inactivo");
  const birthdayCampaign = byBuiltin("birthday");
  const contacts: {
    id: string;
    businessId: string;
    customerId: string;
    reason: string;
    channel: string;
    campaignId: string | null;
    createdAt: Date;
  }[] = [];
  const purchasesByCustomer = new Map<string, Date[]>();
  for (const p of purchases) {
    const arr = purchasesByCustomer.get(p.customerId) ?? [];
    arr.push(p.date);
    purchasesByCustomer.set(p.customerId, arr);
  }
  for (const c of drafts) {
    const dates = (purchasesByCustomer.get(c.id) ?? []).sort((a, b) => a.getTime() - b.getTime());
    if ((c.archetype === "vip" || c.archetype === "frecuente") && dates.length >= 2 && rng() < 0.4 && recompraCampaign) {
      // Una compra de los últimos 60 días (que no sea la primera).
      const recent = dates.slice(1).filter((d) => now.getTime() - d.getTime() < 60 * DAY);
      if (recent.length) {
        const target = pick(rng, recent);
        contacts.push({
          id: uid(),
          businessId,
          customerId: c.id,
          reason: recompraCampaign.builtin ?? "campaign",
          channel: rng() < 0.9 ? "whatsapp" : "email",
          campaignId: recompraCampaign.id,
          createdAt: new Date(target.getTime() - randInt(rng, 1, 6) * DAY - randInt(rng, 1, 5) * HOUR),
        });
      }
    }
    if (c.archetype === "inactivo" && reactivacion && rng() < 0.12) {
      contacts.push({
        id: uid(),
        businessId,
        customerId: c.id,
        reason: "campaign",
        channel: "whatsapp",
        campaignId: reactivacion.id,
        createdAt: new Date(now.getTime() - randInt(rng, 3, 25) * DAY),
      });
    }
    const offset = birthOffsets.get(c.id);
    if (birthdayCampaign && offset !== undefined && offset < 0) {
      contacts.push({
        id: uid(),
        businessId,
        customerId: c.id,
        reason: "birthday",
        channel: "whatsapp",
        campaignId: birthdayCampaign.id,
        createdAt: new Date(dayStart(clock, -offset + 1).getTime() + 10 * HOUR),
      });
    }
  }
  // Uno de los que cumplen hoy ya recibió el saludo esta mañana: se ve el
  // "1 de N enviados" funcionando.
  const todayBirthday = drafts.find((c) => birthOffsets.get(c.id) === 0);
  const morning = new Date(dayStart(clock, 0).getTime() + 9 * HOUR + 15 * 60000);
  if (birthdayCampaign && todayBirthday && morning < now) {
    contacts.push({
      id: uid(),
      businessId,
      customerId: todayBirthday.id,
      reason: "birthday",
      channel: "whatsapp",
      campaignId: birthdayCampaign.id,
      createdAt: morning,
    });
  }

  // --- Campañas "en uso" -------------------------------------------------------
  // Una cuenta que se usó un mes no tiene 180 personas pendientes: a la
  // mayoría ya se les escribió en días anteriores y todavía no volvieron. Se
  // corre el motor real de campañas sobre los datos en memoria y se marca
  // como contactada a la mayor parte de cada audiencia, siempre DESPUÉS de su
  // última compra (así no inventan "plata recuperada"). Lo que queda pendiente
  // es un día de trabajo creíble, y el avance del plan se ve en uso.
  {
    const cfg = { inactivityDays: I, recompraDays: R, vipMinSpend: business.vipMinSpend };
    const defaults = {
      recompraDays: R,
      serviceRecompraDays: Object.fromEntries(services.map((s) => [s.id, s.recompraDays])),
    };
    const spent = new Map<string, { total: number; count: number }>();
    for (const p of purchases) {
      const cur = spent.get(p.customerId) ?? { total: 0, count: 0 };
      cur.total += p.amount;
      cur.count += 1;
      spent.set(p.customerId, cur);
    }
    const lastByService = new Map<string, Record<string, number>>();
    for (const it of items) {
      if (!it.serviceId) continue;
      const rec = lastByService.get(it.customerId) ?? {};
      rec[it.serviceId] = Math.max(rec[it.serviceId] ?? 0, it.date.getTime());
      lastByService.set(it.customerId, rec);
    }
    const hoursAgo = (t: number) => Math.floor((now.getTime() - t) / HOUR);
    const already = new Set(contacts.map((c) => `${c.campaignId}:${c.customerId}`));

    for (const cu of customerRows) {
      const st = spent.get(cu.id) ?? { total: 0, count: 0 };
      const target = {
        segment: computeSegment(
          {
            createdAt: cu.createdAt,
            lastPurchaseAt: cu.lastPurchaseAt,
            birthdate: cu.birthdate,
            totalSpent: st.total,
            purchaseCount: st.count,
          },
          cfg
        ),
        birthdayInDays: birthOffsets.get(cu.id) !== undefined && birthOffsets.get(cu.id)! >= 0
          ? birthOffsets.get(cu.id)!
          : null,
        daysSinceLast: cu.lastPurchaseAt ? Math.floor(hoursAgo(cu.lastPurchaseAt.getTime()) / 24) : null,
        hoursSinceLast: cu.lastPurchaseAt ? hoursAgo(cu.lastPurchaseAt.getTime()) : null,
        createdAt: cu.createdAt,
        totalSpent: st.total,
        hoursSinceService: Object.fromEntries(
          Object.entries(lastByService.get(cu.id) ?? {}).map(([sid, t]) => [sid, hoursAgo(t)])
        ),
      };

      for (const camp of campaigns) {
        // El cumpleaños se manda cerca del día: queda pendiente a propósito.
        if (camp.triggerType === "birthday") continue;
        if (already.has(`${camp.id}:${cu.id}`)) continue;
        if (!matchesCampaign(target, camp, defaults)) continue;

        const byTime = camp.triggerType === "days-since-purchase" || camp.triggerType === "service-recompra";
        const enHoras = byTime && camp.triggerUnit === "horas";
        if (rng() > (enHoras ? 0.5 : 0.78)) continue;

        let at: number;
        if (byTime && cu.lastPurchaseAt) {
          const last = cu.lastPurchaseAt.getTime();
          if (enHoras) {
            at = last + ((camp.triggerValue ?? 2) + rng() * 3) * HOUR;
          } else {
            // Entre que le venció la recompra y ayer.
            const from = Math.max(last + HOUR, now.getTime() - 25 * DAY);
            at = from + rng() * Math.max(0, now.getTime() - DAY - from);
          }
        } else {
          at = now.getTime() - randInt(rng, 1, 25) * DAY - randInt(rng, 0, 8) * HOUR;
        }
        if (at >= now.getTime() - 30 * 60000) continue;
        already.add(`${camp.id}:${cu.id}`);
        contacts.push({
          id: uid(),
          businessId,
          customerId: cu.id,
          reason: camp.builtin ?? "campaign",
          channel: rng() < 0.9 ? "whatsapp" : "email",
          campaignId: camp.id,
          createdAt: new Date(at),
        });
      }
    }
  }

  // --- Escritura en bloque ------------------------------------------------------
  await insertChunks(customerRows, (chunk) => db.customer.createMany({ data: chunk }));
  if (sessions.length) await db.cashSession.createMany({ data: sessions });
  await insertChunks(purchases, (chunk) => db.purchase.createMany({ data: chunk }));
  await insertChunks(items, (chunk) => db.purchaseItem.createMany({ data: chunk }));
  if (saleCosts.length) await insertChunks(saleCosts, (chunk) => db.saleCost.createMany({ data: chunk }));
  if (movements.length) await insertChunks(movements, (chunk) => db.cashMovement.createMany({ data: chunk }));
  if (points.length) await insertChunks(points, (chunk) => db.pointsEntry.createMany({ data: chunk }));
  if (contacts.length) await insertChunks(contacts, (chunk) => db.contactLog.createMany({ data: chunk }));

  await db.business.update({ where: { id: businessId }, data: { demoAnchorAt: now } });

  return { customers: customerRows.length, purchases: purchases.length };
}

// --- Mantener la demo "en hoy" -------------------------------------------------

// Días calendario (hora del negocio) entre dos instantes.
function calendarDays(from: Date, to: Date, tz: string): number {
  const a = zonedParts(from, tz);
  const b = zonedParts(to, tz);
  return Math.round(
    (Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / DAY
  );
}

// Corre todas las fechas de una demo la cantidad de días que pasaron desde que
// se generó (o desde el último corrimiento). Por días enteros y no por horas:
// así una venta de las 19:00 sigue siendo de las 19:00 y el reporte por hora
// no se desarma.
//
// Solo se mueve lo que es anterior al ancla: lo que el usuario cargue durante
// una demo ya está en hora real.
export async function refreshDemoDates(businessId: string): Promise<boolean> {
  const biz = await db.business.findUnique({
    where: { id: businessId },
    select: { isDemo: true, demoAnchorAt: true, timezone: true },
  });
  if (!biz?.isDemo || !biz.demoAnchorAt) return false;

  const anchor = biz.demoAnchorAt;
  const days = calendarDays(anchor, new Date(), biz.timezone || DEFAULT_TZ);
  if (days < 1) return false;

  // Candado optimista: si dos pedidos llegan juntos, solo uno corre las
  // fechas. Sin esto, la demo se adelantaría dos veces.
  const lock = await db.business.updateMany({
    where: { id: businessId, demoAnchorAt: anchor },
    data: { demoAnchorAt: new Date(anchor.getTime() + days * DAY) },
  });
  if (lock.count !== 1) return false;

  await db.$transaction([
    db.$executeRaw`UPDATE "Purchase" SET "date" = "date" + make_interval(days => ${days}::int) WHERE "businessId" = ${businessId} AND "date" <= ${anchor}`,
    db.$executeRaw`UPDATE "PurchaseItem" SET "date" = "date" + make_interval(days => ${days}::int) WHERE "businessId" = ${businessId} AND "date" <= ${anchor}`,
    db.$executeRaw`UPDATE "SaleCost" SET "date" = "date" + make_interval(days => ${days}::int) WHERE "businessId" = ${businessId} AND "date" <= ${anchor}`,
    db.$executeRaw`UPDATE "SaleCost" SET "paidAt" = "paidAt" + make_interval(days => ${days}::int) WHERE "businessId" = ${businessId} AND "paidAt" <= ${anchor}`,
    db.$executeRaw`UPDATE "CashSession" SET "openedAt" = "openedAt" + make_interval(days => ${days}::int) WHERE "businessId" = ${businessId} AND "openedAt" <= ${anchor}`,
    db.$executeRaw`UPDATE "CashSession" SET "closedAt" = "closedAt" + make_interval(days => ${days}::int) WHERE "businessId" = ${businessId} AND "closedAt" <= ${anchor}`,
    db.$executeRaw`UPDATE "CashMovement" SET "createdAt" = "createdAt" + make_interval(days => ${days}::int) WHERE "businessId" = ${businessId} AND "createdAt" <= ${anchor}`,
    db.$executeRaw`UPDATE "PointsEntry" SET "createdAt" = "createdAt" + make_interval(days => ${days}::int) WHERE "businessId" = ${businessId} AND "createdAt" <= ${anchor}`,
    db.$executeRaw`UPDATE "ContactLog" SET "createdAt" = "createdAt" + make_interval(days => ${days}::int) WHERE "businessId" = ${businessId} AND "createdAt" <= ${anchor}`,
    db.$executeRaw`UPDATE "Customer" SET "createdAt" = "createdAt" + make_interval(days => ${days}::int) WHERE "businessId" = ${businessId} AND "createdAt" <= ${anchor}`,
    db.$executeRaw`UPDATE "Customer" SET "lastPurchaseAt" = "lastPurchaseAt" + make_interval(days => ${days}::int) WHERE "businessId" = ${businessId} AND "lastPurchaseAt" <= ${anchor}`,
    // El cumpleaños es calendario: se corre igual para que "cumple hoy" siga
    // siendo hoy.
    db.$executeRaw`UPDATE "Customer" SET "birthdate" = "birthdate" + make_interval(days => ${days}::int) WHERE "businessId" = ${businessId} AND "birthdate" IS NOT NULL`,
  ]);
  return true;
}

// Crea las cuentas demo que falten (sin datos todavía). Devuelve los ids.
export async function ensureAllDemoBusinesses(): Promise<{ id: string; name: string }[]> {
  const out: { id: string; name: string }[] = [];
  for (const preset of demoPresets()) {
    const id = await ensureDemoBusiness(preset);
    out.push({ id, name: preset.demo.businessName });
  }
  return out;
}
