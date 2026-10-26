// Tipos y textos del soporte desde el panel (botón "Reportar un problema o
// idea"). Puro: lo importan el modal (client) y /admin/soporte.

export const FEEDBACK_KINDS = [
  { code: "problema", label: "Algo no funciona", short: "Problema" },
  { code: "idea", label: "Tengo una idea", short: "Idea" },
  { code: "duda", label: "No entiendo algo", short: "Duda" },
] as const;

export type FeedbackKind = (typeof FEEDBACK_KINDS)[number]["code"];

export function isFeedbackKind(v: string): v is FeedbackKind {
  return FEEDBACK_KINDS.some((k) => k.code === v);
}

export function feedbackKindLabel(code: string): string {
  return FEEDBACK_KINDS.find((k) => k.code === code)?.short ?? code;
}

export const FEEDBACK_STATUS = [
  { code: "nuevo", label: "Nuevo", cls: "bg-accent-500/15 text-accent-700 ring-accent-500/25 dark:text-accent-300" },
  { code: "en-curso", label: "En curso", cls: "bg-amber-500/15 text-amber-700 ring-amber-500/25 dark:text-amber-300" },
  { code: "resuelto", label: "Resuelto", cls: "bg-brand-500/15 text-brand-700 ring-brand-500/25 dark:text-brand-300" },
] as const;

export type FeedbackStatus = (typeof FEEDBACK_STATUS)[number]["code"];

export function isFeedbackStatus(v: string): v is FeedbackStatus {
  return FEEDBACK_STATUS.some((s) => s.code === v);
}

export function feedbackStatusMeta(code: string) {
  return FEEDBACK_STATUS.find((s) => s.code === code) ?? FEEDBACK_STATUS[0];
}

// Tope de la captura ya comprimida (data URL). El navegador la achica antes de
// mandarla; esto es la red de seguridad del server.
export const MAX_SCREENSHOT_CHARS = 900_000;

export interface MyFeedbackRow {
  id: string;
  kind: string;
  message: string;
  status: string;
  reply: string | null;
  createdAt: string;
  repliedAt: string | null;
}
