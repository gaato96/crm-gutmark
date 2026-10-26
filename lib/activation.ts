import "server-only";
import { db } from "./db";
import { catalogWords } from "./rubros";

// Checklist de activación de Inicio: las cuatro cosas que tiene que hacer un
// negocio nuevo para que el sistema le sirva. El recorrido guiado muestra
// DÓNDE está cada cosa; esto dice QUÉ hacer primero, y desaparece solo cuando
// está todo hecho.
//
// Se calcula al leer (como los segmentos): no hay que acordarse de marcar nada,
// y si el negocio importa 50 clientes desde otro lado, el paso aparece hecho.

export const ACTIVATION_MIN_CUSTOMERS = 20;

export interface ActivationStep {
  code: string;
  title: string;
  detail: string;
  href: string;
  done: boolean;
}

export async function activationSteps(biz: {
  id: string;
  catalogMode: string;
}): Promise<ActivationStep[]> {
  const [services, customers, purchases, contacts] = await Promise.all([
    db.service.count({ where: { businessId: biz.id, active: true } }),
    db.customer.count({ where: { businessId: biz.id } }),
    db.purchase.count({ where: { businessId: biz.id } }),
    db.contactLog.count({ where: { businessId: biz.id } }),
  ]);
  const words = catalogWords(biz.catalogMode);

  return [
    {
      code: "catalogo",
      title: `Revisá tus ${words.plural}`,
      detail: "Con sus precios y cada cuánto vuelve el cliente por cada uno.",
      href: "/catalogo",
      done: services > 0,
    },
    {
      code: "clientes",
      title: `Cargá ${ACTIVATION_MIN_CUSTOMERS} clientes`,
      detail:
        customers > 0
          ? `Llevás ${customers}. Podés importarlos de un Excel de una sola vez.`
          : "Importalos de un Excel o cargalos a mano con su WhatsApp y cumpleaños.",
      href: "/clientes/importar",
      done: customers >= ACTIVATION_MIN_CUSTOMERS,
    },
    {
      code: "venta",
      title: "Registrá tu primera venta",
      detail: "Con el botón Nueva venta (o la tecla N). Así el sistema sabe quién vuelve.",
      href: "/clientes",
      done: purchases > 0,
    },
    {
      code: "mensaje",
      title: "Mandá tu primer mensaje",
      detail: "Desde Campañas: tocás WhatsApp y se abre el chat con el texto listo.",
      href: "/campanas",
      done: contacts > 0,
    },
  ];
}
