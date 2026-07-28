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
  "reportes",
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
export const MODULE_NAV: { code: ModuleCode; href: string; label: string; icon: LucideIcon }[] = [
  { code: "pos", href: "/pos", label: "Punto de venta", icon: ScanBarcode },
  { code: "caja", href: "/caja", label: "Caja", icon: Wallet },
  { code: "stock", href: "/stock", label: "Stock", icon: Package },
  { code: "catalogo", href: "/catalogo", label: "Catálogo", icon: LayoutGrid },
  { code: "turnos", href: "/turnos", label: "Turnos", icon: CalendarClock },
  { code: "cuenta-corriente", href: "/cuenta-corriente", label: "Cuenta corriente", icon: BookUser },
  { code: "gastos", href: "/gastos", label: "Gastos", icon: Receipt },
  { code: "puntos", href: "/puntos", label: "Puntos", icon: Gift },
  { code: "reportes", href: "/reportes", label: "Reportes", icon: BarChart3 },
];

// Semilla del catálogo: la usan prisma/seed.ts y la acción "Sincronizar
// catálogo" del superadmin. Los precios son sugeridos — el superadmin los
// puede editar libremente desde /admin/modulos sin que un re-seed los pise
// (ver lib/default-templates.ts-style upsert en admin-actions.ts).
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
    monthlyPrice: 4000,
    sortOrder: 10,
  },
  {
    code: "stock",
    name: "Stock / Inventario",
    description: "Catálogo de productos, control de stock y precios.",
    monthlyPrice: 8000,
    sortOrder: 20,
  },
  {
    code: "pos",
    name: "Punto de venta (POS)",
    description: "Vendé productos del stock y descontá inventario automáticamente.",
    monthlyPrice: 10000,
    sortOrder: 30,
  },
  {
    code: "caja",
    name: "Caja",
    description: "Apertura, cierre y arqueo de caja diario.",
    monthlyPrice: 6000,
    sortOrder: 40,
  },
  {
    code: "gastos",
    name: "Gastos y rentabilidad",
    description: "Registro de gastos y margen real del negocio.",
    monthlyPrice: 5000,
    sortOrder: 50,
  },
  {
    code: "cuenta-corriente",
    name: "Cuenta corriente",
    description: "Fiado por cliente, pagos parciales y recordatorio de deuda.",
    monthlyPrice: 5000,
    sortOrder: 60,
  },
  {
    code: "turnos",
    name: "Turnos / Reservas",
    description: "Agenda con link público para que el cliente reserve solo.",
    monthlyPrice: 7000,
    sortOrder: 70,
  },
  {
    code: "catalogo",
    name: "Catálogo digital",
    description: "Vidriera visual de productos, tipo scroll, para compartir con clientes.",
    monthlyPrice: 6000,
    sortOrder: 80,
  },
  {
    code: "reportes",
    name: "Reportes",
    description: "Reportes avanzados de ventas, caja y rentabilidad.",
    monthlyPrice: 6000,
    sortOrder: 90,
  },
];
