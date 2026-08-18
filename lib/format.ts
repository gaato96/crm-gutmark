export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
  }).format(d);
}

export function daysSince(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

// Color estable a partir del nombre (para avatares). Basado en opacidad para funcionar
// igual de bien en tema claro y oscuro.
export function avatarColor(name: string): string {
  // Sin `violet`: ahora chocaría con el acento de marca (accent-*), que ya está
  // en la lista. Se reemplaza por fucsia, que se distingue de los dos.
  const palette = [
    "bg-brand-500/15 text-brand-700 dark:text-brand-300",
    "bg-accent-500/15 text-accent-700 dark:text-accent-300",
    "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300",
    "bg-rose-500/15 text-rose-700 dark:text-rose-300",
    "bg-teal-500/15 text-teal-700 dark:text-teal-300",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}
