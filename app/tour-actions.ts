"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { isTourId } from "@/lib/tours";

// Marca un recorrido como visto (terminado o salteado). Mientras un
// superadmin "entra como" un negocio no se guarda nada: el recorrido es del
// dueño, y si el admin lo mira o lo cierra el dueño se lo perdería.
export async function markTourDone(tourId: string): Promise<void> {
  if (!isTourId(tourId)) return;
  const session = await getSessionUser();
  if (!session || session.isImpersonating) return;
  if (session.toursDone.includes(tourId)) return;

  await db.user.update({
    where: { id: session.id },
    data: { toursDone: { push: tourId } },
  });
}
