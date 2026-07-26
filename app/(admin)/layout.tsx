import Link from "next/link";
import { ShieldCheck, LogOut, Sparkles } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth";
import { logout } from "@/app/auth-actions";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireSuperAdmin();

  return (
    <div className="min-h-screen bg-canvas">
      <header className="glass sticky top-0 z-40 border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-white">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-base leading-none text-ink">GUTMARK</div>
              <span className="badge mt-1 bg-ink/10 text-ink-soft ring-ink/15">
                <ShieldCheck className="h-3 w-3" aria-hidden="true" /> Admin
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2.5">
            <span className="hidden text-sm text-ink-muted sm:block">{admin.email}</span>
            <ThemeToggle compact />
            <form action={logout}>
              <button
                type="submit"
                className="btn-secondary !py-2 text-sm"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" /> Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">{children}</main>
    </div>
  );
}
