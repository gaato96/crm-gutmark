import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { AdminNewBusinessForm } from "@/components/admin-new-business-form";

export default function NuevoNegocioPage() {
  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a negocios
      </Link>
      <PageHeader
        title="Nuevo negocio"
        subtitle="Creá la cuenta para un negocio que te pidió acceso."
      />
      <AdminNewBusinessForm />
    </div>
  );
}
