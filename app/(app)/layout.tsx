import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { RegisterServiceWorker } from "@/components/register-sw";

// La app instalable (manifest + apple-web-app) es solo el panel: la landing
// pública y el login no deben ofrecer "instalar como app" (ver Fase 4).
export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vuelvo CRM",
  },
  // Next solo emite "mobile-web-app-capable" (sin prefijo); muchas versiones
  // de iOS Safari todavía requieren la variante "apple-" para el modo
  // standalone al agregar a inicio.
  other: { "apple-mobile-web-app-capable": "yes" },
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  return (
    <>
      <AppShell
        businessName={session.business.name}
        rubro={session.business.rubro}
        userEmail={session.email}
        isImpersonating={session.isImpersonating}
        modules={session.business.modules}
      >
        {children}
      </AppShell>
      <RegisterServiceWorker />
    </>
  );
}
