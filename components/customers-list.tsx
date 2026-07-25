"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ChevronRight, Cake } from "lucide-react";
import { SEGMENT_META, Segment } from "@/lib/segmentation";
import { Avatar, SegmentBadge } from "@/components/ui";

export interface CustomerRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  segment: Segment;
  isVip: boolean;
  totalSpent: number;
  purchaseCount: number;
  daysSinceLast: number | null;
  birthdayInDays: number | null;
  tags: string[];
}

function money(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

const FILTERS: { key: "todos" | Segment; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "vip", label: "VIP" },
  { key: "frecuente", label: "Frecuentes" },
  { key: "ocasional", label: "Ocasionales" },
  { key: "nuevo", label: "Nuevos" },
  { key: "inactivo", label: "Inactivos" },
];

export function CustomersList({
  customers,
  initialFilter = "todos",
}: {
  customers: CustomerRow[];
  initialFilter?: "todos" | Segment;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"todos" | Segment>(initialFilter);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((c) => {
      if (filter !== "todos" && c.segment !== filter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [customers, query, filter]);

  const counts = useMemo(() => {
    const m: Record<string, number> = { todos: customers.length };
    (Object.keys(SEGMENT_META) as Segment[]).forEach(
      (s) => (m[s] = customers.filter((c) => c.segment === s).length)
    );
    return m;
  }, [customers]);

  return (
    <div>
      {/* Buscador */}
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, email, teléfono o etiqueta…"
          className="input pl-10"
        />
      </div>

      {/* Filtros */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-brand-600 text-white"
                  : "bg-surface text-ink-soft ring-1 ring-inset ring-line hover:bg-surface-2"
              }`}
            >
              {f.label}
              <span
                className={`rounded-full px-1.5 text-xs font-bold ${
                  active ? "bg-surface/20 text-white" : "bg-surface-2 text-ink-muted"
                }`}
              >
                {counts[f.key] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="card px-6 py-12 text-center text-sm text-ink-muted">
          No se encontraron clientes con ese criterio.
        </div>
      ) : (
        <div className="card divide-y divide-line-soft overflow-hidden">
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/clientes/${c.id}`}
              className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-surface-2 sm:gap-4 sm:px-5"
            >
              <Avatar name={c.name} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold text-ink">{c.name}</span>
                  {c.birthdayInDays !== null && c.birthdayInDays <= 7 && (
                    <Cake className="h-3.5 w-3.5 shrink-0 text-gold-500" />
                  )}
                </div>
                <div className="truncate text-xs text-ink-muted">
                  {c.phone || c.email || "Sin contacto"}
                </div>
              </div>

              <div className="hidden text-right sm:block">
                <div className="text-sm font-semibold text-ink">{money(c.totalSpent)}</div>
                <div className="text-xs text-ink-muted">{c.purchaseCount} compras</div>
              </div>

              <div className="hidden w-24 justify-end sm:flex">
                <SegmentBadge segment={c.segment} />
              </div>

              <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
