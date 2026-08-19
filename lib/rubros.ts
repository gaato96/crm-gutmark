// Rubro del negocio y vocabulario derivado.
//
// Archivo PURO — sin "server-only" y sin Prisma — porque lo importan casi todas
// las pantallas, incluidas las client (el editor del catálogo, el selector de
// venta, el editor de campañas).
//
// El sistema apunta a cualquier negocio con clientela que vuelve, no solo a
// los que dan servicios. Un kiosco vende productos, un consultorio vende
// servicios, y una barbería vende las dos cosas. En vez de escribir
// "Servicios" en toda la interfaz, cada negocio tiene un `catalogMode` y el
// texto sale de acá.

export const CATALOG_MODES = ["productos", "servicios", "ambos"] as const;
export type CatalogMode = (typeof CATALOG_MODES)[number];

export function isCatalogMode(v: string): v is CatalogMode {
  return (CATALOG_MODES as readonly string[]).includes(v);
}

export const DEFAULT_CATALOG_MODE: CatalogMode = "ambos";

// Rubros sugeridos, cada uno con el modo que le corresponde por defecto. La
// lista no pretende ser exhaustiva: "Otro" existe justamente para lo que no
// entra, y el superadmin siempre puede forzar el modo que quiera.
export const RUBROS: { code: string; label: string; mode: CatalogMode }[] = [
  { code: "barberia", label: "Barbería / Peluquería", mode: "ambos" },
  { code: "estetica", label: "Estética / Spa / Uñas", mode: "ambos" },
  { code: "veterinaria", label: "Veterinaria", mode: "ambos" },
  { code: "taller", label: "Taller mecánico / Service", mode: "ambos" },
  { code: "perfumeria", label: "Perfumería / Cosmética", mode: "productos" },
  { code: "indumentaria", label: "Indumentaria / Calzado", mode: "productos" },
  { code: "kiosco", label: "Kiosco / Almacén / Dietética", mode: "productos" },
  { code: "petshop", label: "Pet shop / Forrajería", mode: "productos" },
  { code: "gastronomia", label: "Gastronomía / Panadería", mode: "productos" },
  { code: "libreria", label: "Librería / Regalería", mode: "productos" },
  { code: "gimnasio", label: "Gimnasio / Estudio / Academia", mode: "servicios" },
  { code: "salud", label: "Salud / Consultorio", mode: "servicios" },
  { code: "profesional", label: "Servicios profesionales", mode: "servicios" },
  { code: "reparaciones", label: "Reparaciones / Oficios", mode: "servicios" },
  { code: "otro", label: "Otro", mode: "ambos" },
];

export function rubroLabel(code: string): string {
  return RUBROS.find((r) => r.code === code)?.label ?? code;
}

export function isRubroCode(v: string): boolean {
  return RUBROS.some((r) => r.code === v);
}

// Modo que le corresponde a un rubro. Si el rubro no está en la lista (texto
// viejo escrito a mano antes de que existieran los códigos), devuelve "ambos",
// que es el que no esconde nada.
export function modeForRubro(code: string): CatalogMode {
  return RUBROS.find((r) => r.code === code)?.mode ?? DEFAULT_CATALOG_MODE;
}

// --- Vocabulario ------------------------------------------------------------

export interface CatalogWords {
  // Ítem del sidebar y título de la pantalla
  nav: string;
  title: string;
  subtitle: string;
  // "un servicio" / "un producto" / "un ítem"
  singular: string;
  plural: string;
  nuevo: string;
  // Cada cuánto vuelve el cliente por ESE ítem
  recompraLabel: string;
  recompraHelp: string;
  // Quién hizo la venta
  sellerLabel: string;
  // Disparador de campaña
  triggerLabel: string;
  triggerHelp: string;
  // Verbo para describir la campaña: "Se hicieron X" / "Compraron X"
  triggerVerb: string;
  // Corte del reporte
  reportBreakdown: string;
  // Texto del estado vacío
  emptyTitle: string;
  emptyText: string;
  ejemplo: string;
}

const PALABRAS: Record<CatalogMode, CatalogWords> = {
  servicios: {
    nav: "Servicios",
    title: "Servicios",
    subtitle:
      "Cargá los servicios que ofrecés con su precio. Después los elegís al registrar una venta y podés armar campañas por servicio.",
    singular: "servicio",
    plural: "servicios",
    nuevo: "Nuevo servicio",
    recompraLabel: "¿Cada cuántos días vuelve?",
    recompraHelp:
      "Un corte se repite a los 15 días y una sesión mensual a los 30. Las campañas por servicio usan este número.",
    sellerLabel: "¿Quién atendió?",
    triggerLabel: "Servicio + días desde esa compra",
    triggerHelp:
      "Para quienes contrataron un servicio y ya pasó el tiempo en que se espera que vuelvan.",
    triggerVerb: "Se hicieron",
    reportBreakdown: "Por servicio",
    emptyTitle: "Todavía no cargaste servicios",
    emptyText:
      "Cargá lo que ofrecés con su precio y después lo elegís de una lista al registrar la venta, sin tipear el monto. Además vas a poder armar campañas por servicio.",
    ejemplo: "Corte + Barba",
  },
  productos: {
    nav: "Productos",
    title: "Productos",
    subtitle:
      "Cargá lo que vendés con su precio. Después lo elegís al registrar una venta y podés armar campañas por producto.",
    singular: "producto",
    plural: "productos",
    nuevo: "Nuevo producto",
    recompraLabel: "¿Cada cuántos días se repone?",
    recompraHelp:
      "Un shampoo se termina a los 45 días y un alimento de 15 kg al mes. Las campañas por producto usan este número para avisar justo cuando se le está por acabar.",
    sellerLabel: "¿Quién vendió?",
    triggerLabel: "Producto + días desde esa compra",
    triggerHelp:
      "Para quienes compraron un producto y ya se les tendría que estar terminando.",
    triggerVerb: "Compraron",
    reportBreakdown: "Por producto",
    emptyTitle: "Todavía no cargaste productos",
    emptyText:
      "Cargá lo que vendés con su precio y después lo elegís de una lista al registrar la venta, sin tipear el monto. Además vas a poder armar campañas como “a los que compraron alimento, avisales a los 30 días”.",
    ejemplo: "Alimento 15 kg",
  },
  ambos: {
    nav: "Catálogo",
    title: "Productos y servicios",
    subtitle:
      "Cargá lo que vendés con su precio. Después lo elegís al registrar una venta y podés armar campañas por lo que compró cada cliente.",
    singular: "ítem",
    plural: "productos y servicios",
    nuevo: "Nuevo ítem",
    recompraLabel: "¿Cada cuántos días vuelve?",
    recompraHelp:
      "Un corte se repite a los 15 días y un shampoo se termina a los 45. Las campañas usan este número para avisar en el momento justo.",
    sellerLabel: "¿Quién atendió?",
    triggerLabel: "Producto o servicio + días desde esa compra",
    triggerHelp:
      "Para quienes compraron algo puntual y ya pasó el tiempo en que se espera que vuelvan.",
    triggerVerb: "Compraron",
    reportBreakdown: "Por producto o servicio",
    emptyTitle: "Todavía no cargaste nada",
    emptyText:
      "Cargá lo que vendés con su precio y después lo elegís de una lista al registrar la venta, sin tipear el monto. Además vas a poder armar campañas como “a los que se hicieron corte + barba, escribiles a los 15 días”.",
    ejemplo: "Corte + Barba",
  },
};

export function catalogWords(mode: string): CatalogWords {
  return PALABRAS[isCatalogMode(mode) ? mode : DEFAULT_CATALOG_MODE];
}

// --- Tipo de cada ítem ------------------------------------------------------

export const ITEM_KINDS = ["producto", "servicio"] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];

export function isItemKind(v: string): v is ItemKind {
  return (ITEM_KINDS as readonly string[]).includes(v);
}

// Con qué tipo nace un ítem nuevo según el modo del negocio. En "ambos" cada
// ítem lo elige, y el default es servicio porque es lo que suele definir la
// visita (el corte trae al cliente, la cera se la lleva de paso).
export function defaultItemKind(mode: string): ItemKind {
  if (mode === "productos") return "producto";
  return "servicio";
}

export function itemKindLabel(kind: string): string {
  return kind === "producto" ? "Producto" : "Servicio";
}
