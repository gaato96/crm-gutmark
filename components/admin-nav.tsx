"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Negocios", exact: true },
  { href: "/admin/seguimiento", label: "Seguimiento" },
  { href: "/admin/soporte", label: "Soporte" },
  { href: "/admin/modulos", label: "Módulos" },
  { href: "/admin/configuracion", label: "Configuración" },
];

// En el celular la barra va debajo del encabezado y se desliza de costado:
// antes quedaba oculta y desde el teléfono no había forma de llegar a Módulos
// o Configuración sin tipear la URL.
export function AdminNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      className={
        mobile
          ? "-mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-2 lg:hidden"
          : "hidden items-center gap-1 lg:flex"
      }
    >
      {ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              active ? "bg-ink/10 text-ink" : "text-ink-muted hover:bg-surface-2 hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
