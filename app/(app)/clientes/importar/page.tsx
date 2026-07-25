import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { ImportCustomers } from "@/components/import-customers";

export default function ImportarPage() {
  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <Link
        href="/clientes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a clientes
      </Link>
      <PageHeader
        title="Importar clientes"
        subtitle="Cargá toda tu cartera de una vez desde un archivo CSV de Excel o Google Sheets."
      />
      <ImportCustomers />
    </div>
  );
}
