// Sin "server-only" a propósito: lo usa también scripts/demo-accounts.ts, que
// corre con tsx fuera de Next, donde ese import tira error.
import { db } from "./db";
import { CAMPAIGN_SEED } from "./campaigns";
import { presetFor } from "./rubro-presets";
import { defaultItemKind, modeForRubro } from "./rubros";
import { MODULE_SEED } from "./modules";

// Deja un negocio recién creado listo para usar según su rubro: ajustes de
// recompra/inactividad/VIP, catálogo con la recompra de cada ítem, las dos
// campañas de fábrica (con texto del rubro) más las propias del rubro, y —si
// se pide— los módulos recomendados.
//
// Reemplaza a createDefaultCampaigns: antes todo negocio arrancaba con dos
// campañas genéricas y el catálogo vacío, y en una demo había que explicar
// "imaginate que acá cargás tus servicios…".
export async function applyRubroPreset(
  businessId: string,
  rubro: string,
  opts: { modules: boolean }
): Promise<void> {
  const preset = presetFor(rubro);
  const mode = modeForRubro(rubro);

  await db.business.update({
    where: { id: businessId },
    data: {
      recompraDays: preset.config.recompraDays,
      inactivityDays: preset.config.inactivityDays,
      vipMinSpend: preset.config.vipMinSpend,
      ...(preset.config.pointsPerAmount ? { pointsPerAmount: preset.config.pointsPerAmount } : {}),
    },
  });

  // Catálogo. En los negocios que no son "ambos", el tipo lo fija el modo (un
  // kiosco no puede terminar con "servicios" cargados).
  const serviceIds = new Map<string, string>();
  for (const [i, s] of preset.services.entries()) {
    const created = await db.service.create({
      data: {
        businessId,
        name: s.name,
        price: s.price,
        category: s.category,
        kind: mode === "ambos" ? s.kind : defaultItemKind(mode),
        recompraDays: s.recompraDays,
        sortOrder: i,
      },
      select: { id: true },
    });
    serviceIds.set(s.name, created.id);
  }

  // Las de fábrica, con el texto del rubro si lo tiene.
  await db.campaign.createMany({
    data: CAMPAIGN_SEED.map((c) => {
      const override = c.builtin === "birthday" ? preset.birthday : c.builtin === "winback" ? preset.winback : undefined;
      return { businessId, ...c, ...(override ?? {}) };
    }),
  });

  const extras = preset.campaigns
    .map((c, i) => {
      // Una campaña atada a un ítem que no se creó (catálogo vacío) no
      // alcanzaría a nadie: mejor no crearla que dejar una campaña muerta.
      const serviceId = c.serviceName ? serviceIds.get(c.serviceName) ?? null : null;
      if (c.serviceName && !serviceId) return null;
      if (c.allServices && serviceIds.size === 0) return null;
      return {
        businessId,
        name: c.name,
        description: c.description,
        triggerType: c.triggerType,
        triggerValue: c.triggerValue,
        triggerUnit: c.triggerUnit ?? "dias",
        triggerMaxValue: c.triggerMaxValue ?? null,
        segment: c.segment ?? null,
        minSpend: c.minSpend ?? null,
        serviceId,
        allServices: c.allServices ?? false,
        excludeInactive: c.excludeInactive ?? false,
        whatsappBody: c.whatsappBody,
        emailSubject: c.emailSubject,
        emailBody: c.emailBody,
        sortOrder: 10 + i,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);
  if (extras.length > 0) await db.campaign.createMany({ data: extras });

  if (opts.modules) {
    for (const code of preset.modules) {
      // BusinessModule tiene FK al catálogo: si nadie corrió "Sincronizar
      // catálogo" todavía, el módulo se crea acá con los valores de fábrica.
      const seed = MODULE_SEED.find((m) => m.code === code);
      if (seed) {
        await db.module.upsert({
          where: { code },
          create: {
            code,
            name: seed.name,
            description: seed.description,
            monthlyPrice: seed.monthlyPrice,
            sortOrder: seed.sortOrder,
          },
          update: {},
        });
      }
      await db.businessModule.upsert({
        where: { businessId_moduleCode: { businessId, moduleCode: code } },
        create: { businessId, moduleCode: code, enabled: true },
        update: { enabled: true },
      });
    }
  }
}
