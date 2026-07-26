"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Target,
  BellRing,
  Send,
  Settings,
  Menu,
  X,
  Sparkles,
  LogOut,
  ShoppingBag,
  UserPlus,
  Upload,
  Plus,
  ShieldAlert,
} from "lucide-react";
import { logout } from "@/app/auth-actions";
import { stopImpersonatingAction } from "@/app/admin-actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { QuickSaleModal } from "@/components/quick-sale-modal";

const NAV = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, exact: true },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/segmentos", label: "Segmentos", icon: Target },
  { href: "/recordatorios", label: "Recordatorios", icon: BellRing },
  { href: "/campanas", label: "Campañas", icon: Send },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((item) => {
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
  return (
    <div className="flex items-center gap-2.5 px-2">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-600/30">
        <Sparkles className="h-5 w-5" strokeWidth={2.4} />
      </div>
      <div className="leading-tight">
        <div className="font-display text-base leading-none text-ink">GUTMARK</div>
        <div className="text-[11px] font-medium text-brand-600 dark:text-brand-400">
          Fideliza
        </div>
      </div>
    </div>
  );
}

export function AppShell({
  children,
  businessName,
  rubro,
  userEmail,
  isImpersonating,
}: {
  children: React.ReactNode;
  businessName: string;
  rubro: string;
  userEmail: string;
  isImpersonating?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [quickSaleOpen, setQuickSaleOpen] = useState(false);
  const [speedDial, setSpeedDial] = useState(false);
  const speedDialRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (speedDialRef.current && !speedDialRef.current.contains(e.target as Node)) {
        setSpeedDial(false);
      }
    }
    if (speedDial) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [speedDial]);

  return (
    <div className="min-h-screen">
      {isImpersonating && (
        <div className="sticky top-0 z-50 flex items-center justify-center gap-2.5 bg-gold-500 px-4 py-2 text-sm font-semibold text-ink">
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
        <div className="py-2">
          <Brand />
        </div>

        <button
          onClick={() => setQuickSaleOpen(true)}
          className="btn-primary group mt-5 w-full justify-between !py-3"
        >
          <span className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" /> Nueva venta
          </span>
          <kbd className="rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white/80 group-hover:bg-white/25">
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
          <NavItems />
        </div>

        <BusinessCard businessName={businessName} rubro={rubro} userEmail={userEmail} />
      </aside>

      {/* Topbar mobile */}
      <div className="glass sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3 lg:hidden">
        <Brand />
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
              <NavItems onNavigate={() => setOpen(false)} />
            </div>
            <BusinessCard businessName={businessName} rubro={rubro} userEmail={userEmail} />
          </aside>
        </div>
      )}

      {/* Contenido */}
      <main className="min-w-0 px-4 py-6 pb-24 sm:px-6 lg:px-10 lg:py-8 lg:pb-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

      {/* Speed-dial móvil: acciones rápidas siempre a mano */}
      <div ref={speedDialRef} className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 lg:hidden">
        {speedDial && (
          <div className="flex flex-col items-end gap-2 animate-fade-in">
            <SpeedDialItem
              label="Importar"
              icon={<Upload className="h-4 w-4" />}
              href="/clientes/importar"
              onClick={() => setSpeedDial(false)}
            />
            <SpeedDialItem
              label="Nuevo cliente"
              icon={<UserPlus className="h-4 w-4" />}
              href="/clientes/nuevo"
              onClick={() => setSpeedDial(false)}
            />
            <SpeedDialItem
              label="Nueva venta"
              icon={<ShoppingBag className="h-4 w-4" />}
              onClick={() => {
                setSpeedDial(false);
                setQuickSaleOpen(true);
              }}
              primary
            />
          </div>
        )}
        <button
          onClick={() => setSpeedDial((s) => !s)}
          className={`grid h-14 w-14 place-items-center rounded-full bg-brand-600 text-white shadow-pop shadow-brand-600/30 transition-transform active:scale-95 ${
            speedDial ? "rotate-45" : ""
          }`}
          aria-label="Acciones rápidas"
          aria-expanded={speedDial}
        >
          <Plus className="h-6 w-6" strokeWidth={2.4} />
        </button>
      </div>

      <QuickSaleModal open={quickSaleOpen} onClose={() => setQuickSaleOpen(false)} />
      </div>
    </div>
  );
}

function SpeedDialItem({
  label,
  icon,
  href,
  onClick,
  primary,
}: {
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
}) {
  const cls = `flex items-center gap-2.5 rounded-full py-2 pl-3.5 pr-4 text-sm font-semibold shadow-pop transition active:scale-95 ${
    primary
      ? "bg-brand-600 text-white shadow-brand-600/30"
      : "bg-surface text-ink ring-1 ring-inset ring-line"
  }`;
  if (href) {
    return (
      <Link href={href} onClick={onClick} className={cls}>
        {icon}
        {label}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={cls}>
      {icon}
      {label}
    </button>
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
          <div className="truncate text-[11px] text-ink-muted">{rubro}</div>
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
