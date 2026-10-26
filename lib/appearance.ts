// Apariencia del panel por negocio (Configuración → Apariencia).
//
// Archivo PURO: lo importan el layout del panel (server) y el formulario de
// Configuración (client), que pinta las muestras.
//
// El negocio elige el color de ACENTO — el violeta de marca que pinta "Tu plan
// de hoy", los badges, el botón de acento y los resaltados —, no el verde de
// las acciones: ese verde es lo que dice "esto se toca" en toda la app y sus
// contrastes están calculados (ver "Identidad de marca" en CLAUDE.md).
//
// Regla para sumar un preset: el tono 600 tiene que dar al menos 4.5:1 con
// texto blanco, porque `.btn-accent` y las superficies de acento llevan letra
// blanca. Por eso rosa, naranja y turquesa están corridos un tono respecto de
// la escala de Tailwind (su 600 original no llega).

type Scale = Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950, string>;

export interface AccentPreset {
  code: string;
  label: string;
  scale: Scale;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  {
    code: "violeta",
    label: "Violeta Vuelvo",
    scale: { 50: "#F2EFFD", 100: "#E6DFFB", 200: "#CCBEF7", 300: "#B29CF3", 400: "#977AEE", 500: "#7B56EA", 600: "#5B2EE5", 700: "#3C1E97", 800: "#261360", 900: "#12092E", 950: "#090517" },
  },
  {
    code: "azul",
    label: "Azul",
    scale: { 50: "#EFF6FF", 100: "#DBEAFE", 200: "#BFDBFE", 300: "#93C5FD", 400: "#60A5FA", 500: "#3B82F6", 600: "#2563EB", 700: "#1D4ED8", 800: "#1E40AF", 900: "#1E3A8A", 950: "#172554" },
  },
  {
    code: "rosa",
    label: "Rosa",
    scale: { 50: "#FDF2F8", 100: "#FCE7F3", 200: "#FBCFE8", 300: "#F9A8D4", 400: "#F472B6", 500: "#DB2777", 600: "#BE185D", 700: "#9D174D", 800: "#831843", 900: "#500724", 950: "#2D0415" },
  },
  {
    code: "naranja",
    label: "Terracota",
    scale: { 50: "#FFF7ED", 100: "#FFEDD5", 200: "#FED7AA", 300: "#FDBA74", 400: "#FB923C", 500: "#EA580C", 600: "#C2410C", 700: "#9A3412", 800: "#7C2D12", 900: "#431407", 950: "#260A03" },
  },
  {
    code: "turquesa",
    label: "Turquesa",
    scale: { 50: "#F0FDFA", 100: "#CCFBF1", 200: "#99F6E4", 300: "#5EEAD4", 400: "#2DD4BF", 500: "#0D9488", 600: "#0F766E", 700: "#115E59", 800: "#134E4A", 900: "#042F2E", 950: "#021A19" },
  },
  {
    code: "grafito",
    label: "Grafito",
    scale: { 50: "#F8FAFC", 100: "#F1F5F9", 200: "#E2E8F0", 300: "#CBD5E1", 400: "#94A3B8", 500: "#64748B", 600: "#475569", 700: "#334155", 800: "#1E293B", 900: "#0F172A", 950: "#020617" },
  },
];

export const DEFAULT_ACCENT = "violeta";

export function isAccentCode(v: string): boolean {
  return ACCENT_PRESETS.some((p) => p.code === v);
}

function hexToTriplet(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

// Las variables CSS que redefinen la escala `accent-*` de Tailwind (ver
// tailwind.config.ts y :root en globals.css). Null para el violeta de fábrica:
// no hace falta pisar nada.
export function accentCss(code: string): string | null {
  if (code === DEFAULT_ACCENT) return null;
  const preset = ACCENT_PRESETS.find((p) => p.code === code);
  if (!preset) return null;
  const vars = Object.entries(preset.scale)
    .map(([k, hex]) => `--accent-${k}:${hexToTriplet(hex)};`)
    .join("");
  return `:root{${vars}}`;
}

// Iniciales para el cuadradito del negocio cuando no hay logo.
export function businessInitial(name: string): string {
  return (name.trim()[0] ?? "?").toUpperCase();
}

// Tope del logo ya redimensionado (data URL). El navegador lo achica a 256 px.
export const MAX_LOGO_CHARS = 200_000;
