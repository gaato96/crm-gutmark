// Fechas en la hora del negocio.
//
// Archivo PURO (lo importan pantallas client y server). El servidor en Vercel
// corre en UTC: un `getHours()` o `getDay()` ahí devuelve la hora de Londres,
// no la de Tucumán. Una venta de las 20:00 caía en "23:00", y una de las 22:00
// del sábado aparecía el domingo. Todo lo que agrupa por hora o por día del
// calendario tiene que pasar por acá.

export const DEFAULT_TZ = "America/Argentina/Buenos_Aires";

export interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
  // 0 = domingo, igual que Date.getDay()
  weekday: number;
}

const WEEKDAYS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const formatters = new Map<string, Intl.DateTimeFormat>();
function formatter(tz: string): Intl.DateTimeFormat {
  let f = formatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      hourCycle: "h23",
    });
    formatters.set(tz, f);
  }
  return f;
}

export function zonedParts(date: Date, tz: string = DEFAULT_TZ): ZonedParts {
  const parts: Record<string, string> = {};
  for (const p of formatter(tz).formatToParts(date)) parts[p.type] = p.value;
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    // Algunos motores devuelven "24" para la medianoche aun con h23.
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    weekday: WEEKDAYS[parts.weekday] ?? 0,
  };
}

// "2026-10-03": clave de día calendario en la hora del negocio. Sirve para
// agrupar ventas por día sin que las de la noche se pasen al día siguiente.
export function zonedDayKey(date: Date, tz: string = DEFAULT_TZ): string {
  const p = zonedParts(date, tz);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

// Diferencia en minutos entre la hora del negocio y UTC en ese instante
// (Argentina: -180). Se calcula y no se fija a mano para no romperse si algún
// día vuelve el horario de verano.
export function zoneOffsetMinutes(date: Date, tz: string = DEFAULT_TZ): number {
  const p = zonedParts(date, tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return Math.round((asUtc - Math.floor(date.getTime() / 60000) * 60000) / 60000);
}

// El instante en que empieza (00:00, hora del negocio) el día calendario dado.
export function zonedMidnight(
  year: number,
  month: number,
  day: number,
  tz: string = DEFAULT_TZ
): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, 12));
  const offset = zoneOffsetMinutes(guess, tz);
  return new Date(Date.UTC(year, month - 1, day) - offset * 60000);
}

export function startOfZonedDay(date: Date, tz: string = DEFAULT_TZ): Date {
  const p = zonedParts(date, tz);
  return zonedMidnight(p.year, p.month, p.day, tz);
}
