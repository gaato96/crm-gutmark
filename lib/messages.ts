// Variables que se pueden usar en el cuerpo de una campaña. El editor las
// lista para que el negocio no tenga que adivinarlas ni escribirlas de memoria.
export const TEMPLATE_VARS: { key: string; label: string }[] = [
  { key: "nombre", label: "Nombre de pila" },
  { key: "apellido", label: "Apellido" },
  { key: "negocio", label: "Nombre del negocio" },
  { key: "ultima_compra", label: "Fecha de la última compra" },
  { key: "dias_sin_comprar", label: "Días desde la última compra" },
  { key: "total_gastado", label: "Total gastado" },
  { key: "puntos", label: "Puntos disponibles" },
  { key: "cumple", label: "Fecha de cumpleaños" },
  { key: "servicio", label: "Lo que compró (disparador por servicio)" },
];

// `nombre` y `negocio` son las únicas obligatorias: el resto puede no aplicar
// (un cliente sin compras no tiene última compra) y en ese caso la variable se
// resuelve al texto que pase el llamador, no a "undefined".
export interface TemplateVars {
  nombre: string;
  negocio: string;
  apellido?: string;
  ultima_compra?: string;
  dias_sin_comprar?: string;
  total_gastado?: string;
  puntos?: string;
  cumple?: string;
  // Nombre del servicio/producto que disparó la campaña. Solo tiene valor con
  // el disparador por servicio — y sobre todo con "cualquier servicio", donde
  // cada cliente puede deberle la recompra de uno distinto.
  servicio?: string;
}

// Reemplaza {variables} en el cuerpo de una campaña.
//
// Antes eran cuatro `replaceAll` literales, uno por variable y capitalización.
// Con el diccionario alcanza con agregar una clave, y —lo importante— una
// variable mal escrita queda VISIBLE en el mensaje ({nombree}) en vez de
// desaparecer: el negocio ve el error antes de mandárselo a un cliente.
export function renderTemplate(body: string, vars: TemplateVars): string {
  const full = vars.nombre.trim().split(/\s+/).filter(Boolean);
  const dict: Record<string, string> = {
    nombre: full[0] ?? vars.nombre,
    apellido: vars.apellido ?? full.slice(1).join(" "),
    negocio: vars.negocio,
    ultima_compra: vars.ultima_compra ?? "",
    dias_sin_comprar: vars.dias_sin_comprar ?? "",
    total_gastado: vars.total_gastado ?? "",
    puntos: vars.puntos ?? "",
    cumple: vars.cumple ?? "",
    servicio: vars.servicio ?? "",
  };

  return body.replace(/\{([A-Za-zÁÉÍÓÚÑáéíóúñ_][\wÁÉÍÓÚÑáéíóúñ]*)\}/g, (match, raw: string) => {
    const value = dict[raw.toLowerCase()];
    return value === undefined ? match : value;
  });
}

// Limpia un teléfono para wa.me (solo dígitos)
export function cleanPhone(phone: string | null | undefined): string {
  return (phone ?? "").replace(/\D/g, "");
}

export function whatsappLink(phone: string | null | undefined, message: string): string {
  const p = cleanPhone(phone);
  return `https://wa.me/${p}?text=${encodeURIComponent(message)}`;
}

export function mailtoLink(
  email: string | null | undefined,
  subject: string,
  body: string
): string {
  return `mailto:${email ?? ""}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}

// Número de WhatsApp del negocio (Vuelvo CRM) para pedidos de acceso desde la landing.
// +54 381 5976357 en formato wa.me: los celulares argentinos llevan un "9" después
// del código de país (54) para que el link abra el chat correcto.
export const WHATSAPP_BUSINESS_NUMBER = "5493815976357";

export function businessWhatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encodeURIComponent(message)}`;
}
