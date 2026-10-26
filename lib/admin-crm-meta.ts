// Catálogos y textos del CRM interno de /admin. Puro: lo importan las páginas
// server y los formularios client de /admin.

export const CRM_STAGES = [
  { code: "prueba", label: "En prueba", cls: "bg-sky-500/15 text-sky-700 ring-sky-500/25 dark:text-sky-300" },
  { code: "activo", label: "Activo", cls: "bg-brand-500/15 text-brand-700 ring-brand-500/25 dark:text-brand-300" },
  { code: "pausado", label: "Pausado", cls: "bg-amber-500/15 text-amber-700 ring-amber-500/25 dark:text-amber-300" },
  { code: "baja", label: "De baja", cls: "bg-surface-3 text-ink-muted ring-line" },
] as const;

export type CrmStage = (typeof CRM_STAGES)[number]["code"];

export function isCrmStage(v: string): v is CrmStage {
  return CRM_STAGES.some((s) => s.code === v);
}

export function crmStageMeta(code: string) {
  return CRM_STAGES.find((s) => s.code === code) ?? CRM_STAGES[1];
}

export type Health = "bien" | "atencion" | "riesgo";

export const HEALTH_META: Record<Health, { label: string; dot: string; cls: string }> = {
  bien: { label: "Bien", dot: "bg-brand-500", cls: "bg-brand-500/15 text-brand-700 ring-brand-500/25 dark:text-brand-300" },
  atencion: { label: "Atención", dot: "bg-amber-500", cls: "bg-amber-500/15 text-amber-700 ring-amber-500/25 dark:text-amber-300" },
  riesgo: { label: "En riesgo", dot: "bg-rose-500", cls: "bg-rose-500/15 text-rose-600 ring-rose-500/25" },
};

export const NOTE_KINDS = [
  { code: "nota", label: "Nota" },
  { code: "llamada", label: "Llamada" },
  { code: "whatsapp", label: "WhatsApp" },
  { code: "email", label: "Email" },
  { code: "reunion", label: "Reunión" },
  { code: "campana", label: "Campaña" },
] as const;

export function isNoteKind(v: string): boolean {
  return NOTE_KINDS.some((k) => k.code === v);
}

export function noteKindLabel(code: string): string {
  return NOTE_KINDS.find((k) => k.code === code)?.label ?? code;
}

// A quién le llega una campaña del equipo. Se evalúa al leer, igual que las
// campañas de los negocios.
export const ADMIN_AUDIENCES = [
  { code: "todos", label: "Todos los negocios activos", hint: "Todos menos los de baja." },
  { code: "riesgo", label: "En riesgo", hint: "Semáforo en rojo: dejaron de vender, de entrar o deben el mes." },
  { code: "atencion", label: "Necesitan atención", hint: "Semáforo en amarillo." },
  { code: "fundadores", label: "Fundadores", hint: "Marcados como negocio fundador." },
  { code: "prueba", label: "En prueba", hint: "Etapa “En prueba”." },
  { code: "sin-mensajes", label: "No mandan mensajes", hint: "Sin mensajes a sus clientes en 14 días." },
  { code: "creciendo", label: "Vienen creciendo", hint: "Vendieron más que el mes anterior: para felicitar y pedir testimonio." },
  { code: "sin-pagar", label: "Deben el mes", hint: "Pago pendiente o vencido." },
] as const;

export type AdminAudience = (typeof ADMIN_AUDIENCES)[number]["code"];

export function isAdminAudience(v: string): v is AdminAudience {
  return ADMIN_AUDIENCES.some((a) => a.code === v);
}

export function audienceLabel(code: string): string {
  return ADMIN_AUDIENCES.find((a) => a.code === code)?.label ?? code;
}

// Variables de los mensajes del equipo a los negocios. Igual que en
// renderTemplate (lib/messages.ts), una variable mal escrita queda VISIBLE en
// el texto en vez de desaparecer.
export const ADMIN_VARIABLES = [
  { key: "dueño", hint: "Nombre del dueño (o del negocio)" },
  { key: "negocio", hint: "Nombre del negocio" },
  { key: "ventas_semana", hint: "Facturación de los últimos 7 días" },
  { key: "ventas_mes", hint: "Facturación de los últimos 30 días" },
  { key: "crecimiento", hint: "Variación vs. los 30 días anteriores" },
  { key: "mensajes_semana", hint: "Mensajes que mandó a sus clientes en 7 días" },
  { key: "clientes", hint: "Clientes cargados" },
] as const;

export function renderAdminMessage(template: string, vars: Record<string, string>): string {
  return template.replace(/\{([a-zñ_]+)\}/gi, (m, key: string) => vars[key.toLowerCase()] ?? m);
}

// Campañas sugeridas para arrancar el CRM. "Seguimiento quincenal" es el
// contacto de cada 14 días que pide el Programa Fundadores.
export const SUGGESTED_ADMIN_CAMPAIGNS: {
  name: string;
  audience: AdminAudience;
  everyDays: number;
  message: string;
}[] = [
  {
    name: "Seguimiento quincenal",
    audience: "todos",
    everyDays: 14,
    message:
      "¡Hola {dueño}! ¿Cómo viene todo con Vuelvo en {negocio}? En los últimos 30 días cargaste {ventas_mes} en ventas ({crecimiento} vs. el mes anterior). ¿Hay algo que te esté costando o que te gustaría que haga el sistema?",
  },
  {
    name: "Rescate: negocios en riesgo",
    audience: "riesgo",
    everyDays: 7,
    message:
      "Hola {dueño}, ¿todo bien? Vimos que hace unos días no se cargan ventas en Vuelvo. ¿Te ayudamos con algo? Si querés, en 10 minutos por videollamada lo dejamos andando.",
  },
  {
    name: "Fundadores: cómo te fue",
    audience: "fundadores",
    everyDays: 14,
    message:
      "¡Hola {dueño}! Como fundador de Vuelvo tu opinión vale doble 🙌. Esta semana mandaste {mensajes_semana} mensajes a tus clientes. ¿Qué fue lo más útil y qué cambiarías?",
  },
  {
    name: "Felicitar y pedir testimonio",
    audience: "creciendo",
    everyDays: 30,
    message:
      "¡{dueño}, qué buen mes! {negocio} creció {crecimiento} en ventas. ¿Nos dejarías contarlo en dos líneas para mostrarle a otros negocios? Te lo agradecemos un montón.",
  },
];
