// Lo que trae de fábrica un negocio según su rubro: módulos, catálogo con la
// recompra de cada ítem, y campañas pensadas para ese tipo de cliente.
//
// Archivo PURO (sin Prisma): lo leen el alta de negocios (lib/rubro-setup.ts),
// el generador de demos (lib/demo-data.ts) y la landing, que muestra las
// campañas de ejemplo por rubro. Si una campaña mejora acá, mejora en los
// tres lados a la vez.
//
// La idea de fondo: un negocio recién creado no tiene que empezar en blanco.
// Una barbería ya sabe que el corte se repite a las tres semanas y una óptica
// que los lentes mensuales se terminan a los 30 días — el sistema también lo
// sabe, y arranca con las campañas armadas para aprovecharlo.

import type { ModuleCode } from "./modules";
import type { TriggerType } from "./campaigns";

export interface PresetService {
  name: string;
  price: number;
  category: string;
  kind: "producto" | "servicio";
  // Cada cuántos días vuelve el cliente por este ítem. null = usa el general.
  recompraDays: number | null;
  // Qué tan seguido se vende (solo para los datos demo). Default 1.
  weight?: number;
}

export interface PresetCampaign {
  name: string;
  description: string;
  triggerType: TriggerType;
  triggerValue: number | null;
  triggerUnit?: "dias" | "horas";
  triggerMaxValue?: number | null;
  // Para "service-recompra": nombre de un ítem de `services` (se resuelve al id
  // al crear el negocio) o `allServices` para "cualquiera".
  serviceName?: string;
  allServices?: boolean;
  segment?: string;
  minSpend?: number;
  excludeInactive?: boolean;
  whatsappBody: string;
  emailSubject: string;
  emailBody: string;
}

// Perfil de los datos de demostración: cómo se mueve un negocio de este rubro.
export interface DemoProfile {
  businessName: string;
  ownerName: string;
  // Login: <slug>@demo.vuelvo.app (la perfumería conserva su mail histórico).
  slug: string;
  email?: string;
  customers: number;
  // Proporción de clientes varones, para que los nombres sean creíbles.
  maleShare: number;
  // Peso relativo de cada día, de lunes a domingo. 0 = cerrado.
  weekdays: [number, number, number, number, number, number, number];
  // [hora, peso]. Las horas que no figuran no tienen ventas.
  hours: [number, number][];
  // Ventas por día en el último mes (mínimo y máximo).
  dailySales: [number, number];
  employees?: { name: string; commissionValue: number; commissionKind: "percent" | "fixed" }[];
  costRules?: { name: string; kind: "percent" | "fixed"; value: number; paymentMethod: string | null }[];
  // Peso de cada método de pago.
  payments: Partial<Record<"efectivo" | "debito" | "credito" | "transferencia" | "mercadopago", number>>;
}

export interface RubroPreset {
  rubro: string;
  // Solo módulos ya construidos: activar uno "próximamente" le cobraría al
  // negocio algo que no puede usar.
  modules: ModuleCode[];
  config: { recompraDays: number; inactivityDays: number; vipMinSpend: number; pointsPerAmount?: number };
  services: PresetService[];
  // Texto propio para las dos campañas de fábrica (el disparador no cambia).
  birthday?: Pick<PresetCampaign, "whatsappBody" | "emailSubject" | "emailBody">;
  winback?: Pick<PresetCampaign, "whatsappBody" | "emailSubject" | "emailBody">;
  campaigns: PresetCampaign[];
  demo?: DemoProfile;
}

// --- Campañas que sirven a casi cualquier rubro -----------------------------

function reactivacion(oferta: string): PresetCampaign {
  return {
    name: "Reactivación",
    description: "Para los que ya se dieron por perdidos. Un motivo concreto para volver.",
    triggerType: "segment",
    triggerValue: null,
    segment: "inactivo",
    whatsappBody: `¡Hola {nombre}! Hace mucho que no te vemos por {negocio} y nos encantaría que vuelvas. ${oferta} ¿Te esperamos esta semana?`,
    emailSubject: "{nombre}, te guardamos algo en {negocio}",
    emailBody: `¡Hola {nombre}!\n\nHace bastante que no pasás por {negocio}. ${oferta}\n\nNos encantaría volver a verte.\nEquipo de {negocio}`,
  };
}

function graciasVip(detalle: string): PresetCampaign {
  return {
    name: "Gracias VIP",
    description: "Reconocer a los que más te eligen. No vende: fideliza.",
    triggerType: "segment",
    triggerValue: null,
    segment: "vip",
    whatsappBody: `¡Hola {nombre}! 👑 Queríamos agradecerte por elegirnos siempre: sos de los clientes más importantes de {negocio}. ${detalle}`,
    emailSubject: "Gracias por elegirnos siempre, {nombre}",
    emailBody: `¡Hola {nombre}!\n\nSos de los clientes que más confían en {negocio} y queríamos agradecértelo. ${detalle}\n\nEquipo de {negocio}`,
  };
}

function bienvenida(texto: string): PresetCampaign {
  return {
    name: "Bienvenida",
    description: "El primer mensaje después de la primera compra. Es el que convierte una visita en un cliente.",
    triggerType: "segment",
    triggerValue: null,
    segment: "nuevo",
    whatsappBody: `¡Hola {nombre}! Gracias por elegir {negocio} 💚 ${texto}`,
    emailSubject: "¡Bienvenido/a a {negocio}, {nombre}!",
    emailBody: `¡Hola {nombre}!\n\nGracias por elegirnos. ${texto}\n\nEquipo de {negocio}`,
  };
}

function postServicio(pregunta: string, horas = 2): PresetCampaign {
  return {
    name: "¿Cómo te quedó?",
    description: `Unas horas después de la visita: pedir opinión y una reseña en Google mientras está fresco.`,
    triggerType: "service-recompra",
    allServices: true,
    triggerValue: horas,
    triggerUnit: "horas",
    triggerMaxValue: 24,
    whatsappBody: `¡Hola {nombre}! ${pregunta} Si te gustó, nos ayudás un montón dejándonos una reseña en Google ⭐ ¡Gracias por venir a {negocio}!`,
    emailSubject: "¿Cómo te fue con tu {servicio}?",
    emailBody: `¡Hola {nombre}!\n\n${pregunta}\n\nSi te gustó, una reseña en Google nos ayuda muchísimo.\n\nEquipo de {negocio}`,
  };
}

// --- Presets por rubro --------------------------------------------------------

const BARBERIA: RubroPreset = {
  rubro: "barberia",
  modules: ["caja", "puntos"],
  config: { recompraDays: 25, inactivityDays: 70, vipMinSpend: 120000, pointsPerAmount: 1000 },
  services: [
    { name: "Corte", price: 9000, category: "Cortes", kind: "servicio", recompraDays: 21, weight: 6 },
    { name: "Corte + Barba", price: 12500, category: "Cortes", kind: "servicio", recompraDays: 21, weight: 4 },
    { name: "Barba", price: 6000, category: "Barba", kind: "servicio", recompraDays: 14, weight: 2 },
    { name: "Coloración", price: 18000, category: "Color", kind: "servicio", recompraDays: 45, weight: 1 },
    { name: "Perfilado de cejas", price: 3500, category: "Extras", kind: "servicio", recompraDays: 30, weight: 1 },
    { name: "Pomada mate", price: 8500, category: "Productos", kind: "producto", recompraDays: 45, weight: 1 },
    { name: "Shampoo anticaspa", price: 7500, category: "Productos", kind: "producto", recompraDays: 40, weight: 0.5 },
  ],
  birthday: {
    whatsappBody:
      "¡Feliz cumple, {nombre}! 🎂💈 De parte de todo {negocio}: esta semana tu corte tiene 20% de descuento. ¿Te reservo un turno?",
    emailSubject: "🎂 Feliz cumple, {nombre}: tu corte va con 20% off",
    emailBody:
      "¡Hola {nombre}!\n\nTodo el equipo de {negocio} te desea un muy feliz cumpleaños. Esta semana tu corte tiene 20% de descuento.\n\n¡Te esperamos!",
  },
  campaigns: [
    postServicio("¿Qué tal quedó el {servicio}?"),
    {
      name: "Hora del corte",
      description: "A las tres semanas, que es cuando el corte se empieza a notar. Cada servicio con su tiempo.",
      triggerType: "service-recompra",
      allServices: true,
      triggerValue: null,
      excludeInactive: true,
      whatsappBody:
        "¡Hola {nombre}! 💈 Ya pasaron unas semanas de tu último {servicio}. ¿Te guardo un lugar esta semana? Respondé con el día y te confirmo el horario.",
      emailSubject: "{nombre}, ¿repetimos el {servicio}?",
      emailBody:
        "¡Hola {nombre}!\n\nYa pasaron unas semanas desde tu último {servicio}. Respondé este mail con el día que te queda bien y te reservamos.\n\n{negocio}",
    },
    reactivacion("Si venís en los próximos 15 días, tu corte tiene 25% de descuento."),
    graciasVip("Tu próxima barba va de regalo, de nuestra parte."),
  ],
  demo: {
    businessName: "Barbería El Faro",
    ownerName: "Martín (dueño)",
    slug: "barberia",
    customers: 230,
    maleShare: 0.92,
    weekdays: [0.6, 0.8, 0.9, 1, 1.3, 1.6, 0],
    hours: [[10, 0.7], [11, 1], [12, 0.8], [13, 0.4], [16, 0.7], [17, 1.1], [18, 1.5], [19, 1.6], [20, 1]],
    dailySales: [9, 16],
    employees: [
      { name: "Lucas", commissionValue: 45, commissionKind: "percent" },
      { name: "Nahuel", commissionValue: 45, commissionKind: "percent" },
      { name: "Bruno", commissionValue: 2500, commissionKind: "fixed" },
    ],
    costRules: [{ name: "Comisión Mercado Pago", kind: "percent", value: 6.29, paymentMethod: "mercadopago" }],
    payments: { efectivo: 4, mercadopago: 3, transferencia: 2, debito: 1 },
  },
};

const ESTETICA: RubroPreset = {
  rubro: "estetica",
  modules: ["caja", "puntos"],
  config: { recompraDays: 30, inactivityDays: 75, vipMinSpend: 180000, pointsPerAmount: 1000 },
  services: [
    { name: "Manicura semipermanente", price: 14000, category: "Uñas", kind: "servicio", recompraDays: 21, weight: 5 },
    { name: "Kapping gel", price: 17000, category: "Uñas", kind: "servicio", recompraDays: 21, weight: 2 },
    { name: "Pedicura", price: 16000, category: "Uñas", kind: "servicio", recompraDays: 30, weight: 2 },
    { name: "Limpieza facial profunda", price: 22000, category: "Facial", kind: "servicio", recompraDays: 30, weight: 2 },
    { name: "Depilación láser (sesión)", price: 28000, category: "Depilación", kind: "servicio", recompraDays: 35, weight: 3 },
    { name: "Lifting de pestañas", price: 19000, category: "Mirada", kind: "servicio", recompraDays: 45, weight: 1.5 },
    { name: "Masaje descontracturante", price: 20000, category: "Corporal", kind: "servicio", recompraDays: 30, weight: 1 },
    { name: "Crema hidratante facial", price: 15500, category: "Productos", kind: "producto", recompraDays: 45, weight: 0.7 },
  ],
  birthday: {
    whatsappBody:
      "¡Feliz cumpleaños, {nombre}! 🎂✨ En {negocio} queremos mimarte: esta semana tenés una limpieza facial de regalo con cualquier servicio. ¿Agendamos?",
    emailSubject: "🎂 {nombre}, tu regalo de cumple te espera",
    emailBody:
      "¡Hola {nombre}!\n\nQueremos celebrarte: esta semana tenés una limpieza facial de regalo con cualquier servicio.\n\nCon cariño,\n{negocio}",
  },
  campaigns: [
    postServicio("¿Cómo te sentiste con tu {servicio}?", 3),
    {
      name: "Retoque de semi",
      description: "A las tres semanas la semi empieza a crecer: el mejor momento para recordar el retoque.",
      triggerType: "service-recompra",
      serviceName: "Manicura semipermanente",
      triggerValue: null,
      excludeInactive: true,
      whatsappBody:
        "¡Hola {nombre}! 💅 Ya van tres semanas de tu semi y seguro está pidiendo retoque. ¿Te reservo un turno esta semana?",
      emailSubject: "{nombre}, ¿agendamos el retoque?",
      emailBody: "¡Hola {nombre}!\n\nYa pasaron tres semanas de tu semi. ¿Te reservamos el retoque?\n\n{negocio}",
    },
    {
      name: "Próxima sesión de láser",
      description: "El láser funciona si se respetan las sesiones. Recordarla a tiempo es parte del tratamiento.",
      triggerType: "service-recompra",
      serviceName: "Depilación láser (sesión)",
      triggerValue: null,
      excludeInactive: true,
      whatsappBody:
        "¡Hola {nombre}! Te toca la próxima sesión de láser ✨ Respetar los tiempos es lo que hace que funcione. ¿Qué día te queda bien?",
      emailSubject: "Te toca la próxima sesión de láser",
      emailBody:
        "¡Hola {nombre}!\n\nYa es momento de tu próxima sesión de depilación láser. Respetar los tiempos es clave para los resultados.\n\n{negocio}",
    },
    reactivacion("Volvé con 20% off en el servicio que elijas."),
    graciasVip("En tu próxima visita te espera un masaje de manos de regalo."),
  ],
  demo: {
    businessName: "Estética Lumière",
    ownerName: "Carolina (dueña)",
    slug: "estetica",
    customers: 210,
    maleShare: 0.08,
    weekdays: [0.7, 1, 1, 1.1, 1.3, 1.2, 0],
    hours: [[9, 0.6], [10, 1], [11, 1.1], [12, 0.8], [14, 0.6], [15, 0.9], [16, 1.1], [17, 1.3], [18, 1.2], [19, 0.6]],
    dailySales: [7, 13],
    employees: [
      { name: "Sofía", commissionValue: 40, commissionKind: "percent" },
      { name: "Agustina", commissionValue: 40, commissionKind: "percent" },
    ],
    costRules: [{ name: "Comisión Mercado Pago", kind: "percent", value: 6.29, paymentMethod: "mercadopago" }],
    payments: { transferencia: 3, mercadopago: 3, efectivo: 2, debito: 1, credito: 1 },
  },
};

const INDUMENTARIA: RubroPreset = {
  rubro: "indumentaria",
  modules: ["puntos", "caja"],
  config: { recompraDays: 60, inactivityDays: 150, vipMinSpend: 300000, pointsPerAmount: 2000 },
  services: [
    { name: "Remera básica", price: 14000, category: "Remeras", kind: "producto", recompraDays: 60, weight: 5 },
    { name: "Jean", price: 38000, category: "Pantalones", kind: "producto", recompraDays: 120, weight: 3 },
    { name: "Buzo", price: 32000, category: "Abrigo", kind: "producto", recompraDays: 120, weight: 2 },
    { name: "Campera", price: 65000, category: "Abrigo", kind: "producto", recompraDays: 180, weight: 1 },
    { name: "Zapatillas", price: 72000, category: "Calzado", kind: "producto", recompraDays: 150, weight: 1.5 },
    { name: "Pack de medias", price: 6500, category: "Accesorios", kind: "producto", recompraDays: 60, weight: 2 },
  ],
  birthday: {
    whatsappBody:
      "¡Feliz cumple, {nombre}! 🎁 En {negocio} te regalamos 15% de descuento en lo que quieras esta semana. Mostrá este mensaje en caja.",
    emailSubject: "🎁 {nombre}, tu regalo de cumple: 15% off",
    emailBody: "¡Hola {nombre}!\n\nFeliz cumpleaños. Esta semana tenés 15% off en toda la tienda.\n\n{negocio}",
  },
  campaigns: [
    {
      name: "¿Te quedó bien el talle?",
      description: "Al día siguiente de la compra. Baja los cambios incómodos y muestra que te importa.",
      triggerType: "days-since-purchase",
      triggerValue: 1,
      triggerMaxValue: 4,
      whatsappBody:
        "¡Hola {nombre}! ¿Te quedó bien lo que llevaste de {negocio}? Si el talle no era, tenés 30 días para cambiarlo sin vueltas. 😊",
      emailSubject: "¿Te quedó bien, {nombre}?",
      emailBody:
        "¡Hola {nombre}!\n\nQueríamos saber si te quedó bien tu compra. Si necesitás cambiar el talle, tenés 30 días.\n\n{negocio}",
    },
    {
      name: "Llegó la nueva temporada",
      description: "Para los clientes activos: que se enteren antes que nadie.",
      triggerType: "segment",
      triggerValue: null,
      segment: "frecuente",
      whatsappBody:
        "¡Hola {nombre}! 🛍️ Ya llegó la nueva colección a {negocio} y te la queremos mostrar antes que a nadie. ¿Pasás esta semana? Te separamos tu talle.",
      emailSubject: "{nombre}, llegó la nueva colección",
      emailBody: "¡Hola {nombre}!\n\nYa tenemos la nueva temporada. Pasá a verla antes que nadie.\n\n{negocio}",
    },
    reactivacion("Volvé y llevate 20% off en tu próxima compra."),
    graciasVip("Tenés acceso a la preventa de la nueva colección un día antes que el resto."),
  ],
  demo: {
    businessName: "Urbana Indumentaria",
    ownerName: "Julieta (dueña)",
    slug: "indumentaria",
    customers: 240,
    maleShare: 0.4,
    weekdays: [0.6, 0.7, 0.8, 0.9, 1.3, 1.8, 0.4],
    hours: [[10, 0.6], [11, 1], [12, 0.8], [13, 0.4], [17, 1], [18, 1.4], [19, 1.5], [20, 1]],
    dailySales: [6, 14],
    employees: [
      { name: "Camila", commissionValue: 5, commissionKind: "percent" },
      { name: "Tomás", commissionValue: 5, commissionKind: "percent" },
    ],
    costRules: [
      { name: "Comisión tarjeta de crédito", kind: "percent", value: 3.5, paymentMethod: "credito" },
      { name: "Comisión Mercado Pago", kind: "percent", value: 6.29, paymentMethod: "mercadopago" },
    ],
    payments: { credito: 4, debito: 2, mercadopago: 3, efectivo: 2, transferencia: 1 },
  },
};

const SUPLEMENTOS: RubroPreset = {
  rubro: "suplementos",
  modules: ["puntos", "caja"],
  config: { recompraDays: 30, inactivityDays: 75, vipMinSpend: 220000, pointsPerAmount: 1000 },
  services: [
    { name: "Proteína whey 1 kg", price: 42000, category: "Proteínas", kind: "producto", recompraDays: 30, weight: 5 },
    { name: "Creatina 300 g", price: 28000, category: "Rendimiento", kind: "producto", recompraDays: 45, weight: 4 },
    { name: "Pre entreno", price: 26000, category: "Rendimiento", kind: "producto", recompraDays: 30, weight: 2 },
    { name: "Multivitamínico", price: 18000, category: "Salud", kind: "producto", recompraDays: 60, weight: 1.5 },
    { name: "Barras de proteína x12", price: 15000, category: "Snacks", kind: "producto", recompraDays: 20, weight: 2 },
    { name: "Colágeno", price: 22000, category: "Salud", kind: "producto", recompraDays: 30, weight: 1.5 },
  ],
  birthday: {
    whatsappBody:
      "¡Feliz cumple, {nombre}! 💪🎂 Esta semana tenés 15% off en {negocio} para seguir entrenando con todo.",
    emailSubject: "🎂 Feliz cumple, {nombre}: 15% off",
    emailBody: "¡Hola {nombre}!\n\nFeliz cumpleaños. Esta semana tenés 15% off en toda la tienda.\n\n{negocio}",
  },
  campaigns: [
    {
      name: "Se te está terminando",
      description: "Cada producto con su duración: avisar justo antes de que se acabe, antes de que lo compre en otro lado.",
      triggerType: "service-recompra",
      allServices: true,
      triggerValue: null,
      excludeInactive: true,
      whatsappBody:
        "¡Hola {nombre}! 💪 Calculamos que se te está por terminar la {servicio}. ¿Te la separo? Si me confirmás hoy, te la llevamos sin cargo.",
      emailSubject: "{nombre}, ¿se te está terminando la {servicio}?",
      emailBody:
        "¡Hola {nombre}!\n\nCalculamos que se te está por terminar la {servicio}. Respondé este mail y te la separamos.\n\n{negocio}",
    },
    bienvenida("Cualquier duda sobre cómo tomar lo que llevaste, escribinos por acá. Te asesoramos sin cargo."),
    reactivacion("Volvé con 15% off y te armamos un plan según tu objetivo."),
    graciasVip("Tenés envío gratis en todos tus pedidos de este mes."),
  ],
  demo: {
    businessName: "Nutri Fuerza Suplementos",
    ownerName: "Diego (dueño)",
    slug: "suplementos",
    customers: 200,
    maleShare: 0.65,
    weekdays: [1.2, 1, 1, 1, 1.1, 0.9, 0],
    hours: [[9, 0.5], [10, 0.9], [11, 1], [12, 0.8], [17, 1], [18, 1.3], [19, 1.4], [20, 0.9]],
    dailySales: [7, 13],
    costRules: [{ name: "Comisión Mercado Pago", kind: "percent", value: 6.29, paymentMethod: "mercadopago" }],
    payments: { mercadopago: 4, transferencia: 3, efectivo: 2, debito: 1 },
  },
};

const GIMNASIO: RubroPreset = {
  rubro: "gimnasio",
  modules: ["caja"],
  config: { recompraDays: 32, inactivityDays: 50, vipMinSpend: 320000 },
  services: [
    { name: "Cuota mensual", price: 28000, category: "Membresías", kind: "servicio", recompraDays: 30, weight: 8 },
    { name: "Plan trimestral", price: 75000, category: "Membresías", kind: "servicio", recompraDays: 90, weight: 1.5 },
    { name: "Pase semanal", price: 9000, category: "Pases", kind: "servicio", recompraDays: 7, weight: 1 },
    { name: "Clase suelta", price: 4500, category: "Pases", kind: "servicio", recompraDays: 7, weight: 1 },
    { name: "Evaluación física", price: 8000, category: "Extras", kind: "servicio", recompraDays: 90, weight: 0.7 },
    { name: "Sesión con personal trainer", price: 12000, category: "Extras", kind: "servicio", recompraDays: 7, weight: 1 },
  ],
  birthday: {
    whatsappBody:
      "¡Feliz cumple, {nombre}! 🎂🏋️ En {negocio} te regalamos una sesión con personal trainer para que la uses este mes.",
    emailSubject: "🎂 {nombre}, una sesión de regalo por tu cumple",
    emailBody: "¡Hola {nombre}!\n\nFeliz cumpleaños. Te regalamos una sesión con personal trainer para usar este mes.\n\n{negocio}",
  },
  campaigns: [
    {
      name: "Vence tu cuota",
      description: "Un par de días antes del vencimiento. Cobrar a tiempo sin tener que perseguir a nadie.",
      triggerType: "service-recompra",
      serviceName: "Cuota mensual",
      triggerValue: 28,
      triggerMaxValue: 40,
      whatsappBody:
        "¡Hola {nombre}! 🏋️ Te recordamos que tu cuota de {negocio} vence en estos días. Podés pagarla por transferencia o en recepción. ¡Seguimos entrenando!",
      emailSubject: "Tu cuota vence en estos días",
      emailBody: "¡Hola {nombre}!\n\nTu cuota mensual vence en estos días. Podés abonarla por transferencia o en recepción.\n\n{negocio}",
    },
    {
      name: "Te extrañamos en el gym",
      description: "El momento crítico: cuando dejó de venir pero todavía no se borró.",
      triggerType: "days-since-purchase",
      triggerValue: 36,
      excludeInactive: true,
      whatsappBody:
        "¡Hola {nombre}! Hace unas semanas que no te vemos por {negocio} 💪 Lo más difícil es volver el primer día: si venís esta semana, la evaluación física va de regalo.",
      emailSubject: "{nombre}, te guardamos el lugar",
      emailBody:
        "¡Hola {nombre}!\n\nHace unas semanas que no venís. Si volvés esta semana, la evaluación física es de regalo.\n\n{negocio}",
    },
    {
      name: "Aniversario",
      description: "Un año entrenando juntos merece un mensaje.",
      triggerType: "days-since-signup",
      triggerValue: 365,
      whatsappBody:
        "¡{nombre}, ya es un año entrenando en {negocio}! 🥳 Gracias por la constancia. Pasá por recepción que tenemos un regalo para vos.",
      emailSubject: "¡Un año entrenando juntos, {nombre}!",
      emailBody: "¡Hola {nombre}!\n\nYa cumpliste un año en {negocio}. Gracias por la constancia: pasá por recepción por tu regalo.",
    },
    reactivacion("Volvé este mes y no pagás matrícula."),
  ],
  demo: {
    businessName: "Gimnasio Titán",
    ownerName: "Federico (dueño)",
    slug: "gimnasio",
    customers: 260,
    maleShare: 0.55,
    weekdays: [1.5, 1.2, 1.2, 1.1, 1, 0.5, 0],
    hours: [[7, 1.2], [8, 1.3], [9, 0.8], [10, 0.5], [12, 0.6], [13, 0.5], [17, 0.9], [18, 1.5], [19, 1.6], [20, 1.3], [21, 0.7]],
    dailySales: [8, 15],
    employees: [
      { name: "Recepción", commissionValue: 0, commissionKind: "percent" },
      { name: "Profe Valentina", commissionValue: 50, commissionKind: "percent" },
    ],
    payments: { transferencia: 4, efectivo: 3, mercadopago: 2, debito: 1 },
  },
};

const VETERINARIA: RubroPreset = {
  rubro: "veterinaria",
  modules: ["caja", "puntos"],
  config: { recompraDays: 35, inactivityDays: 120, vipMinSpend: 250000, pointsPerAmount: 1500 },
  services: [
    { name: "Consulta clínica", price: 15000, category: "Clínica", kind: "servicio", recompraDays: 180, weight: 3 },
    { name: "Vacuna antirrábica", price: 12000, category: "Vacunas", kind: "servicio", recompraDays: 365, weight: 1 },
    { name: "Vacuna séxtuple", price: 14000, category: "Vacunas", kind: "servicio", recompraDays: 365, weight: 1 },
    { name: "Baño y corte", price: 16000, category: "Peluquería", kind: "servicio", recompraDays: 30, weight: 3 },
    { name: "Alimento balanceado 15 kg", price: 55000, category: "Alimento", kind: "producto", recompraDays: 30, weight: 4 },
    { name: "Pipeta antipulgas", price: 9500, category: "Antiparasitarios", kind: "producto", recompraDays: 30, weight: 3 },
    { name: "Desparasitario", price: 6000, category: "Antiparasitarios", kind: "producto", recompraDays: 90, weight: 1.5 },
  ],
  birthday: {
    whatsappBody:
      "¡Feliz cumple, {nombre}! 🎂🐾 En {negocio} te regalamos 15% off en alimento esta semana. ¡Un abrazo a tu mascota!",
    emailSubject: "🎂 Feliz cumple, {nombre}",
    emailBody: "¡Hola {nombre}!\n\nFeliz cumpleaños. Esta semana tenés 15% off en alimento.\n\n{negocio}",
  },
  campaigns: [
    {
      name: "Alimento por terminarse",
      description: "Una bolsa de 15 kg dura un mes. Avisar antes de que la compre en el súper.",
      triggerType: "service-recompra",
      serviceName: "Alimento balanceado 15 kg",
      triggerValue: 26,
      excludeInactive: true,
      whatsappBody:
        "¡Hola {nombre}! 🐾 Calculamos que la bolsa de alimento se está por terminar. ¿Te la llevamos? Si confirmás hoy, el envío es sin cargo.",
      emailSubject: "¿Te llevamos el alimento, {nombre}?",
      emailBody: "¡Hola {nombre}!\n\nCalculamos que el alimento se está por terminar. Respondé y te lo llevamos sin cargo.\n\n{negocio}",
    },
    {
      name: "Pipeta del mes",
      description: "Las pulgas no esperan: la pipeta se renueva cada 30 días.",
      triggerType: "service-recompra",
      serviceName: "Pipeta antipulgas",
      triggerValue: null,
      excludeInactive: true,
      whatsappBody:
        "¡Hola {nombre}! Ya pasó un mes de la última pipeta 🐶 Es momento de renovarla para que siga protegido. ¿Te la separamos?",
      emailSubject: "Es momento de renovar la pipeta",
      emailBody: "¡Hola {nombre}!\n\nYa pasó un mes desde la última pipeta antipulgas. ¿Te la separamos?\n\n{negocio}",
    },
    {
      name: "Vacuna anual",
      description: "Recordatorio de la vacuna antirrábica a los 12 meses. Salud de la mascota y una visita asegurada.",
      triggerType: "service-recompra",
      serviceName: "Vacuna antirrábica",
      triggerValue: 350,
      whatsappBody:
        "¡Hola {nombre}! 💉 Se cumple un año de la última vacuna antirrábica. ¿Coordinamos un turno para esta semana?",
      emailSubject: "Recordatorio: vacuna antirrábica",
      emailBody: "¡Hola {nombre}!\n\nSe cumple un año de la última vacuna antirrábica. Respondé y coordinamos el turno.\n\n{negocio}",
    },
    {
      name: "Baño del mes",
      description: "Para los que vienen a peluquería: a las 4 semanas.",
      triggerType: "service-recompra",
      serviceName: "Baño y corte",
      triggerValue: null,
      excludeInactive: true,
      whatsappBody: "¡Hola {nombre}! 🛁 ¿Le toca baño y corte a tu mascota? Tenemos turnos esta semana.",
      emailSubject: "¿Agendamos baño y corte?",
      emailBody: "¡Hola {nombre}!\n\nYa pasó un mes del último baño. ¿Agendamos?\n\n{negocio}",
    },
    reactivacion("Tenemos un control clínico gratuito para tu mascota si venís este mes."),
  ],
  demo: {
    businessName: "Veterinaria Patitas",
    ownerName: "Dra. Laura (dueña)",
    slug: "veterinaria",
    customers: 240,
    maleShare: 0.4,
    weekdays: [1.1, 1, 1, 1, 1.2, 1, 0],
    hours: [[9, 0.8], [10, 1.1], [11, 1.2], [12, 0.9], [16, 0.8], [17, 1.1], [18, 1.3], [19, 0.9]],
    dailySales: [8, 15],
    employees: [
      { name: "Dra. Laura", commissionValue: 0, commissionKind: "percent" },
      { name: "Peluquera Mica", commissionValue: 40, commissionKind: "percent" },
    ],
    costRules: [{ name: "Comisión Mercado Pago", kind: "percent", value: 6.29, paymentMethod: "mercadopago" }],
    payments: { efectivo: 3, transferencia: 3, mercadopago: 2, debito: 2 },
  },
};

const PERFUMERIA: RubroPreset = {
  rubro: "perfumeria",
  modules: ["puntos", "caja"],
  config: { recompraDays: 45, inactivityDays: 100, vipMinSpend: 180000, pointsPerAmount: 1000 },
  services: [
    { name: "Perfume importado", price: 45000, category: "Perfumería", kind: "producto", recompraDays: 90, weight: 3 },
    { name: "Perfume nacional", price: 22000, category: "Perfumería", kind: "producto", recompraDays: 75, weight: 3 },
    { name: "Crema facial", price: 28000, category: "Cosmética", kind: "producto", recompraDays: 45, weight: 3 },
    { name: "Labial", price: 15000, category: "Maquillaje", kind: "producto", recompraDays: 60, weight: 2 },
    { name: "Shampoo y acondicionador", price: 12000, category: "Cabello", kind: "producto", recompraDays: 40, weight: 3 },
    { name: "Desodorante", price: 6000, category: "Cuidado personal", kind: "producto", recompraDays: 30, weight: 3 },
    { name: "Set de regalo", price: 62000, category: "Regalos", kind: "producto", recompraDays: null, weight: 1 },
  ],
  campaigns: [
    {
      name: "Reposición",
      description: "Cada producto con su duración: avisar cuando se está por terminar la crema, el shampoo o el perfume.",
      triggerType: "service-recompra",
      allServices: true,
      triggerValue: null,
      excludeInactive: true,
      whatsappBody:
        "¡Hola {nombre}! 🌸 Calculamos que tu {servicio} ya se está por terminar. ¿Te la separamos? Pasá cuando quieras o te la enviamos.",
      emailSubject: "{nombre}, ¿se te está terminando el {servicio}?",
      emailBody: "¡Hola {nombre}!\n\nCalculamos que tu {servicio} se está por terminar. ¿Te lo separamos?\n\n{negocio}",
    },
    {
      name: "Día de la Madre 🎁",
      description: "Fecha clave del rubro. Activala dos semanas antes y pausala después.",
      triggerType: "all",
      triggerValue: null,
      whatsappBody:
        "¡Hola {nombre}! 💐 Se viene el Día de la Madre y en {negocio} armamos sets de regalo desde $25.000, con envoltorio sin cargo. ¿Te reservo uno?",
      emailSubject: "Regalos para el Día de la Madre en {negocio}",
      emailBody:
        "¡Hola {nombre}!\n\nSe viene el Día de la Madre. Armamos sets de regalo desde $25.000, con envoltorio sin cargo.\n\n{negocio}",
    },
    graciasVip("En tu próxima compra te regalamos una muestra del perfume que elijas."),
    reactivacion("Tenés 20% off en tu próxima compra si venís este mes."),
  ],
  demo: {
    businessName: "Perfumería Bella",
    ownerName: "Dueña de Perfumería Bella",
    slug: "perfumeria",
    email: "demo@perfumeriabella.com",
    customers: 220,
    maleShare: 0.2,
    weekdays: [0.8, 0.9, 0.9, 1, 1.2, 1.5, 0],
    hours: [[9, 0.6], [10, 1], [11, 1.1], [12, 0.9], [13, 0.4], [17, 1], [18, 1.3], [19, 1.2], [20, 0.6]],
    dailySales: [7, 14],
    employees: [
      { name: "Vendedora Ana", commissionValue: 5, commissionKind: "percent" },
      { name: "Vendedora Paula", commissionValue: 5, commissionKind: "percent" },
    ],
    costRules: [
      { name: "Comisión Mercado Pago", kind: "percent", value: 6.29, paymentMethod: "mercadopago" },
      { name: "Comisión tarjeta de crédito", kind: "percent", value: 3.5, paymentMethod: "credito" },
    ],
    payments: { debito: 3, credito: 3, efectivo: 2, mercadopago: 2, transferencia: 1 },
  },
};

const OPTICA: RubroPreset = {
  rubro: "optica",
  modules: ["caja"],
  config: { recompraDays: 60, inactivityDays: 400, vipMinSpend: 300000 },
  services: [
    { name: "Lentes de contacto mensuales (caja)", price: 32000, category: "Contacto", kind: "producto", recompraDays: 30, weight: 5 },
    { name: "Líquido multipropósito", price: 9000, category: "Contacto", kind: "producto", recompraDays: 45, weight: 3 },
    { name: "Control visual", price: 15000, category: "Consultas", kind: "servicio", recompraDays: 365, weight: 1.5 },
    { name: "Anteojos recetados", price: 120000, category: "Anteojos", kind: "producto", recompraDays: 540, weight: 1 },
    { name: "Anteojos de sol", price: 85000, category: "Anteojos", kind: "producto", recompraDays: 365, weight: 0.8 },
    { name: "Ajuste y limpieza", price: 3000, category: "Servicios", kind: "servicio", recompraDays: 180, weight: 1.5 },
  ],
  campaigns: [
    {
      name: "Reposición de lentes",
      description: "La caja mensual dura 30 días. El que se queda sin lentes compra donde encuentra.",
      triggerType: "service-recompra",
      serviceName: "Lentes de contacto mensuales (caja)",
      triggerValue: 26,
      excludeInactive: true,
      whatsappBody:
        "¡Hola {nombre}! 👁️ Tu caja de lentes mensuales se está por terminar. ¿Te la preparamos? La retirás cuando quieras o te la enviamos.",
      emailSubject: "{nombre}, ¿te preparamos los lentes?",
      emailBody: "¡Hola {nombre}!\n\nTu caja de lentes de contacto se está por terminar. ¿Te la preparamos?\n\n{negocio}",
    },
    {
      name: "Control anual",
      description: "Un año del último control: salud visual y, muchas veces, receta nueva.",
      triggerType: "service-recompra",
      serviceName: "Control visual",
      triggerValue: null,
      whatsappBody:
        "¡Hola {nombre}! Ya pasó un año de tu último control visual. Te recomendamos hacerlo una vez por año. ¿Te damos un turno?",
      emailSubject: "Es momento de tu control visual anual",
      emailBody: "¡Hola {nombre}!\n\nYa pasó un año de tu último control visual. ¿Te damos un turno?\n\n{negocio}",
    },
    {
      name: "Ajuste gratis",
      description: "Una semana después de los anteojos nuevos: ¿te calzan bien?",
      triggerType: "service-recompra",
      serviceName: "Anteojos recetados",
      triggerValue: 7,
      triggerMaxValue: 15,
      whatsappBody:
        "¡Hola {nombre}! ¿Cómo te estás adaptando a los anteojos nuevos? 👓 Si te molestan o se aflojaron, pasá y te los ajustamos sin cargo.",
      emailSubject: "¿Cómo te quedan los anteojos nuevos?",
      emailBody: "¡Hola {nombre}!\n\n¿Cómo te estás adaptando a tus anteojos nuevos? Si necesitás un ajuste, es sin cargo.\n\n{negocio}",
    },
    reactivacion("Tenemos 20% off en anteojos de sol para clientes de siempre."),
  ],
  demo: {
    businessName: "Óptica Visión Clara",
    ownerName: "Gustavo (dueño)",
    slug: "optica",
    customers: 200,
    maleShare: 0.45,
    weekdays: [1, 1, 1, 1, 1.1, 1.2, 0],
    hours: [[9, 0.7], [10, 1], [11, 1.2], [12, 0.9], [17, 1], [18, 1.2], [19, 0.9]],
    dailySales: [5, 11],
    employees: [{ name: "Óptica Romina", commissionValue: 3, commissionKind: "percent" }],
    costRules: [{ name: "Comisión tarjeta de crédito", kind: "percent", value: 3.5, paymentMethod: "credito" }],
    payments: { credito: 4, debito: 2, transferencia: 2, efectivo: 2, mercadopago: 1 },
  },
};

const LAVADERO: RubroPreset = {
  rubro: "lavadero",
  modules: ["puntos", "caja"],
  config: { recompraDays: 15, inactivityDays: 50, vipMinSpend: 100000, pointsPerAmount: 1000 },
  services: [
    { name: "Lavado exterior", price: 8000, category: "Lavados", kind: "servicio", recompraDays: 14, weight: 5 },
    { name: "Lavado completo", price: 14000, category: "Lavados", kind: "servicio", recompraDays: 21, weight: 4 },
    { name: "Encerado", price: 22000, category: "Tratamientos", kind: "servicio", recompraDays: 60, weight: 1 },
    { name: "Limpieza de tapizados", price: 35000, category: "Tratamientos", kind: "servicio", recompraDays: 120, weight: 0.6 },
    { name: "Lavado de motor", price: 12000, category: "Tratamientos", kind: "servicio", recompraDays: 90, weight: 0.8 },
  ],
  birthday: {
    whatsappBody: "¡Feliz cumple, {nombre}! 🎂🚗 Esta semana tu lavado completo va de regalo en {negocio}.",
    emailSubject: "🎂 {nombre}, tu lavado de cumple es de regalo",
    emailBody: "¡Hola {nombre}!\n\nFeliz cumpleaños. Esta semana tu lavado completo es de regalo.\n\n{negocio}",
  },
  campaigns: [
    {
      name: "Tu auto pide un lavado",
      description: "Cada servicio con su frecuencia: el exterior cada dos semanas, el completo cada tres.",
      triggerType: "service-recompra",
      allServices: true,
      triggerValue: null,
      excludeInactive: true,
      whatsappBody:
        "¡Hola {nombre}! 🚗 Ya van unas semanas de tu último {servicio}. ¿Lo traés esta semana? Sin turno, te lo lavamos en el momento.",
      emailSubject: "{nombre}, tu auto pide un lavado",
      emailBody: "¡Hola {nombre}!\n\nYa pasaron unas semanas desde tu último {servicio}. ¡Te esperamos!\n\n{negocio}",
    },
    {
      name: "Sumaste puntos",
      description: "Para los clientes frecuentes: recordar cuántos puntos tienen acumulados.",
      triggerType: "segment",
      triggerValue: null,
      segment: "frecuente",
      whatsappBody:
        "¡Hola {nombre}! Ya juntaste {puntos} puntos en {negocio} 🎉 Con 100 puntos tu próximo lavado completo es gratis.",
      emailSubject: "{nombre}, ya tenés {puntos} puntos",
      emailBody: "¡Hola {nombre}!\n\nYa juntaste {puntos} puntos. Con 100, tu próximo lavado completo es gratis.\n\n{negocio}",
    },
    reactivacion("Volvé y te hacemos un encerado de regalo con el lavado completo."),
    graciasVip("El próximo lavado de motor va por nuestra cuenta."),
  ],
  demo: {
    businessName: "Lavadero Brillo",
    ownerName: "Ramiro (dueño)",
    slug: "lavadero",
    customers: 220,
    maleShare: 0.7,
    weekdays: [0.6, 0.7, 0.8, 0.9, 1.3, 1.8, 1],
    hours: [[9, 0.8], [10, 1.1], [11, 1.3], [12, 1], [13, 0.5], [15, 0.8], [16, 1], [17, 1.1], [18, 0.8]],
    dailySales: [9, 17],
    employees: [
      { name: "Kevin", commissionValue: 1500, commissionKind: "fixed" },
      { name: "Leandro", commissionValue: 1500, commissionKind: "fixed" },
    ],
    payments: { efectivo: 4, mercadopago: 3, transferencia: 2, debito: 1 },
  },
};

const TALLER: RubroPreset = {
  rubro: "taller",
  modules: ["caja"],
  config: { recompraDays: 180, inactivityDays: 420, vipMinSpend: 450000 },
  services: [
    { name: "Cambio de aceite y filtro", price: 45000, category: "Mantenimiento", kind: "servicio", recompraDays: 180, weight: 5 },
    { name: "Service completo", price: 95000, category: "Mantenimiento", kind: "servicio", recompraDays: 365, weight: 2 },
    { name: "Alineación y balanceo", price: 28000, category: "Tren delantero", kind: "servicio", recompraDays: 180, weight: 3 },
    { name: "Cambio de pastillas de freno", price: 60000, category: "Frenos", kind: "servicio", recompraDays: 365, weight: 1.5 },
    { name: "Revisión pre-VTV", price: 15000, category: "Revisiones", kind: "servicio", recompraDays: 365, weight: 1 },
    { name: "Batería", price: 110000, category: "Repuestos", kind: "producto", recompraDays: 730, weight: 0.5 },
  ],
  campaigns: [
    {
      name: "¿Cómo anda el auto?",
      description: "Dos días después del service: confianza, y si algo no quedó bien, enterarte vos antes que el cliente se queje.",
      triggerType: "days-since-purchase",
      triggerValue: 2,
      triggerMaxValue: 6,
      whatsappBody:
        "¡Hola {nombre}! ¿Cómo anda el auto después del service en {negocio}? 🔧 Cualquier ruido raro o duda, escribinos por acá.",
      emailSubject: "¿Cómo anda el auto, {nombre}?",
      emailBody: "¡Hola {nombre}!\n\n¿Cómo anda el auto después del service? Ante cualquier duda, escribinos.\n\n{negocio}",
    },
    {
      name: "Cambio de aceite",
      description: "A los 6 meses (o 10.000 km): el recordatorio que el cliente agradece y que nadie más le hace.",
      triggerType: "service-recompra",
      serviceName: "Cambio de aceite y filtro",
      triggerValue: null,
      whatsappBody:
        "¡Hola {nombre}! 🛢️ Ya pasaron 6 meses de tu último cambio de aceite. Para cuidar el motor, te recomendamos hacerlo ahora. ¿Te damos un turno?",
      emailSubject: "Te toca el cambio de aceite",
      emailBody: "¡Hola {nombre}!\n\nYa pasaron 6 meses de tu último cambio de aceite. ¿Te damos un turno?\n\n{negocio}",
    },
    {
      name: "Alineación y balanceo",
      description: "Cada 6 meses: cubiertas que duran más y un cliente que vuelve.",
      triggerType: "service-recompra",
      serviceName: "Alineación y balanceo",
      triggerValue: null,
      whatsappBody:
        "¡Hola {nombre}! Ya pasaron 6 meses de la última alineación y balanceo. Hacerlo a tiempo cuida las cubiertas. ¿Lo traés esta semana?",
      emailSubject: "Alineación y balanceo: es momento",
      emailBody: "¡Hola {nombre}!\n\nYa pasaron 6 meses de la última alineación y balanceo. ¿Coordinamos?\n\n{negocio}",
    },
    {
      name: "Se viene la VTV",
      description: "Once meses después de la revisión: que llegue a la VTV sin sorpresas.",
      triggerType: "service-recompra",
      serviceName: "Revisión pre-VTV",
      triggerValue: 330,
      whatsappBody:
        "¡Hola {nombre}! Se acerca la fecha de la VTV 🚗 Hacé la revisión previa en {negocio} y llegá tranquilo. ¿Te damos un turno?",
      emailSubject: "Se acerca la VTV",
      emailBody: "¡Hola {nombre}!\n\nSe acerca la VTV. Hacé la revisión previa con nosotros y llegá tranquilo.\n\n{negocio}",
    },
    reactivacion("Tenemos un chequeo de 20 puntos sin cargo para clientes de siempre."),
  ],
  demo: {
    businessName: "Taller Rueda Libre",
    ownerName: "Sergio (dueño)",
    slug: "taller",
    customers: 230,
    maleShare: 0.8,
    weekdays: [1.2, 1.1, 1, 1, 1, 0.6, 0],
    hours: [[8, 1.1], [9, 1.2], [10, 1], [11, 1], [12, 0.6], [14, 0.6], [15, 0.9], [16, 1], [17, 0.8]],
    dailySales: [5, 10],
    employees: [
      { name: "Mecánico Raúl", commissionValue: 30, commissionKind: "percent" },
      { name: "Mecánico Ezequiel", commissionValue: 30, commissionKind: "percent" },
    ],
    payments: { transferencia: 4, efectivo: 3, debito: 2, credito: 2 },
  },
};

// Rubros sin demo propia: igual arrancan con catálogo y campañas.
const PETSHOP: RubroPreset = {
  rubro: "petshop",
  modules: ["puntos"],
  config: { recompraDays: 30, inactivityDays: 90, vipMinSpend: 200000, pointsPerAmount: 1500 },
  services: VETERINARIA.services.filter((s) => s.kind === "producto"),
  campaigns: [VETERINARIA.campaigns[0], VETERINARIA.campaigns[1], reactivacion("Volvé con 15% off en alimento."), graciasVip("Tu próximo envío es sin cargo.")],
};

const GASTRONOMIA: RubroPreset = {
  rubro: "gastronomia",
  modules: ["puntos"],
  config: { recompraDays: 10, inactivityDays: 45, vipMinSpend: 80000, pointsPerAmount: 500 },
  services: [
    { name: "Café con medialunas", price: 4500, category: "Desayunos", kind: "producto", recompraDays: 7 },
    { name: "Almuerzo del día", price: 9000, category: "Almuerzos", kind: "producto", recompraDays: 7 },
    { name: "Docena de facturas", price: 7000, category: "Panadería", kind: "producto", recompraDays: 7 },
    { name: "Torta (por encargo)", price: 28000, category: "Pastelería", kind: "producto", recompraDays: null },
  ],
  birthday: {
    whatsappBody: "¡Feliz cumple, {nombre}! 🎂 Pasá esta semana por {negocio} y el café con medialunas va por nuestra cuenta.",
    emailSubject: "🎂 Tu desayuno de cumple es de regalo",
    emailBody: "¡Hola {nombre}!\n\nFeliz cumpleaños. Esta semana tu desayuno va por nuestra cuenta.\n\n{negocio}",
  },
  campaigns: [
    {
      name: "Sumaste puntos",
      description: "Recordar los puntos acumulados es la excusa perfecta para volver.",
      triggerType: "segment",
      triggerValue: null,
      segment: "frecuente",
      whatsappBody: "¡Hola {nombre}! Ya tenés {puntos} puntos en {negocio} ☕ Canjealos cuando quieras por un desayuno.",
      emailSubject: "Ya tenés {puntos} puntos",
      emailBody: "¡Hola {nombre}!\n\nYa juntaste {puntos} puntos. Canjealos cuando quieras.\n\n{negocio}",
    },
    reactivacion("Tu próximo café va de regalo."),
  ],
};

const KIOSCO: RubroPreset = {
  rubro: "kiosco",
  modules: ["puntos"],
  config: { recompraDays: 10, inactivityDays: 45, vipMinSpend: 100000, pointsPerAmount: 1000 },
  services: [],
  campaigns: [reactivacion("Volvé y llevate un 10% off en tu próxima compra."), graciasVip("Tenés un regalito esperándote en el mostrador.")],
};

const SALUD: RubroPreset = {
  rubro: "salud",
  modules: ["caja"],
  config: { recompraDays: 180, inactivityDays: 400, vipMinSpend: 200000 },
  services: [
    { name: "Consulta", price: 25000, category: "Consultas", kind: "servicio", recompraDays: 180 },
    { name: "Control anual", price: 25000, category: "Consultas", kind: "servicio", recompraDays: 365 },
    { name: "Sesión de tratamiento", price: 18000, category: "Tratamientos", kind: "servicio", recompraDays: 7 },
  ],
  campaigns: [
    {
      name: "Control anual",
      description: "A los 12 meses del último control.",
      triggerType: "service-recompra",
      serviceName: "Control anual",
      triggerValue: null,
      whatsappBody: "¡Hola {nombre}! Ya pasó un año de tu último control en {negocio}. ¿Te damos un turno?",
      emailSubject: "Es momento de tu control anual",
      emailBody: "¡Hola {nombre}!\n\nYa pasó un año de tu último control. ¿Te damos un turno?\n\n{negocio}",
    },
    reactivacion("Escribinos y te damos un turno prioritario."),
  ],
};

const GENERICO: RubroPreset = {
  rubro: "otro",
  modules: [],
  config: { recompraDays: 45, inactivityDays: 90, vipMinSpend: 150000 },
  services: [],
  campaigns: [reactivacion("Volvé con un 15% off en tu próxima compra."), graciasVip("En tu próxima visita tenemos un detalle para vos.")],
};

const PRESETS: RubroPreset[] = [
  BARBERIA,
  ESTETICA,
  INDUMENTARIA,
  SUPLEMENTOS,
  GIMNASIO,
  VETERINARIA,
  PERFUMERIA,
  OPTICA,
  LAVADERO,
  TALLER,
  PETSHOP,
  GASTRONOMIA,
  KIOSCO,
  SALUD,
];

export function presetFor(rubro: string): RubroPreset {
  return PRESETS.find((p) => p.rubro === rubro) ?? { ...GENERICO, rubro };
}

// Las cuentas demo que se pueden crear desde /admin, en el orden en que se listan.
export function demoPresets(): (RubroPreset & { demo: DemoProfile })[] {
  return PRESETS.filter((p): p is RubroPreset & { demo: DemoProfile } => Boolean(p.demo));
}

export function demoEmail(demo: DemoProfile): string {
  return demo.email ?? `${demo.slug}@demo.vuelvo.app`;
}
