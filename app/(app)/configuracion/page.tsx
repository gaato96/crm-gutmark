import { getCurrentBusiness } from "@/lib/queries";
import { PageHeader } from "@/components/ui";
import { ConfigForm } from "@/components/config-form";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const biz = await getCurrentBusiness();

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <PageHeader
        title="Configuración"
        subtitle="Personalizá tu negocio y las reglas con las que se agrupan tus clientes."
      />
      <ConfigForm
        business={{
          name: biz.name,
          rubro: biz.rubro,
          inactivityDays: biz.inactivityDays,
          recompraDays: biz.recompraDays,
          vipMinSpend: biz.vipMinSpend,
        }}
      />
    </div>
  );
}
