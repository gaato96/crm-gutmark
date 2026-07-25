import { getSessionUser } from "@/lib/auth";
import { getEnrichedCustomers, toConfig } from "@/lib/queries";
import { SEGMENT_META } from "@/lib/segmentation";

export const dynamic = "force-dynamic";

function csvCell(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  // Escapar comillas y envolver si contiene separador, comillas o saltos
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function fmtDate(d: Date | null): string {
  if (!d) return "";
  const dt = new Date(d);
  const day = String(dt.getDate()).padStart(2, "0");
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  return `${day}/${m}/${dt.getFullYear()}`;
}

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return new Response("No autorizado", { status: 401 });
  }

  const cfg = toConfig(session.business);
  const customers = await getEnrichedCustomers(session.business.id, cfg);

  const headers = [
    "Nombre",
    "Telefono",
    "Email",
    "Cumpleaños",
    "Etiquetas",
    "Segmento",
    "Total gastado",
    "Compras",
    "Ticket promedio",
    "Ultima compra",
    "Notas",
  ];

  const lines = [headers.join(",")];
  for (const c of customers) {
    lines.push(
      [
        csvCell(c.name),
        csvCell(c.phone),
        csvCell(c.email),
        csvCell(fmtDate(c.birthdate)),
        csvCell(c.tags.join(", ")),
        csvCell(SEGMENT_META[c.segment].label),
        csvCell(Math.round(c.totalSpent)),
        csvCell(c.purchaseCount),
        csvCell(Math.round(c.avgTicket)),
        csvCell(fmtDate(c.lastPurchaseAt)),
        csvCell(c.notes),
      ].join(",")
    );
  }

  // BOM para que Excel reconozca UTF-8 (acentos)
  const body = "﻿" + lines.join("\r\n");
  const date = new Date().toISOString().slice(0, 10);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clientes-${date}.csv"`,
    },
  });
}
