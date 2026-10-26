import Link from "next/link";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import {
  ConfigForm,
  BusinessProfileForm,
  AppearanceForm,
  WeeklySummaryToggle,
} from "@/components/config-form";
import { ChangePasswordForm } from "@/components/change-password-form";

export const dynamic = "force-dynamic";

const TABS = [
  { code: "negocio", label: "Negocio" },
  { code: "apariencia", label: "Apariencia" },
  { code: "reglas", label: "Reglas de clientes" },
  { code: "cuenta", label: "Cuenta" },
] as const;

type Tab = (typeof TABS)[number]["code"];

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  const { tab: raw } = await searchParams;
  const tab: Tab = TABS.some((t) => t.code === raw) ? (raw as Tab) : "negocio";

  const biz = await db.business.findUniqueOrThrow({
    where: { id: session.business.id },
    select: {
      name: true,
      rubro: true,
      inactivityDays: true,
      recompraDays: true,
      vipMinSpend: true,
      displayName: true,
      phone: true,
      instagram: true,
      address: true,
      weeklySummary: true,
    },
  });
  const logoUrl = session.business.logoVersion ? `/mi-logo?v=${session.business.logoVersion}` : null;

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <PageHeader
        title="Configuración"
        subtitle="Los datos de tu negocio, cómo se ve tu panel y las reglas con las que se agrupan tus clientes."
      />

      <nav aria-label="Secciones" className="mb-6 inline-flex max-w-full overflow-x-auto rounded-xl bg-surface-2 p-1">
        {TABS.map((t) => (
          <Link
            key={t.code}
            href={`/configuracion?tab=${t.code}`}
            aria-current={tab === t.code ? "page" : undefined}
            className={`shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === t.code ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink-soft"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "negocio" && (
        <BusinessProfileForm
          impersonating={session.isImpersonating}
          data={{
            name: biz.name,
            rubro: biz.rubro,
            displayName: biz.displayName,
            ownerName: session.name,
            phone: biz.phone,
            instagram: biz.instagram,
            address: biz.address,
          }}
        />
      )}
      {tab === "apariencia" && (
        <AppearanceForm
          businessName={biz.name}
          accentColor={session.business.accentColor}
          logoUrl={logoUrl}
        />
      )}
      {tab === "reglas" && (
        <ConfigForm
          business={{
            name: biz.name,
            rubro: biz.rubro,
            inactivityDays: biz.inactivityDays,
            recompraDays: biz.recompraDays,
            vipMinSpend: biz.vipMinSpend,
          }}
        />
      )}
      {tab === "cuenta" && (
        <div className="space-y-6">
          <WeeklySummaryToggle enabled={biz.weeklySummary} email={session.email} />
          <ChangePasswordForm />
        </div>
      )}
    </div>
  );
}
