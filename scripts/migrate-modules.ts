// Fusiona el módulo "reportes" dentro de "caja" ("Caja y Reportes").
//
//   npm run db:migrate-modules
//
// Se vendían por separado y ahora son uno solo. Este script:
//   1. A todo negocio que tenía "reportes" activo le deja "caja" activo — pagó
//      por esa funcionalidad y no puede perderla en el camino.
//   2. Borra las filas BusinessModule de "reportes" y después el Module.
//
// Idempotente: si "reportes" ya no existe, no hace nada.

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const viejo = await db.module.findUnique({ where: { code: "reportes" } });
  if (!viejo) {
    console.log("✓ No existe el módulo 'reportes': nada que migrar.");
    return;
  }

  const conReportes = await db.businessModule.findMany({
    where: { moduleCode: "reportes" },
    select: { businessId: true, enabled: true, priceOverride: true },
  });

  let promovidos = 0;
  for (const bm of conReportes) {
    if (!bm.enabled) continue;
    // upsert: si ya tenía "caja", se respeta lo que estaba (incluido su
    // precio propio); si no, se le habilita sin override.
    const yaTiene = await db.businessModule.findUnique({
      where: { businessId_moduleCode: { businessId: bm.businessId, moduleCode: "caja" } },
    });
    if (yaTiene) {
      if (!yaTiene.enabled) {
        await db.businessModule.update({ where: { id: yaTiene.id }, data: { enabled: true } });
        promovidos++;
      }
    } else {
      await db.businessModule.create({
        data: { businessId: bm.businessId, moduleCode: "caja", enabled: true },
      });
      promovidos++;
    }
  }

  const borradas = await db.businessModule.deleteMany({ where: { moduleCode: "reportes" } });
  await db.module.delete({ where: { code: "reportes" } });

  console.log(`✓ ${conReportes.length} negocio(s) tenían 'reportes'.`);
  console.log(`  ${promovidos} pasaron a tener 'caja' activo.`);
  console.log(`  ${borradas.count} fila(s) BusinessModule borradas + el Module 'reportes'.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
