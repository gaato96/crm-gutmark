import { renderTemplate, TemplateVars } from "./messages";
import { formatMoney, formatDate } from "./format";

// Lo que hace falta de una campaña para armar el mensaje. `Campaign` de Prisma
// lo cumple estructuralmente.
export interface CampaignLike {
  whatsappBody: string;
  emailSubject: string;
  emailBody: string;
}

// Lo que hace falta de un cliente. `EnrichedCustomer` lo cumple; la ficha de
// cliente arma el objeto a mano con los mismos campos.
export interface MessageCustomer {
  name: string;
  lastPurchaseAt: Date | null;
  daysSinceLast: number | null;
  totalSpent: number;
  birthdate: Date | null;
}

export interface BuiltMessage {
  whatsappBody: string;
  emailSubject: string;
  emailBody: string;
}

export function customerVars(
  c: MessageCustomer,
  businessName: string,
  points?: number,
  serviceName?: string
): TemplateVars {
  return {
    nombre: c.name,
    negocio: businessName,
    ultima_compra: c.lastPurchaseAt ? formatDate(c.lastPurchaseAt) : "todavía sin compras",
    dias_sin_comprar: c.daysSinceLast !== null ? String(c.daysSinceLast) : "—",
    total_gastado: formatMoney(c.totalSpent),
    // Sin el módulo Puntos activo no llega el dato: la variable queda en 0 en
    // vez de vacía, para que el mensaje no se lea cortado si alguien la usó.
    puntos: String(points ?? 0),
    cumple: c.birthdate ? formatDate(c.birthdate) : "—",
    servicio: serviceName ?? "",
  };
}

// Arma los tres textos de una campaña para un cliente concreto. Si la campaña
// tiene un canal vacío (el negocio borró el cuerpo), cae a un mensaje genérico
// en vez de abrir WhatsApp con el texto en blanco.
export function buildCampaignMessage(
  campaign: CampaignLike,
  c: MessageCustomer,
  businessName: string,
  points?: number,
  serviceName?: string
): BuiltMessage {
  const vars = customerVars(c, businessName, points, serviceName);
  const first = vars.nombre.trim().split(/\s+/)[0] ?? vars.nombre;
  const generic = `¡Hola ${first}! Gracias por elegir ${businessName}. Ante cualquier cosa, escribinos. 💚`;

  const wa = campaign.whatsappBody.trim();
  const subject = campaign.emailSubject.trim();
  const emailBody = campaign.emailBody.trim();

  return {
    whatsappBody: wa ? renderTemplate(wa, vars) : generic,
    emailSubject: subject ? renderTemplate(subject, vars) : `Un mensaje de ${businessName}`,
    emailBody: emailBody ? renderTemplate(emailBody, vars) : generic,
  };
}
