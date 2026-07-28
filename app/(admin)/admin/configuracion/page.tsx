import { requireSuperAdmin } from "@/lib/auth";
import { getPlatformSettings } from "@/lib/platform";
import { PageHeader } from "@/components/ui";
import { ChangePasswordForm } from "@/components/change-password-form";
import { AdminPlatformSettings } from "@/components/admin-platform-settings";

export const dynamic = "force-dynamic";

export default async function AdminConfiguracionPage() {
  await requireSuperAdmin();
  const settings = await getPlatformSettings();

  return (
    <div className="mx-auto max-w-2xl animate-fade-in space-y-6">
      <PageHeader
        title="Configuración"
        subtitle="Ajustes de la plataforma y tu cuenta de administrador."
      />
      <AdminPlatformSettings
        settings={{
          basePlanPrice: settings.basePlanPrice,
          currency: settings.currency,
          dueDay: settings.dueDay,
          showPricesToOwner: settings.showPricesToOwner,
        }}
      />
      <ChangePasswordForm />
    </div>
  );
}
