import "server-only";
import { db } from "./db";
import { awardPointsForPurchase } from "./points";
import { applySaleSideEffects } from "./cash-write";
import {
  saleTotals,
  lineSubtotal,
  isPaymentMethod,
  DEFAULT_PAYMENT_METHOD,
  type SaleItemInput,
} from "./sales";

export interface RecordSaleInput {
  businessId: string;
  customerId: string;
  // Renglones elegidos del catálogo o escritos a mano.
  items: SaleItemInput[];
  // Venta sin renglones: el negocio solo tipeó un monto. Se guarda como un
  // ítem suelto para que los reportes no tengan que tratar dos formas de venta.
  freeAmount?: number | null;
  discount?: number;
  discountNote?: string | null;
  paymentMethod?: string;
  date?: Date;
  description?: string | null;
  // Quién atendió. Solo tiene efecto con el módulo Caja activo; de ahí sale la
  // comisión. Se valida contra el negocio antes de guardarse.
  employeeId?: string | null;
}

export interface RecordedSale {
  purchaseId: string;
  subtotal: number;
  discount: number;
  total: number;
}

// Punto único de escritura de una venta. Lo usan las tres vías de registro
// (ficha del cliente, venta rápida y alta de cliente con primera venta) para
// que no se dupliquen ni el cálculo de totales ni el alta de puntos.
//
// Asume que el llamador YA verificó que el cliente es de este negocio.
export async function recordSale(input: RecordSaleInput): Promise<RecordedSale> {
  const { businessId, customerId } = input;
  const date = input.date ?? new Date();
  const paymentMethod =
    input.paymentMethod && isPaymentMethod(input.paymentMethod)
      ? input.paymentMethod
      : DEFAULT_PAYMENT_METHOD;

  // Los servicios se releen del catálogo: el nombre y el precio de referencia
  // salen de la base, no del formulario. Si no, un cliente manipulado podría
  // escribir cualquier nombre y precio en los reportes del propio negocio.
  const serviceIds = input.items
    .map((i) => i.serviceId)
    .filter((id): id is string => Boolean(id));

  const services = serviceIds.length
    ? await db.service.findMany({
        where: { id: { in: serviceIds }, businessId },
        select: { id: true, name: true, price: true },
      })
    : [];
  const byId = new Map(services.map((s) => [s.id, s]));

  const items: SaleItemInput[] = [];
  for (const raw of input.items) {
    const quantity = Math.max(1, Math.floor(raw.quantity || 1));

    if (raw.serviceId) {
      const svc = byId.get(raw.serviceId);
      // Un servicio que no es de este negocio se ignora en silencio en vez de
      // hacer fallar toda la venta: el mostrador no es lugar para un error así.
      if (!svc) continue;
      // El precio del catálogo manda, salvo que se haya escrito uno distinto
      // a propósito (un precio pactado para ese cliente).
      const unitPrice =
        Number.isFinite(raw.unitPrice) && raw.unitPrice >= 0 ? raw.unitPrice : svc.price;
      items.push({ serviceId: svc.id, name: svc.name, unitPrice, quantity });
      continue;
    }

    const name = (raw.name ?? "").trim();
    if (!name || !Number.isFinite(raw.unitPrice) || raw.unitPrice < 0) continue;
    items.push({ serviceId: null, name, unitPrice: raw.unitPrice, quantity });
  }

  // Venta de monto suelto: sin renglones elegidos, pero con un importe.
  if (items.length === 0) {
    const amount = input.freeAmount ?? 0;
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("La venta tiene que tener al menos un ítem o un monto mayor a 0");
    }
    items.push({
      serviceId: null,
      name: (input.description ?? "").trim() || "Venta",
      unitPrice: amount,
      quantity: 1,
    });
  }

  const totals = saleTotals(items, input.discount ?? 0);

  // El empleado se valida acá y no se confía en el id del formulario: sin esto
  // una venta podría quedar atribuida al empleado de otro negocio, y con ella
  // su comisión.
  let employeeId: string | null = null;
  if (input.employeeId) {
    const emp = await db.employee.findFirst({
      where: { id: input.employeeId, businessId },
      select: { id: true },
    });
    employeeId = emp?.id ?? null;
  }

  const purchase = await db.purchase.create({
    data: {
      businessId,
      customerId,
      date,
      employeeId,
      amount: totals.total,
      subtotal: totals.subtotal,
      discount: totals.discount,
      discountNote: input.discountNote?.trim() || null,
      paymentMethod,
      description: input.description?.trim() || null,
      items: {
        create: items.map((i) => ({
          businessId,
          customerId,
          serviceId: i.serviceId,
          name: i.name,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
          subtotal: lineSubtotal(i),
          date,
        })),
      },
    },
    select: { id: true },
  });

  // Los puntos se calculan sobre lo que el cliente efectivamente pagó, no
  // sobre el subtotal: si le hicieron descuento, no gana puntos por lo que no
  // gastó.
  await awardPointsForPurchase({
    businessId,
    customerId,
    purchaseId: purchase.id,
    amount: totals.total,
  });

  // Comisiones, costos por regla y movimiento de caja. Se auto-gatea con el
  // módulo: si el negocio no lo tiene, no hace nada.
  const cashSessionId = await applySaleSideEffects({
    businessId,
    purchaseId: purchase.id,
    employeeId,
    total: totals.total,
    paymentMethod,
    date,
  });
  if (cashSessionId) {
    await db.purchase.update({ where: { id: purchase.id }, data: { cashSessionId } });
  }

  const customer = await db.customer.findUnique({
    where: { id: customerId },
    select: { lastPurchaseAt: true },
  });
  if (customer && (!customer.lastPurchaseAt || date > customer.lastPurchaseAt)) {
    await db.customer.update({ where: { id: customerId }, data: { lastPurchaseAt: date } });
  }

  return { purchaseId: purchase.id, ...totals };
}
