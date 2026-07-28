import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";
import { syncModuleCatalog } from "@/app/admin-actions";
import { PageHeader, EmptyState } from "@/components/ui";
import { AdminModuleCatalog } from "@/components/admin-module-catalog";
import { Blocks } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminModulosPage() {
  await requireSuperAdmin();

  const modules = await db.module.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { businesses: { where: { enabled: true } } } } },
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Módulos"
        subtitle="Catálogo de funciones opcionales y sus precios."
      />

      {modules.length === 0 ? (
        <EmptyState
          icon={<Blocks className="h-7 w-7" aria-hidden="true" />}
          title="Todavía no hay módulos en el catálogo"
          description="Sincronizá el catálogo para cargar los módulos predefinidos."
          action={
            <form action={syncModuleCatalog}>
              <button type="submit" className="btn-primary">
                Sincronizar catálogo
              </button>
            </form>
          }
        />
      ) : (
        <AdminModuleCatalog
          modules={modules.map((m) => ({
            code: m.code,
            name: m.name,
            description: m.description,
            monthlyPrice: m.monthlyPrice,
            available: m.available,
            sortOrder: m.sortOrder,
            businessCount: m._count.businesses,
          }))}
        />
      )}
    </div>
  );
}
