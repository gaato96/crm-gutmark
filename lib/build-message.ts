import { renderTemplate } from "./messages";

interface TemplateLike {
  type: string;
  channel: string;
  subject: string;
  body: string;
}

export type MessageKind = "birthday" | "winback" | "generic";

export function buildMessage(
  kind: MessageKind,
  customerName: string,
  businessName: string,
  templates: TemplateLike[]
): { whatsappBody: string; emailSubject: string; emailBody: string } {
  const vars = { nombre: customerName, negocio: businessName };
  const first = customerName.split(" ")[0];

  const pick = (channel: string) =>
    templates.find((t) => t.type === kind && t.channel === channel);

  const genericWa = `¡Hola ${first}! Gracias por elegir ${businessName}. Ante cualquier cosa, escribinos. 💚`;

  const wa = pick("whatsapp");
  const em = pick("email");

  return {
    whatsappBody: wa ? renderTemplate(wa.body, vars) : genericWa,
    emailSubject: em ? renderTemplate(em.subject, vars) : `Un mensaje de ${businessName}`,
    emailBody: em ? renderTemplate(em.body, vars) : genericWa,
  };
}
