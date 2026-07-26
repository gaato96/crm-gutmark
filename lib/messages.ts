// Reemplaza variables {nombre} y {negocio} en una plantilla
export function renderTemplate(
  body: string,
  vars: { nombre: string; negocio: string }
): string {
  const first = vars.nombre.trim().split(/\s+/)[0] ?? vars.nombre;
  return body
    .replaceAll("{nombre}", first)
    .replaceAll("{negocio}", vars.negocio)
    .replaceAll("{Nombre}", first)
    .replaceAll("{Negocio}", vars.negocio);
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

// Número de WhatsApp del negocio (GUTMARK) para pedidos de acceso desde la landing.
// +54 381 5976357 en formato wa.me: los celulares argentinos llevan un "9" después
// del código de país (54) para que el link abra el chat correcto.
export const WHATSAPP_BUSINESS_NUMBER = "5493815976357";

export function businessWhatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encodeURIComponent(message)}`;
}
