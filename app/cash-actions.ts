"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireModule } from "@/lib/module-guard";
import { getSessionUser } from "@/lib/auth";
import { catalogWords } from "@/lib/rubros";
import { cashExpected, cashDifference, isMovementKind, signedAmount } from "@/lib/cash";
import { currentCashSession } from "@/lib/cash-write";
import { isPaymentMethod, round2 } from "@/lib/sales";

export interface CashFormState {
  error?: string;
  ok?: boolean;
}

function clean(v: FormDataEntryValue | null): string {
  return (v ?? "").toString().trim();
}

function amountOf(v: FormDataEntryValue | null): number {
  const n = parseFloat(clean(v) || "0");
  return Number.isFinite(n) ? n : NaN;
}

function revalidate() {
  revalidatePath("/caja");
  revalidatePath("/reportes");
  revalidatePath("/dashboard");
}

// --- Caja -------------------------------------------------------------------

export async function openCashSession(
  _prev: CashFormState,
  formData: FormData
): Promise<CashFormState> {
  const session = await requireModule("caja");
  const businessId = session.business.id;

  const abierta = await currentCashSession(businessId);
  if (abierta) return { error: "Ya hay una caja abierta. Cerrala antes de abrir otra." };

  const openingAmount = amountOf(formData.get("openingAmount"));
  if (!Number.isFinite(openingAmount) || openingAmount < 0) {
    return { error: "El fondo inicial tiene que ser 0 o más." };
  }

  await db.cashSession.create({
    data: {
      businessId,
      openingAmount: round2(openingAmount),
      openedByUserId: session.id,
      notes: clean(formData.get("notes")) || null,
    },
  });

  revalidate();
  return { ok: true };
}

export async function closeCashSession(
  _prev: CashFormState,
  formData: FormData
): Promise<CashFormState> {
  const session = await requireModule("caja");
  const businessId = session.business.id;

  const abierta = await currentCashSession(businessId);
  if (!abierta) return { error: "No hay ninguna caja abierta." };

  const countedAmount = amountOf(formData.get("countedAmount"));
  if (!Number.isFinite(countedAmount) || countedAmount < 0) {
    return { error: "Ingresá cuánta plata contaste (0 o más)." };
  }

  const movements = await db.cashMovement.findMany({
    where: { sessionId: abierta.id },
    select: { kind: true, amount: true, paymentMethod: true },
  });

  // El esperado se congela en la fila al cerrar. Si mañana se edita una venta
  // vieja, el arqueo de hoy tiene que seguir diciendo lo que decía hoy.
  const totals = cashExpected({ openingAmount: abierta.openingAmount, movements });
  const counted = round2(countedAmount);

  await db.cashSession.update({
    where: { id: abierta.id },
    data: {
      closedAt: new Date(),
      countedAmount: counted,
      expectedAmount: totals.esperado,
      difference: cashDifference(counted, totals.esperado),
      notes: clean(formData.get("notes")) || abierta.notes,
    },
  });

  revalidate();
  return { ok: true };
}

export async function addCashMovement(
  _prev: CashFormState,
  formData: FormData
): Promise<CashFormState> {
  const session = await requireModule("caja");
  const businessId = session.business.id;

  const abierta = await currentCashSession(businessId);
  if (!abierta) return { error: "Abrí la caja antes de cargar movimientos." };

  const kind = clean(formData.get("kind"));
  if (!isMovementKind(kind) || kind === "venta") {
    // "venta" no se carga a mano: la genera el registro de una venta, si no
    // habría dos movimientos por la misma plata.
    return { error: "Elegí un tipo de movimiento válido." };
  }

  const raw = amountOf(formData.get("amount"));
  if (!Number.isFinite(raw) || raw <= 0) {
    return { error: "El importe tiene que ser mayor a 0." };
  }

  const paymentMethod = clean(formData.get("paymentMethod")) || "efectivo";
  if (!isPaymentMethod(paymentMethod)) return { error: "Método de pago inválido." };

  const description = clean(formData.get("description"));
  if (!description) return { error: "Escribí de qué se trata el movimiento." };

  await db.cashMovement.create({
    data: {
      businessId,
      sessionId: abierta.id,
      kind,
      // El signo lo pone el tipo, no el formulario.
      amount: signedAmount(kind, raw),
      paymentMethod,
      description,
    },
  });

  revalidate();
  return { ok: true };
}

// --- Empleados --------------------------------------------------------------

export async function saveEmployee(
  id: string | null,
  _prev: CashFormState,
  formData: FormData
): Promise<CashFormState> {
  const session = await requireModule("caja");
  const businessId = session.business.id;

  const name = clean(formData.get("name"));
  if (!name) return { error: "Poné el nombre del empleado." };
  if (name.length > 60) return { error: "El nombre no puede pasar de 60 caracteres." };

  const kind = clean(formData.get("commissionKind")) || "percent";
  if (kind !== "percent" && kind !== "fixed") {
    return { error: "Elegí si la comisión es un porcentaje o un monto fijo." };
  }

  const value = amountOf(formData.get("commissionValue"));
  if (!Number.isFinite(value) || value < 0) {
    return { error: "La comisión no puede ser negativa." };
  }
  if (kind === "percent" && value > 100) {
    return { error: "Un porcentaje no puede superar 100." };
  }

  if (id) {
    const owned = await db.employee.findFirst({
      where: { id, businessId },
      select: { id: true },
    });
    if (!owned) return { error: "Empleado no encontrado." };
    await db.employee.update({
      where: { id: owned.id },
      data: { name, commissionValue: value, commissionKind: kind },
    });
  } else {
    const count = await db.employee.count({ where: { businessId } });
    if (count >= 50) return { error: "Llegaste al máximo de 50 empleados." };
    await db.employee.create({
      data: {
        businessId,
        name,
        commissionValue: value,
        commissionKind: kind,
        sortOrder: count,
      },
    });
  }

  revalidate();
  return { ok: true };
}

// Salda TODO lo pendiente de un empleado de una vez: marca cada SaleCost de
// comisión sin pagar como pagada y, si hay una caja abierta, carga el egreso
// correspondiente sola — así el dueño no tiene que cargarlo a mano aparte y
// después acordarse de descontarlo de la deuda. Sin caja abierta igual se
// marca como pagado (puede haber pagado por transferencia), pero no queda
// movimiento de caja: no hay sesión donde colgarlo.
export async function payEmployeeCommission(
  employeeId: string,
  _prev: CashFormState,
  formData: FormData
): Promise<CashFormState> {
  const session = await requireModule("caja");
  const businessId = session.business.id;

  const employee = await db.employee.findFirst({
    where: { id: employeeId, businessId },
    select: { id: true, name: true },
  });
  if (!employee) return { error: "Empleado no encontrado." };

  const pending = await db.saleCost.findMany({
    where: { businessId, employeeId: employee.id, kind: "comision", paidAt: null },
    select: { id: true, amount: true },
  });
  if (pending.length === 0) return { error: "No tiene comisiones pendientes de pago." };

  const paymentMethod = clean(formData.get("paymentMethod")) || "efectivo";
  if (!isPaymentMethod(paymentMethod)) return { error: "Método de pago inválido." };

  const total = round2(pending.reduce((s, c) => s + c.amount, 0));
  const now = new Date();
  const abierta = await currentCashSession(businessId);

  await db.$transaction([
    db.saleCost.updateMany({
      where: { id: { in: pending.map((p) => p.id) } },
      data: { paidAt: now },
    }),
    ...(abierta
      ? [
          db.cashMovement.create({
            data: {
              businessId,
              sessionId: abierta.id,
              kind: "egreso",
              amount: signedAmount("egreso", total),
              paymentMethod,
              description: `Pago comisión ${employee.name}`,
            },
          }),
        ]
      : []),
  ]);

  revalidate();
  return { ok: true };
}

export async function toggleEmployee(id: string, active: boolean) {
  const session = await requireModule("caja");
  const owned = await db.employee.findFirst({
    where: { id, businessId: session.business.id },
    select: { id: true },
  });
  if (!owned) throw new Error("Empleado no encontrado");
  await db.employee.update({ where: { id: owned.id }, data: { active } });
  revalidate();
}

// Los empleados con ventas no se borran: se desactivan. Borrarlos dejaría los
// costos de comisión sin dueño y el reporte de "cuánto le pagué a cada uno"
// perdería la historia.
export async function deleteEmployee(
  id: string
): Promise<{ deleted: boolean; deactivated: boolean }> {
  const session = await requireModule("caja");
  const owned = await db.employee.findFirst({
    where: { id, businessId: session.business.id },
    select: { id: true },
  });
  if (!owned) throw new Error("Empleado no encontrado");

  const usado = await db.saleCost.count({ where: { employeeId: owned.id } });
  if (usado > 0) {
    await db.employee.update({ where: { id: owned.id }, data: { active: false } });
    revalidate();
    return { deleted: false, deactivated: true };
  }

  await db.employee.delete({ where: { id: owned.id } });
  revalidate();
  return { deleted: true, deactivated: false };
}

// --- Reglas de costo --------------------------------------------------------

export async function saveCostRule(
  id: string | null,
  _prev: CashFormState,
  formData: FormData
): Promise<CashFormState> {
  const session = await requireModule("caja");
  const businessId = session.business.id;

  const name = clean(formData.get("name"));
  if (!name) return { error: "Poné un nombre para el costo." };

  const kind = clean(formData.get("kind"));
  if (kind !== "percent" && kind !== "fixed") return { error: "Elegí porcentaje o importe fijo." };

  const value = amountOf(formData.get("value"));
  if (!Number.isFinite(value) || value <= 0) return { error: "El valor tiene que ser mayor a 0." };
  if (kind === "percent" && value > 100) return { error: "Un porcentaje no puede superar 100." };

  const pm = clean(formData.get("paymentMethod"));
  // Vacío = aplica a todas las ventas, sin importar el medio de pago.
  const paymentMethod = pm ? (isPaymentMethod(pm) ? pm : null) : null;
  if (pm && !paymentMethod) return { error: "Método de pago inválido." };

  const data = { name, kind, value, paymentMethod };

  if (id) {
    const owned = await db.costRule.findFirst({
      where: { id, businessId },
      select: { id: true },
    });
    if (!owned) return { error: "Costo no encontrado." };
    await db.costRule.update({ where: { id: owned.id }, data });
  } else {
    const count = await db.costRule.count({ where: { businessId } });
    if (count >= 30) return { error: "Llegaste al máximo de 30 costos." };
    await db.costRule.create({ data: { businessId, sortOrder: count, ...data } });
  }

  revalidate();
  return { ok: true };
}

export async function toggleCostRule(id: string, active: boolean) {
  const session = await requireModule("caja");
  const owned = await db.costRule.findFirst({
    where: { id, businessId: session.business.id },
    select: { id: true },
  });
  if (!owned) throw new Error("Costo no encontrado");
  await db.costRule.update({ where: { id: owned.id }, data: { active } });
  revalidate();
}

export async function deleteCostRule(id: string) {
  const session = await requireModule("caja");
  // deleteMany con businessId: si el id no es de este negocio no borra nada.
  await db.costRule.deleteMany({ where: { id, businessId: session.business.id } });
  revalidate();
}

export interface SellingEmployee {
  id: string;
  name: string;
}

export interface SaleContext {
  employees: SellingEmployee[];
  // Como nombrar a quien hizo la venta, segun el rubro del negocio.
  sellerLabel: string;
}

// Empleados para el selector de "quién atendió". Devuelve vacío si el módulo
// no está activo, en vez de redirigir: lo llama el modal de venta rápida, que
// existe para todos los negocios tengan o no el módulo.
export async function listEmployeesForSale(): Promise<SaleContext> {
  const session = await getSessionUser();
  const fallback: SaleContext = { employees: [], sellerLabel: "¿Quién atendió?" };
  if (!session) return fallback;

  const sellerLabel = catalogWords(session.business.catalogMode).sellerLabel;
  if (!session.business.modules.includes("caja")) return { employees: [], sellerLabel };

  const employees = await db.employee.findMany({
    where: { businessId: session.business.id, active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
  return { employees, sellerLabel };
}
