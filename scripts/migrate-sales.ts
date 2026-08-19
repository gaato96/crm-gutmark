// Rellena `subtotal` en las ventas anteriores a los ítems.
//
//   npm run db:migrate-sales
//
// Antes una venta era solo un monto. Al agregar ítems y descuento, `subtotal`
// (lo que costaba antes del descuento) nació en 0 para todas las filas viejas,
// y eso haría que los reportes muestren descuentos gigantes inventados. Como
// esas ventas nunca tuvieron descuento, subtotal = amount.
//
// Es idempotente: solo toca las filas que siguen en 0 con amount > 0.

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const pendientes = await db.purchase.count({
    where: { subtotal: 0, amount: { gt: 0 } },
  });

  if (pendientes === 0) {
    console.log("✓ No hay ventas por migrar: todas ya tienen subtotal.");
    return;
  }

  // updateMany no permite copiar una columna en otra, así que va por SQL.
  const updated = await db.$executeRaw`
    UPDATE "Purchase" SET "subtotal" = "amount"
    WHERE "subtotal" = 0 AND "amount" > 0
  `;

  console.log(`✓ ${updated} venta(s) migrada(s) — subtotal = amount.`);

  const quedan = await db.purchase.count({ where: { subtotal: 0, amount: { gt: 0 } } });
  console.log(`  Pendientes tras migrar (debe ser 0): ${quedan}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
