// Parser CSV liviano: detecta separador (, o ;), soporta campos entre comillas
// con comillas escapadas ("") y saltos de línea CRLF/LF.

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

function detectDelimiter(sample: string): string {
  const firstLine = sample.split(/\r?\n/)[0] ?? "";
  const commas = (firstLine.match(/,/g) || []).length;
  const semis = (firstLine.match(/;/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;
  if (tabs > commas && tabs > semis) return "\t";
  return semis > commas ? ";" : ",";
}

function parseRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (c === '"' && next === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c === "\r") {
      // ignorar; el \n siguiente cierra la fila
    } else {
      field += c;
    }
  }
  // último campo/fila
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function parseCsv(text: string, hasHeader = true): ParsedCsv {
  const clean = text.replace(/^﻿/, "").trim(); // quitar BOM
  if (!clean) return { headers: [], rows: [] };

  const delimiter = detectDelimiter(clean);
  const all = parseRows(clean, delimiter)
    .map((r) => r.map((c) => c.trim()))
    .filter((r) => r.some((c) => c.length > 0)); // descartar filas vacías

  if (all.length === 0) return { headers: [], rows: [] };

  if (hasHeader) {
    const [head, ...rest] = all;
    return { headers: head, rows: rest };
  }
  const cols = all[0].length;
  const headers = Array.from({ length: cols }, (_, i) => `Columna ${i + 1}`);
  return { headers, rows: all };
}

// Adivina qué campo destino corresponde a cada encabezado
export type TargetField = "name" | "phone" | "email" | "birthdate" | "tags" | "notes";

const SYNONYMS: Record<TargetField, string[]> = {
  name: ["nombre", "cliente", "apellido", "name", "nombre y apellido", "razon social"],
  phone: ["telefono", "teléfono", "celular", "whatsapp", "tel", "movil", "móvil", "phone", "cel"],
  email: ["email", "correo", "mail", "e-mail"],
  birthdate: ["cumple", "cumpleaños", "cumpleanos", "nacimiento", "fecha", "birthday", "nac"],
  tags: ["etiqueta", "etiquetas", "tag", "tags", "categoria", "categoría"],
  notes: ["nota", "notas", "observacion", "observación", "comentario", "detalle"],
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

export function guessMapping(headers: string[]): Record<TargetField, number> {
  const map: Record<TargetField, number> = {
    name: -1,
    phone: -1,
    email: -1,
    birthdate: -1,
    tags: -1,
    notes: -1,
  };
  (Object.keys(SYNONYMS) as TargetField[]).forEach((field) => {
    const idx = headers.findIndex((h) => {
      const n = normalize(h);
      return SYNONYMS[field].some((syn) => n === syn || n.includes(syn));
    });
    map[field] = idx;
  });
  return map;
}

// Parseo flexible de fechas: dd/mm/aaaa, d-m-aa, aaaa-mm-dd
export function parseFlexibleDate(input: string | null | undefined): Date | null {
  const s = (input ?? "").trim();
  if (!s) return null;

  // ISO aaaa-mm-dd
  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return isNaN(d.getTime()) ? null : d;
  }
  // dd/mm/aaaa o dd-mm-aa
  m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (m) {
    let year = Number(m[3]);
    if (year < 100) year += year > 30 ? 1900 : 2000;
    const d = new Date(year, Number(m[2]) - 1, Number(m[1]));
    return isNaN(d.getTime()) ? null : d;
  }
  const fallback = new Date(s);
  return isNaN(fallback.getTime()) ? null : fallback;
}
