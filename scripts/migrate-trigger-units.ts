// Pasa las campañas y las comisiones de "un número suelto" a "número + unidad".
//
//   npm run db:migrate-trigger-units
//
// Antes una campaña solo podía medirse en días (triggerDays) y una comisión
// solo podía ser un porcentaje (commissionPct). Ahora la campaña puede ir en
// días u horas, y la comisión puede ser un porcentaje o un monto fijo, así que
// el valor y su unidad se guardan por separado.
//
// Idempotente: solo copia lo que todavía está sin migrar.

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // --- Campañas: triggerDays -> triggerValue + unidad "dias" ---
  const campanas = await db.campaign.findMany({
    select: { id: true, name: true, triggerDays: true, triggerValue: true },
  });

  let campMigradas = 0;
  for (const c of campanas) {
    if (c.triggerValue !== null) continue; // ya migrada
    if (c.triggerDays === null) continue; // heredaba el default, sigue heredándolo
    await db.campaign.update({
      where: { id: c.id },
      data: { triggerValue: c.triggerDays, triggerUnit: "dias" },
    });
    console.log(`  campaña "${c.name}": ${c.triggerDays} → ${c.triggerDays} días`);
    campMigradas++;
  }

  // --- Empleados: commissionPct -> commissionValue + tipo "percent" ---
  const empleados = await db.employee.findMany({
    select: { id: true, name: true, commissionPct: true, commissionValue: true },
  });

  let empMigrados = 0;
  for (const e of empleados) {
    if (e.commissionValue !== 0) continue; // ya migrado
    if (e.commissionPct === 0) continue; // sin comisión, nada que copiar
    await db.employee.update({
      where: { id: e.id },
      data: { commissionValue: e.commissionPct, commissionKind: "percent" },
    });
    console.log(`  ${e.name}: ${e.commissionPct}% de comisión`);
    empMigrados++;
  }

  console.log(
    `\n✓ ${campanas.length} campaña(s) — ${campMigradas} migrada(s).\n` +
      `✓ ${empleados.length} empleado(s) — ${empMigrados} migrado(s).`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
