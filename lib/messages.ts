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
