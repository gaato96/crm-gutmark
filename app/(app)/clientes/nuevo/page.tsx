import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createCustomer } from "@/app/actions";
import { CustomerForm } from "@/components/customer-form";
import { PageHeader } from "@/components/ui";

export default function NuevoClientePage() {
  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <Link
        href="/clientes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a clientes
      </Link>
      <PageHeader
        title="Nuevo cliente"
        subtitle="Cargá los datos básicos. Después vas a poder registrar sus compras."
      />
      <CustomerForm
        action={createCustomer}
        submitLabel="Guardar cliente"
        cancelHref="/clientes"
      />
    </div>
  );
}
