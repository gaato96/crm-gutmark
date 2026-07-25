import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { updateCustomer } from "@/app/actions";
import { CustomerForm } from "@/components/customer-form";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await db.customer.findUnique({ where: { id } });
  if (!customer) notFound();

  const action = updateCustomer.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <Link
        href={`/clientes/${id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al cliente
      </Link>
      <PageHeader title="Editar cliente" />
      <CustomerForm
        action={action}
        submitLabel="Guardar cambios"
        cancelHref={`/clientes/${id}`}
        customer={{
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          birthdate: customer.birthdate,
          notes: customer.notes,
          tags: customer.tags ? customer.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        }}
      />
    </div>
  );
}
