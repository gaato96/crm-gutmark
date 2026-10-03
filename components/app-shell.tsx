"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Target,
  BellRing,
  Send,
  Settings,
  Blocks,
  Tags,
  BookOpen,
  Menu,
  X,
  LogOut,
  ShoppingBag,
  UserPlus,
  Upload,
  ShieldAlert,
} from "lucide-react";
import { logout } from "@/app/auth-actions";
import { stopImpersonatingAction } from "@/app/admin-actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { QuickSaleModal } from "@/components/quick-sale-modal";
import { Logo } from "@/components/logo";
import { MODULE_NAV } from "@/lib/modules";
import { catalogWords, rubroLabel } from "@/lib/rubros";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

// Ítems fijos del plan base, siempre presentes. Los módulos contratados se
// insertan entre estos dos grupos (ver AppShell).
// El ítem del catálogo se nombra según lo que venda el negocio: "Servicios"
// para un consultorio, "Productos" para un kiosco, "Catálogo" para los dos.
function baseNavStart(catalogMode: string): NavItem[] {
  return [
    { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, exact: true },
    { href: "/clientes", label: "Clientes", icon: Users },
    { href: "/catalogo", label: catalogWords(catalogMode).nav, icon: Tags },
    { href: "/segmentos", label: "Segmentos", icon: Target },
    { href: "/recordatorios", label: "Recordatorios", icon: BellRing },
    { href: "/campanas", label: "Campañas", icon: Send },
  ];
}
const BASE_NAV_END: NavItem[] = [
  { href: "/guia", label: "Guía", icon: BookOpen },
  { href: "/modulos", label: "Módulos", icon: Blocks },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

// Solo entran al sidebar los módulos contratados QUE ADEMÁS estén construidos:
// el catálogo se puede activar antes de que exista la página, y un link a una
// ruta inexistente le da un 404 al negocio.
function buildNavItems(modules: string[], catalogMode: string): NavItem[] {
  const active = MODULE_NAV.filter(
    (m) => m.implemented && modules.includes(m.code)
  ).map((m) => ({
    href: m.href,
    label: m.label,
    icon: m.icon,
  }));
  return [...baseNavStart(catalogMode), ...active, ...BASE_NAV_END];
}

function NavItems({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`nav-link ${active ? "nav-link-active" : ""}`}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2.2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return <Logo className="px-2" />;
}

export function AppShell({
  children,
  businessName,
  rubro,
  catalogMode,
  userEmail,
  isImpersonating,
  modules,
  isDemo,
}: {
  children: React.ReactNode;
  businessName: string;
  rubro: string;
  catalogMode: string;
  userEmail: string;
  isImpersonating?: boolean;
  modules: string[];
  isDemo?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [quickSaleOpen, setQuickSaleOpen] = useState(false);
  const navItems = buildNavItems(modules, catalogMode);

  // Atajo de teclado: "n" abre Nueva venta (si no estás escribiendo en un campo)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const typing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;
      if (!typing && !e.metaKey && !e.ctrlKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setQuickSaleOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);


  return (
    <div className="min-h-screen">
      {isImpersonating && (
        <div className="sticky top-0 z-50 flex items-center justify-center gap-2.5 bg-accent-500 px-4 py-2 text-sm font-semibold text-ink">
          <ShieldAlert className="h-4 w-4" aria-hidden="true" />
          Estás viendo esta cuenta como administrador.
          <form action={stopImpersonatingAction}>
            <button
              type="submit"
              className="ml-1 rounded-lg bg-ink/10 px-2.5 py-1 text-xs font-bold hover:bg-ink/20"
            >
              Volver a admin
            </button>
          </form>
        </div>
      )}
      <div className="lg:grid lg:grid-cols-[264px_1fr]">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-surface p-4 lg:flex">
        <div className="flex items-center justify-between gap-2 py-2">
          <Brand />
          {isDemo && <DemoBadge />}
        </div>

        <button
          onClick={() => setQuickSaleOpen(true)}
          className="btn-primary group mt-5 w-full justify-between !py-3"
        >
          <span className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" /> Nueva venta
          </span>
          {/* Texto oscuro y no blanco: sobre el verde de marca el blanco no
              llega al contraste mínimo (ver .btn-primary en globals.css). */}
          <kbd className="rounded-md bg-brand-950/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-brand-950/75 group-hover:bg-brand-950/15">
            N
          </kbd>
        </button>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <Link
            href="/clientes/nuevo"
            className="btn-secondary !py-2 text-xs"
          >
            <UserPlus className="h-3.5 w-3.5" /> Cliente
          </Link>
          <Link href="/clientes/importar" className="btn-secondary !py-2 text-xs">
            <Upload className="h-3.5 w-3.5" /> Importar
          </Link>
        </div>

        <div className="mt-6 flex-1 overflow-y-auto">
          <NavItems items={navItems} />
        </div>

        <BusinessCard businessName={businessName} rubro={rubro} userEmail={userEmail} />
      </aside>

      {/* Topbar mobile */}
      <div className="glass sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <Brand />
          {isDemo && <DemoBadge />}
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeToggle compact />
          <button
            onClick={() => setOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-xl text-ink-muted ring-1 ring-inset ring-line transition hover:bg-surface-2 hover:text-ink"
            aria-label="Abrir menú"
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[80%] max-w-xs flex-col bg-surface p-4 shadow-pop animate-slide-up">
            <div className="flex items-center justify-between py-2">
              <Brand />
              <button
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl text-ink-muted transition hover:bg-surface-2 hover:text-ink"
                aria-label="Cerrar menú"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>

            <button
              onClick={() => {
                setOpen(false);
                setQuickSaleOpen(true);
              }}
              className="btn-primary mt-5 w-full !py-3"
            >
              <ShoppingBag className="h-4 w-4" /> Nueva venta
            </button>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link
                href="/clientes/nuevo"
                onClick={() => setOpen(false)}
                className="btn-secondary !py-2 text-xs"
              >
                <UserPlus className="h-3.5 w-3.5" /> Cliente
              </Link>
              <Link
                href="/clientes/importar"
                onClick={() => setOpen(false)}
                className="btn-secondary !py-2 text-xs"
              >
                <Upload className="h-3.5 w-3.5" /> Importar
              </Link>
            </div>

            <div className="mt-6 flex-1 overflow-y-auto">
              <NavItems items={navItems} onNavigate={() => setOpen(false)} />
            </div>
            <BusinessCard businessName={businessName} rubro={rubro} userEmail={userEmail} />
          </aside>
        </div>
      )}

      {/* Contenido */}
      <main className="min-w-0 px-4 py-6 pb-32 sm:px-6 lg:px-10 lg:py-8 lg:pb-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

      {/* Barra inferior móvil. Reemplaza al botón flotante con menú: con el
          pulgar se llega a las cuatro pantallas de todos los días y a la venta,
          sin abrir nada antes. "Más" abre el menú completo. */}
      <nav
        aria-label="Navegación principal"
        className="glass fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2">
          <BottomLink href="/dashboard" exact label="Inicio" icon={LayoutDashboard} />
          <BottomLink href="/clientes" label="Clientes" icon={Users} />
          <div className="flex justify-center">
            <button
              onClick={() => setQuickSaleOpen(true)}
              className="-mt-5 mb-1 flex flex-col items-center gap-1"
              aria-label="Nueva venta"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-500 text-brand-950 shadow-pop shadow-brand-500/30 ring-4 ring-canvas transition-transform active:scale-95">
                <ShoppingBag className="h-6 w-6" strokeWidth={2.2} />
              </span>
              <span className="text-[11px] font-semibold text-ink-soft">Venta</span>
            </button>
          </div>
          <BottomLink href="/campanas" label="Campañas" icon={Send} />
          <button
            onClick={() => setOpen(true)}
            className="flex min-h-[56px] flex-col items-center justify-center gap-1 text-ink-muted"
            aria-label="Abrir menú completo"
          >
            <Menu className="h-5 w-5" strokeWidth={2.2} />
            <span className="text-[11px] font-semibold">Más</span>
          </button>
        </div>
      </nav>

      <QuickSaleModal open={quickSaleOpen} onClose={() => setQuickSaleOpen(false)} />
      </div>
    </div>
  );
}

function BottomLink({
  href,
  label,
  icon: Icon,
  exact,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-[56px] flex-col items-center justify-center gap-1 transition-colors ${
        active ? "text-brand-700 dark:text-brand-300" : "text-ink-muted hover:text-ink-soft"
      }`}
    >
      <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2.2} />
      <span className="text-[11px] font-semibold">{label}</span>
    </Link>
  );
}

// Aviso de cuenta de demostración: los datos son de ejemplo y se corren solos
// cada día. Que se vea, para que nadie lo confunda con un negocio real.
function DemoBadge() {
  return (
    <span
      className="rounded-full bg-accent-500/15 px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-accent-700 ring-1 ring-inset ring-accent-500/25 dark:text-accent-300"
      title="Cuenta de demostración: los datos son de ejemplo"
    >
      Demo
    </span>
  );
}

function BusinessCard({
  businessName,
  rubro,
  userEmail,
}: {
  businessName: string;
  rubro: string;
  userEmail: string;
}) {
  return (
    <div className="mt-4 rounded-xl bg-surface-2 p-3">
      <div className="flex items-center gap-2.5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-surface text-sm font-bold text-brand-700 ring-1 ring-line dark:text-brand-400">
          {businessName.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-sm font-semibold text-ink">{businessName}</div>
          <div className="truncate text-[11px] text-ink-muted">{rubroLabel(rubro)}</div>
        </div>
        <ThemeToggle />
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
        <span className="truncate text-[11px] text-ink-muted" title={userEmail}>
          {userEmail}
        </span>
        <form action={logout}>
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-ink-muted transition hover:bg-surface hover:text-rose-500"
            title="Cerrar sesión"
          >
            <LogOut className="h-3.5 w-3.5" /> Salir
          </button>
        </form>
      </div>
    </div>
  );
}
