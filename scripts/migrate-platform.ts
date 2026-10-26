// Ordena la plataforma para el Programa Fundadores (26/10/2026).
//
//   npm run db:migrate-platform
//
// 1. Plan base: si todavía está en 0 (nunca se cargó), lo pasa a $35.000.
// 2. Precios de módulos: pasa al precio nuevo los que siguen con el precio
//    viejo de catálogo (PREVIOUS_MODULE_PRICES). Si el superadmin ya había
//    puesto otro precio a mano, no lo toca.
// 3. Módulos no construidos: los marca como no disponibles, así ningún negocio
//    los puede pedir. Los construidos (incluido Stock, nuevo) quedan disponibles.
// 4. "Barberia demo": si existe como negocio real, lo marca como demo y exento,
//    para que no sume como cliente ni en el MRR.
//
// Idempotente: correrlo de nuevo no cambia nada.

import { PrismaClient } from "@prisma/client";
import {
  MODULE_SEED,
  PREVIOUS_MODULE_PRICES,
  BASE_PLAN_PRICE,
  isModuleImplemented,
} from "../lib/modules";

const db = new PrismaClient();

async function main() {
  // 1. Plan base
  const settings = await db.platformSetting.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", basePlanPrice: BASE_PLAN_PRICE },
    update: {},
  });
  if (settings.basePlanPrice === 0) {
    await db.platformSetting.update({
      where: { id: "singleton" },
      data: { basePlanPrice: BASE_PLAN_PRICE },
    });
    console.log(`✓ Plan base: $0 → $${BASE_PLAN_PRICE}`);
  } else {
    console.log(`· Plan base ya cargado ($${settings.basePlanPrice}): no se toca.`);
  }

  // 2 y 3. Catálogo de módulos
  for (const seed of MODULE_SEED) {
    const row = await db.module.findUnique({ where: { code: seed.code } });
    const available = isModuleImplemented(seed.code);
    if (!row) {
      await db.module.create({
        data: {
          code: seed.code,
          name: seed.name,
          description: seed.description,
          monthlyPrice: seed.monthlyPrice,
          sortOrder: seed.sortOrder,
          available,
        },
      });
      console.log(`✓ ${seed.name}: creado ($${seed.monthlyPrice}, ${available ? "disponible" : "no disponible"})`);
      continue;
    }
    const data: { monthlyPrice?: number; available?: boolean; description?: string } = {};
    if (row.monthlyPrice === PREVIOUS_MODULE_PRICES[seed.code] && row.monthlyPrice !== seed.monthlyPrice) {
      data.monthlyPrice = seed.monthlyPrice;
    }
    if (row.available !== available) data.available = available;
    // Stock tenía una descripción de "próximamente"; ahora que existe, la real.
    if (seed.code === "stock" && row.description !== seed.description) data.description = seed.description;
    if (Object.keys(data).length > 0) {
      await db.module.update({ where: { code: seed.code }, data });
      console.log(
        `✓ ${row.name}:` +
          (data.monthlyPrice !== undefined ? ` $${row.monthlyPrice} → $${data.monthlyPrice}` : "") +
          (data.available !== undefined ? ` · ${data.available ? "disponible" : "no disponible"}` : "") +
          (data.description !== undefined ? " · descripción actualizada" : "")
      );
    } else {
      console.log(`· ${row.name}: sin cambios`);
    }
  }

  // 4. Barbería demo cargada como negocio real
  const fakes = await db.business.findMany({
    where: { isDemo: false, name: { contains: "demo", mode: "insensitive" } },
    select: { id: true, name: true },
  });
  for (const b of fakes) {
    if (!/barber[ií]a\s+demo/i.test(b.name)) {
      console.log(`· "${b.name}" tiene "demo" en el nombre pero no es la barbería: revisalo a mano.`);
      continue;
    }
    await db.business.update({
      where: { id: b.id },
      data: { isDemo: true, billingExempt: true },
    });
    console.log(`✓ "${b.name}" marcado como demo y exento de facturación.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
