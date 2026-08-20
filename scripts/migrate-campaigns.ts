// Consolida las plantillas viejas (4 filas Template por negocio: cumpleaños y
// recompra × WhatsApp y email) en las 2 campañas de fábrica equivalentes.
//
//   npm run db:migrate-campaigns
//
// Es idempotente y NO borra nada: si un negocio ya tiene la campaña builtin,
// la saltea. Las filas Template quedan donde están hasta confirmar que todos
// los negocios migraron; recién ahí se borra el modelo del schema.

import { PrismaClient } from "@prisma/client";
import { CAMPAIGN_SEED } from "../lib/campaigns";

const db = new PrismaClient();

async function main() {
  const businesses = await db.business.findMany({
    select: {
      id: true,
      name: true,
      campaigns: { select: { builtin: true } },
      templates: { select: { type: true, channel: true, subject: true, body: true } },
    },
  });

  let created = 0;
  let skipped = 0;

  for (const biz of businesses) {
    const already = new Set(biz.campaigns.map((c) => c.builtin).filter(Boolean));

    for (const seed of CAMPAIGN_SEED) {
      if (already.has(seed.builtin)) {
        skipped++;
        continue;
      }

      // El texto que el negocio venía usando gana sobre el de fábrica: la
      // migración no puede pisarle los mensajes que escribió a mano.
      const wa = biz.templates.find((t) => t.type === seed.builtin && t.channel === "whatsapp");
      const em = biz.templates.find((t) => t.type === seed.builtin && t.channel === "email");

      await db.campaign.create({
        data: {
          businessId: biz.id,
          builtin: seed.builtin,
          name: seed.name,
          description: seed.description,
          triggerType: seed.triggerType,
          triggerValue: seed.triggerValue,
          triggerUnit: seed.triggerUnit,
          excludeInactive: seed.excludeInactive,
          sortOrder: seed.sortOrder,
          whatsappBody: wa?.body?.trim() || seed.whatsappBody,
          emailSubject: em?.subject?.trim() || seed.emailSubject,
          emailBody: em?.body?.trim() || seed.emailBody,
        },
      });
      created++;
    }

    console.log(
      `  ${biz.name}: ${biz.templates.length} plantilla(s) leída(s), ` +
        `${biz.campaigns.length} campaña(s) previa(s)`
    );
  }

  console.log(
    `\n✓ ${businesses.length} negocio(s) — ${created} campaña(s) creada(s), ` +
      `${skipped} ya existente(s).`
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
