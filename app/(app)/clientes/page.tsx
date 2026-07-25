import Link from "next/link";
import { UserPlus, Users, Upload, Download } from "lucide-react";
import {
  getCurrentBusiness,
  getEnrichedCustomers,
  toConfig,
} from "@/lib/queries";
import { PageHeader, EmptyState } from "@/components/ui";
import { CustomersList, CustomerRow } from "@/components/customers-list";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const biz = await getCurrentBusiness();
  const cfg = toConfig(biz);
  const customers = await getEnrichedCustomers(biz.id, cfg);

  const rows: CustomerRow[] = customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    segment: c.segment,
    isVip: c.isVip,
    totalSpent: c.totalSpent,
    purchaseCount: c.purchaseCount,
    daysSinceLast: c.daysSinceLast,
    birthdayInDays: c.birthdayInDays,
    tags: c.tags,
  }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Clientes"
        subtitle={`${customers.length} clientes en tu cartera`}
        action={
          <>
            {customers.length > 0 && (
              <a href="/clientes/export" className="btn-secondary" download>
                <Download className="h-4 w-4" /> Exportar
              </a>
            )}
            <Link href="/clientes/importar" className="btn-secondary">
              <Upload className="h-4 w-4" /> Importar
            </Link>
            <Link href="/clientes/nuevo" className="btn-primary">
              <UserPlus className="h-4 w-4" /> Nuevo cliente
            </Link>
          </>
        }
      />

      {customers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title="Todavía no cargaste clientes"
          description="Empezá a construir tu cartera. Cargá tu primer cliente y registrá sus compras para conocer sus hábitos."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/clientes/importar" className="btn-secondary">
                <Upload className="h-4 w-4" /> Importar CSV
              </Link>
              <Link href="/clientes/nuevo" className="btn-primary">
                <UserPlus className="h-4 w-4" /> Cargar primer cliente
              </Link>
            </div>
          }
        />
      ) : (
        <CustomersList customers={rows} />
      )}
    </div>
  );
}
