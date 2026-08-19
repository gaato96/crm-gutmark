// Catálogo y navegación de módulos opcionales de pago.
//
// IMPORTANTE: este archivo es puro — no importa "server-only" ni "@/lib/db".
// Lo importa components/app-shell.tsx, que es un client component, para
// resolver el ícono de cada módulo del lado del cliente (los componentes de
// lucide-react no se pueden pasar como prop desde un Server Component).

import type { LucideIcon } from "lucide-react";
import {
  Package,
  ScanBarcode,
  Wallet,
  BarChart3,
  Gift,
  LayoutGrid,
  CalendarClock,
  BookUser,
  Receipt,
} from "lucide-react";

export const MODULE_CODES = [
  "stock",
  "pos",
  "caja",
  "puntos",
  "catalogo",
  "turnos",
  "cuenta-corriente",
  "gastos",
] as const;

export type ModuleCode = (typeof MODULE_CODES)[number];

export function isModuleCode(v: string): v is ModuleCode {
  return (MODULE_CODES as readonly string[]).includes(v);
}

// Ítems de navegación por módulo (href + label + ícono), resueltos del
// lado del cliente contra la lista de códigos activos del negocio.
//
// Un mismo `code` puede aparecer más de una vez: "caja" se vende como un solo
// módulo ("Caja y Reportes") pero se navega desde dos pantallas distintas.
// Por eso las claves de React usan el href, que sí es único, y no el código.
//
// `implemented` marca si la ruta existe de verdad. El catálogo lista los nueve
// módulos, pero solo los implementados tienen página detrás; sin este flag,
// activarle a un negocio un módulo no construido le mete un link en el sidebar
// que termina en 404. Al construir un módulo, poner el flag en `true` — es el
// único lugar donde hay que tocarlo (nav, /modulos y /admin/modulos lo leen).
export const MODULE_NAV: {
  code: ModuleCode;
  href: string;
  label: string;
  icon: LucideIcon;
  implemented: boolean;
}[] = [
  { code: "pos", href: "/pos", label: "Punto de venta", icon: ScanBarcode, implemented: false },
  { code: "caja", href: "/caja", label: "Caja", icon: Wallet, implemented: true },
  { code: "caja", href: "/reportes", label: "Reportes", icon: BarChart3, implemented: true },
  { code: "stock", href: "/stock", label: "Stock", icon: Package, implemented: false },
  { code: "catalogo", href: "/catalogo", label: "Catálogo", icon: LayoutGrid, implemented: false },
  { code: "turnos", href: "/turnos", label: "Turnos", icon: CalendarClock, implemented: false },
  { code: "cuenta-corriente", href: "/cuenta-corriente", label: "Cuenta corriente", icon: BookUser, implemented: false },
  { code: "gastos", href: "/gastos", label: "Gastos", icon: Receipt, implemented: false },
  { code: "puntos", href: "/puntos", label: "Puntos", icon: Gift, implemented: true },
];

// ¿El módulo tiene página construida? Lo usan el sidebar (para no mostrar un
// link roto), /modulos (para decir "Próximamente") y /admin/modulos (para que
// el superadmin sepa qué es vendible hoy).
export function isModuleImplemented(code: string): boolean {
  return MODULE_NAV.some((m) => m.code === code && m.implemented);
}

// Semilla del catálogo: la usan prisma/seed.ts y la acción "Sincronizar
// catálogo" del superadmin. Los precios son sugeridos — el superadmin los
// puede editar libremente desde /admin/modulos sin que un re-seed los pise
// (ver lib/default-templates.ts-style upsert en admin-actions.ts).
//
// Valores alineados con docs/marketing/precios.md v2, que los reescaló sobre
// un plan base de $39.900. Si se cambia el plan base, revisar ese documento
// antes de tocar estos números: la escala relativa entre módulos es
// deliberada (Puntos es el más barato a propósito, como puerta de entrada).
export const MODULE_SEED: {
  code: ModuleCode;
  name: string;
  description: string;
  monthlyPrice: number;
  sortOrder: number;
}[] = [
  {
    code: "puntos",
    name: "Puntos / beneficios",
    description: "Programa de puntos o sellos por compra, con canje de premios.",
    monthlyPrice: 9900,
    sortOrder: 10,
  },
  {
    code: "stock",
    name: "Stock / Inventario",
    description: "Catálogo de productos, control de stock y precios.",
    monthlyPrice: 21900,
    sortOrder: 20,
  },
  {
    code: "pos",
    name: "Punto de venta (POS)",
    description: "Vendé productos del stock y descontá inventario automáticamente.",
    monthlyPrice: 26900,
    sortOrder: 30,
  },
  {
    code: "caja",
    name: "Caja y Reportes",
    description:
      "Apertura y cierre de caja con arqueo, comisiones por empleado y reportes de facturación y rentabilidad por semana y mes.",
    monthlyPrice: 26900,
    sortOrder: 40,
  },
  {
    code: "gastos",
    name: "Gastos y rentabilidad",
    description: "Registro de gastos y margen real del negocio.",
    monthlyPrice: 12900,
    sortOrder: 50,
  },
  {
    code: "cuenta-corriente",
    name: "Cuenta corriente",
    description: "Fiado por cliente, pagos parciales y recordatorio de deuda.",
    monthlyPrice: 12900,
    sortOrder: 60,
  },
  {
    code: "turnos",
    name: "Turnos / Reservas",
    description: "Agenda con link público para que el cliente reserve solo.",
    monthlyPrice: 17900,
    sortOrder: 70,
  },
  {
    code: "catalogo",
    name: "Catálogo digital",
    description: "Vidriera visual de productos, tipo scroll, para compartir con clientes.",
    monthlyPrice: 14900,
    sortOrder: 80,
  },
];
