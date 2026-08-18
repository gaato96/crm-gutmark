import { db } from "./db";
import { CAMPAIGN_SEED } from "./campaigns";

// Las dos campañas de fábrica de un negocio nuevo. Reemplaza a
// createDefaultTemplates: antes eran 4 filas Template (un tipo × dos canales),
// ahora son 2 Campaign que llevan el disparador y los dos canales juntos.
export async function createDefaultCampaigns(businessId: string) {
  await db.campaign.createMany({
    data: CAMPAIGN_SEED.map((c) => ({ businessId, ...c })),
  });
}
