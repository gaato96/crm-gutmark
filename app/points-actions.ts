"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireModule } from "@/lib/module-guard";
import { redeemPoints } from "@/lib/points";

export interface PointsFormState {
  error?: string;
  ok?: boolean;
}

export async function updatePointsConfig(
  _prev: PointsFormState,
  formData: FormData
): Promise<PointsFormState> {
  const session = await requireModule("puntos");

  const pointsPerAmount = parseFloat((formData.get("pointsPerAmount") ?? "0").toString());
  if (!Number.isFinite(pointsPerAmount) || pointsPerAmount <= 0) {
    return { error: "El monto por punto debe ser mayor a 0." };
  }

  await db.business.update({
    where: { id: session.business.id },
    data: { pointsPerAmount },
  });

  revalidatePath("/puntos");
  return { ok: true };
}

export async function redeemPointsAction(
  _prev: PointsFormState,
  formData: FormData
): Promise<PointsFormState> {
  const session = await requireModule("puntos");

  const customerId = (formData.get("customerId") ?? "").toString().trim();
  const points = parseInt((formData.get("points") ?? "0").toString(), 10);
  const note = (formData.get("note") ?? "").toString().trim();

  if (!customerId) return { error: "Falta el cliente." };

  const customer = await db.customer.findFirst({
    where: { id: customerId, businessId: session.business.id },
    select: { id: true },
  });
  if (!customer) return { error: "Cliente no encontrado." };

  try {
    await redeemPoints({ businessId: session.business.id, customerId, points, note });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo registrar el canje." };
  }

  revalidatePath("/puntos");
  revalidatePath(`/clientes/${customerId}`);
  return { ok: true };
}
