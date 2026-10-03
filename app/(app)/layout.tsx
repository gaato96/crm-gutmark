import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { RegisterServiceWorker } from "@/components/register-sw";
import { after } from "next/server";
import { refreshDemoDates } from "@/lib/demo-data";
import { topUpDemoToday } from "@/lib/demo-live";

// La app instalable (manifest + apple-web-app) es solo el panel: la landing
// pública y el login no deben ofrecer "instalar como app" (ver "PWA" en CLAUDE.md).
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

  // Las cuentas demo se mantienen "en hoy": si cambió el día desde la última
  // visita, se corren todas sus fechas (ver lib/demo-data.ts). En un negocio
  // real no hace nada.
  if (session.business.isDemo) {
    const businessId = session.business.id;
    await refreshDemoDates(businessId).catch(() => false);
    // Las ventas de las horas de hoy que ya pasaron se cargan después de
    // responder, para no demorar la pantalla (ver lib/demo-live.ts).
    after(() => topUpDemoToday(businessId).catch(() => 0));
  }

  return (
    <>
      <AppShell
        businessName={session.business.name}
        rubro={session.business.rubro}
        catalogMode={session.business.catalogMode}
        userEmail={session.email}
        isImpersonating={session.isImpersonating}
        modules={session.business.modules}
        isDemo={session.business.isDemo}
      >
        {children}
      </AppShell>
      <RegisterServiceWorker />
    </>
  );
}
