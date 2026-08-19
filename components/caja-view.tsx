"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Wallet,
  Lock,
  Unlock,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  Percent,
  Pencil,
  Trash2,
  EyeOff,
  Eye,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  openCashSession,
  closeCashSession,
  addCashMovement,
  saveEmployee,
  toggleEmployee,
  deleteEmployee,
  saveCostRule,
  toggleCostRule,
  deleteCostRule,
  type CashFormState,
} from "@/app/cash-actions";
import { formatMoney, formatDate } from "@/lib/format";
import { MOVEMENT_KINDS, movementLabel, type CashTotals } from "@/lib/cash";
import { PAYMENT_METHODS, paymentLabel } from "@/lib/sales";
import { SubmitButton } from "./submit-button";

export interface CajaData {
  sesion: { id: string; openedAt: string; openingAmount: number; notes: string | null } | null;
  totales: CashTotals | null;
  movimientos: {
    id: string;
    kind: string;
    amount: number;
    paymentMethod: string;
    description: string;
    createdAt: string;
  }[];
  empleados: { id: string; name: string; commissionPct: number; active: boolean; ventas: number }[];
  reglas: {
    id: string;
    name: string;
    kind: string;
    value: number;
    paymentMethod: string | null;
    active: boolean;
  }[];
  cierres: {
    id: string;
    closedAt: string;
    expectedAmount: number;
    countedAmount: number;
    difference: number;
  }[];
  comisionesSemana: { employeeId: string | null; name: string; amount: number; ventas: number }[];
}

const EMPTY: CashFormState = {};
type Tab = "caja" | "equipo" | "costos";

export function CajaView({ data }: { data: CajaData }) {
  const [tab, setTab] = useState<Tab>("caja");

  return (
    <div>
      <div className="mb-5 inline-flex rounded-xl bg-surface-2 p-1">
        <TabButton on={tab === "caja"} onClick={() => setTab("caja")}>
          Caja
        </TabButton>
        <TabButton on={tab === "equipo"} onClick={() => setTab("equipo")}>
          Equipo y comisiones
        </TabButton>
        <TabButton on={tab === "costos"} onClick={() => setTab("costos")}>
          Costos por venta
        </TabButton>
      </div>

      {tab === "caja" && <CajaTab data={data} />}
      {tab === "equipo" && <EquipoTab data={data} />}
      {tab === "costos" && <CostosTab data={data} />}
    </div>
  );
}

function TabButton({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
        on ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink-soft"
      }`}
    >
      {children}
    </button>
  );
}

// --- Caja -------------------------------------------------------------------

function CajaTab({ data }: { data: CajaData }) {
  if (!data.sesion) return <CajaCerrada cierres={data.cierres} />;
  return <CajaAbierta data={data} />;
}

function CajaCerrada({ cierres }: { cierres: CajaData["cierres"] }) {
  const [state, action] = useActionState(openCashSession, EMPTY);

  return (
    <div className="space-y-6">
      <div className="card p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500/10 text-brand-600">
            <Unlock className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-ink">La caja está cerrada</h2>
            <p className="text-sm text-ink-muted">
              Abrila con el efectivo que dejás de fondo para arrancar el día.
            </p>
          </div>
        </div>

        <form action={action} className="grid gap-4 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
          <div>
            <label className="label" htmlFor="opening">
              Fondo inicial
            </label>
            <input
              id="opening"
              name="openingAmount"
              type="number"
              min={0}
              step="any"
              defaultValue={0}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="open-notes">
              Nota <span className="font-normal text-ink-faint">(opcional)</span>
            </label>
            <input id="open-notes" name="notes" className="input" placeholder="Turno mañana" />
          </div>
          <SubmitButton className="btn-primary">
            <Unlock className="h-4 w-4" /> Abrir caja
          </SubmitButton>
        </form>

        {state.error && (
          <p className="mt-3 rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-700 dark:text-rose-300">
            {state.error}
          </p>
        )}
      </div>

      <Cierres cierres={cierres} />
    </div>
  );
}

function CajaAbierta({ data }: { data: CajaData }) {
  const t = data.totales!;
  const [movState, movAction] = useActionState(addCashMovement, EMPTY);
  const [closeState, closeAction] = useActionState(closeCashSession, EMPTY);
  // Arqueo a ciegas: el esperado queda tapado hasta escribir lo contado. Si el
  // número está a la vista, se copia y el arqueo deja de servir para nada.
  const [counted, setCounted] = useState("");
  const [revelar, setRevelar] = useState(false);

  const contado = parseFloat(counted || "");
  const puedeVer = Number.isFinite(contado) && counted.trim() !== "";
  const diferencia = puedeVer ? Math.round((contado - t.esperado) * 100) / 100 : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display font-bold text-ink">Movimientos del turno</h2>
            <span className="text-xs text-ink-muted">
              Abierta {formatDate(data.sesion!.openedAt)}
            </span>
          </div>

          <form action={movAction} className="mb-4 grid gap-2 sm:grid-cols-[auto_1fr_auto_auto]">
            <select name="kind" defaultValue="egreso" className="input" aria-label="Tipo">
              {MOVEMENT_KINDS.filter((k) => k.code !== "venta").map((k) => (
                <option key={k.code} value={k.code}>
                  {k.label}
                </option>
              ))}
            </select>
            <input name="description" placeholder="Ej. pagué al proveedor" className="input" />
            <input
              name="amount"
              type="number"
              min={0}
              step="any"
              placeholder="0"
              className="input w-32"
              aria-label="Importe"
            />
            <input type="hidden" name="paymentMethod" value="efectivo" />
            <SubmitButton className="btn-secondary">
              <Plus className="h-4 w-4" />
            </SubmitButton>
          </form>

          {movState.error && (
            <p className="mb-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
              {movState.error}
            </p>
          )}

          {data.movimientos.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-ink-muted">
              Todavía no hay movimientos. Las ventas se cargan solas.
            </p>
          ) : (
            <ul className="divide-y divide-line-soft">
              {data.movimientos.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${
                        m.amount >= 0
                          ? "bg-brand-500/10 text-brand-600"
                          : "bg-rose-500/10 text-rose-600"
                      }`}
                    >
                      {m.amount >= 0 ? (
                        <ArrowDownLeft className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm text-ink">{m.description}</div>
                      <div className="text-xs text-ink-muted">
                        {movementLabel(m.kind)} · {paymentLabel(m.paymentMethod)}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-semibold tabular-nums ${
                      m.amount >= 0 ? "text-ink" : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {formatMoney(m.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Cierre */}
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-500/10 text-accent-600">
              <Wallet className="h-4 w-4" />
            </span>
            <h2 className="font-display font-bold text-ink">Cerrar caja</h2>
          </div>

          <p className="mb-3 text-sm text-ink-muted">
            Contá el efectivo del cajón y escribí cuánto hay. El sistema te dice después si
            coincide.
          </p>

          <form action={closeAction}>
            <label className="label" htmlFor="counted">
              Efectivo contado
            </label>
            <input
              id="counted"
              name="countedAmount"
              type="number"
              min={0}
              step="any"
              value={counted}
              onChange={(e) => setCounted(e.target.value)}
              placeholder="0"
              className="input text-lg font-bold tabular-nums"
            />

            <div className="mt-3 rounded-xl bg-surface-2 p-3 text-sm">
              <Row label="Fondo inicial" value={formatMoney(t.opening)} />
              <Row label="Ventas en efectivo" value={formatMoney(t.ventasEfectivo)} />
              {t.ingresos > 0 && <Row label="Otros ingresos" value={formatMoney(t.ingresos)} />}
              {t.egresos < 0 && <Row label="Egresos" value={formatMoney(t.egresos)} />}

              <div className="mt-2 border-t border-line pt-2">
                {!puedeVer && !revelar ? (
                  <button
                    type="button"
                    onClick={() => setRevelar(true)}
                    className="flex w-full items-center justify-between text-left text-ink-muted"
                  >
                    <span>Esperado en caja</span>
                    <span className="text-xs underline">ver igual</span>
                  </button>
                ) : (
                  <Row
                    label="Esperado en caja"
                    value={formatMoney(t.esperado)}
                    strong
                  />
                )}
              </div>

              {diferencia !== null && (
                <div
                  className={`mt-2 flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold ${
                    diferencia === 0
                      ? "bg-brand-500/15 text-brand-700 dark:text-brand-300"
                      : "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                  }`}
                >
                  {diferencia === 0 ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Cuadra exacto
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4" />
                      {diferencia > 0 ? "Sobra " : "Falta "}
                      {formatMoney(Math.abs(diferencia))}
                    </>
                  )}
                </div>
              )}
            </div>

            <input
              name="notes"
              placeholder="Nota del cierre (opcional)"
              className="input mt-3"
            />

            {closeState.error && (
              <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
                {closeState.error}
              </p>
            )}

            <SubmitButton className="btn-accent mt-3 w-full">
              <Lock className="h-4 w-4" /> Cerrar caja
            </SubmitButton>
          </form>
        </div>
      </div>

      {data.comisionesSemana.length > 0 && (
        <div className="card p-5">
          <h2 className="mb-1 font-display font-bold text-ink">A pagar esta semana</h2>
          <p className="mb-3 text-sm text-ink-muted">
            Comisiones acumuladas por las ventas de la semana.
          </p>
          <ul className="divide-y divide-line-soft">
            {data.comisionesSemana.map((c) => (
              <li key={c.employeeId ?? c.name} className="flex items-center justify-between py-2.5">
                <div>
                  <div className="text-sm font-semibold text-ink">{c.name}</div>
                  <div className="text-xs text-ink-muted">
                    {c.ventas} {c.ventas === 1 ? "venta" : "ventas"}
                  </div>
                </div>
                <span className="font-display font-bold text-accent-700 dark:text-accent-300">
                  {formatMoney(c.amount)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Cierres cierres={data.cierres} />
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className={strong ? "font-bold text-ink" : "text-ink-soft"}>{value}</span>
    </div>
  );
}

function Cierres({ cierres }: { cierres: CajaData["cierres"] }) {
  if (cierres.length === 0) return null;
  return (
    <div className="card p-5">
      <h2 className="mb-3 font-display font-bold text-ink">Últimos cierres</h2>
      <ul className="divide-y divide-line-soft">
        {cierres.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
            <span className="text-sm text-ink-soft">{formatDate(c.closedAt)}</span>
            <div className="flex items-center gap-4 text-sm tabular-nums">
              <span className="text-ink-muted">
                Esperado {formatMoney(c.expectedAmount)}
              </span>
              <span className="text-ink">Contado {formatMoney(c.countedAmount)}</span>
              <span
                className={`font-semibold ${
                  c.difference === 0
                    ? "text-brand-700 dark:text-brand-300"
                    : "text-amber-800 dark:text-amber-300"
                }`}
              >
                {c.difference === 0
                  ? "OK"
                  : `${c.difference > 0 ? "+" : ""}${formatMoney(c.difference)}`}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- Equipo -----------------------------------------------------------------

function EquipoTab({ data }: { data: CajaData }) {
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <p className="max-w-xl text-sm text-ink-muted">
          Cargá a quién atiende y qué porcentaje se lleva. Al registrar una venta elegís quién
          la hizo y la comisión se calcula sola sobre lo cobrado.
        </p>
        {!editing && (
          <button onClick={() => setEditing("new")} className="btn-primary shrink-0">
            <Plus className="h-4 w-4" /> Nuevo
          </button>
        )}
      </div>

      {editing && (
        <EmpleadoEditor
          empleado={
            editing === "new" ? null : data.empleados.find((e) => e.id === editing) ?? null
          }
          onClose={() => setEditing(null)}
        />
      )}

      {data.empleados.length === 0 && !editing ? (
        <Empty
          icon={<Users className="h-7 w-7" />}
          title="Todavía no cargaste a nadie"
          text="Si atendés solo, no hace falta. Cargá empleados cuando quieras llevar la cuenta de cuánto le corresponde a cada uno."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.empleados.map((e) => (
            <EmpleadoCard key={e.id} e={e} onEdit={() => setEditing(e.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmpleadoCard({
  e,
  onEdit,
}: {
  e: CajaData["empleados"][number];
  onEdit: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`card p-4 ${e.active ? "" : "opacity-70"}`}>
      <div className="mb-1 flex items-start justify-between gap-2">
        <h3 className="min-w-0 flex-1 truncate font-display font-bold text-ink">{e.name}</h3>
        <span className="shrink-0 font-display font-bold text-accent-700 dark:text-accent-300">
          {e.commissionPct}%
        </span>
      </div>
      <p className="mb-3 text-xs text-ink-faint">
        {e.ventas === 0 ? "Sin ventas registradas" : `${e.ventas} ventas con comisión`}
      </p>
      {note && <p className="mb-2 text-xs text-amber-700 dark:text-amber-300">{note}</p>}
      <div className="flex flex-wrap gap-2">
        <button onClick={onEdit} disabled={busy} className="btn-secondary !py-1.5 text-xs">
          <Pencil className="h-3.5 w-3.5" /> Editar
        </button>
        <button
          onClick={() => run(() => toggleEmployee(e.id, !e.active))}
          disabled={busy}
          className="btn-ghost !py-1.5 text-xs"
        >
          {e.active ? (
            <>
              <EyeOff className="h-3.5 w-3.5" /> Ocultar
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" /> Activar
            </>
          )}
        </button>
        <button
          onClick={() => {
            const msg = e.ventas
              ? `${e.name} ya tiene ventas con comisión. Borrarlo perdería ese historial, así que se va a desactivar. ¿Seguimos?`
              : `¿Borrar a ${e.name}?`;
            if (!confirm(msg)) return;
            run(async () => {
              const r = await deleteEmployee(e.id);
              if (r.deactivated) setNote("Tenía comisiones registradas: se desactivó.");
            });
          }}
          disabled={busy}
          className="btn-ghost !py-1.5 text-xs text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function EmpleadoEditor({
  empleado,
  onClose,
}: {
  empleado: CajaData["empleados"][number] | null;
  onClose: () => void;
}) {
  const [state, action] = useActionState(saveEmployee.bind(null, empleado?.id ?? null), EMPTY);
  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <form action={action} className="card p-5">
      <h3 className="mb-4 font-display font-bold text-ink">
        {empleado ? `Editar ${empleado.name}` : "Nuevo integrante"}
      </h3>
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
        <div>
          <label className="label" htmlFor="emp-name">
            Nombre
          </label>
          <input
            id="emp-name"
            name="name"
            defaultValue={empleado?.name ?? ""}
            required
            maxLength={60}
            placeholder="Juan"
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="emp-pct">
            Comisión (%)
          </label>
          <input
            id="emp-pct"
            name="commissionPct"
            type="number"
            min={0}
            max={100}
            step="any"
            defaultValue={empleado?.commissionPct ?? 40}
            className="input"
          />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <SubmitButton className="btn-primary">Guardar</SubmitButton>
        </div>
      </div>
      {state.error && (
        <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
          {state.error}
        </p>
      )}
    </form>
  );
}

// --- Costos -----------------------------------------------------------------

function CostosTab({ data }: { data: CajaData }) {
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <p className="max-w-xl text-sm text-ink-muted">
          Lo que te descuentan en cada venta: comisión de Mercado Pago, impuesto al débito,
          etc. Podés hacer que un costo aplique solo a un método de pago.
        </p>
        {!editing && (
          <button onClick={() => setEditing("new")} className="btn-primary shrink-0">
            <Plus className="h-4 w-4" /> Nuevo
          </button>
        )}
      </div>

      {editing && (
        <CostoEditor
          regla={editing === "new" ? null : data.reglas.find((r) => r.id === editing) ?? null}
          onClose={() => setEditing(null)}
        />
      )}

      {data.reglas.length === 0 && !editing ? (
        <Empty
          icon={<Percent className="h-7 w-7" />}
          title="Sin costos cargados"
          text="Si cobrás todo en efectivo, probablemente no necesites ninguno. Cargalos si querés que el neto descuente lo que se lleva la pasarela o el banco."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.reglas.map((r) => (
            <CostoCard key={r.id} r={r} onEdit={() => setEditing(r.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function CostoCard({ r, onEdit }: { r: CajaData["reglas"][number]; onEdit: () => void }) {
  const [busy, setBusy] = useState(false);
  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`card p-4 ${r.active ? "" : "opacity-70"}`}>
      <div className="mb-1 flex items-start justify-between gap-2">
        <h3 className="min-w-0 flex-1 truncate font-display font-bold text-ink">{r.name}</h3>
        <span className="shrink-0 font-display font-bold text-accent-700 dark:text-accent-300">
          {r.kind === "percent" ? `${r.value}%` : formatMoney(r.value)}
        </span>
      </div>
      <p className="mb-3 text-xs text-ink-muted">
        {r.paymentMethod ? `Solo en ${paymentLabel(r.paymentMethod)}` : "En todas las ventas"}
      </p>
      <div className="flex flex-wrap gap-2">
        <button onClick={onEdit} disabled={busy} className="btn-secondary !py-1.5 text-xs">
          <Pencil className="h-3.5 w-3.5" /> Editar
        </button>
        <button
          onClick={() => run(() => toggleCostRule(r.id, !r.active))}
          disabled={busy}
          className="btn-ghost !py-1.5 text-xs"
        >
          {r.active ? "Pausar" : "Activar"}
        </button>
        <button
          onClick={() => {
            if (confirm(`¿Borrar "${r.name}"? Los costos ya aplicados no cambian.`)) {
              run(() => deleteCostRule(r.id));
            }
          }}
          disabled={busy}
          className="btn-ghost !py-1.5 text-xs text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function CostoEditor({
  regla,
  onClose,
}: {
  regla: CajaData["reglas"][number] | null;
  onClose: () => void;
}) {
  const [state, action] = useActionState(saveCostRule.bind(null, regla?.id ?? null), EMPTY);
  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <form action={action} className="card p-5">
      <h3 className="mb-4 font-display font-bold text-ink">
        {regla ? `Editar ${regla.name}` : "Nuevo costo por venta"}
      </h3>
      <div className="grid gap-4 sm:grid-cols-4 sm:items-end">
        <div>
          <label className="label" htmlFor="cost-name">
            Nombre
          </label>
          <input
            id="cost-name"
            name="name"
            defaultValue={regla?.name ?? ""}
            required
            placeholder="Comisión Mercado Pago"
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="cost-kind">
            Tipo
          </label>
          <select
            id="cost-kind"
            name="kind"
            defaultValue={regla?.kind ?? "percent"}
            className="input"
          >
            <option value="percent">Porcentaje</option>
            <option value="fixed">Importe fijo</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="cost-value">
            Valor
          </label>
          <input
            id="cost-value"
            name="value"
            type="number"
            min={0}
            step="any"
            defaultValue={regla?.value ?? ""}
            required
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="cost-pm">
            Aplica a
          </label>
          <select
            id="cost-pm"
            name="paymentMethod"
            defaultValue={regla?.paymentMethod ?? ""}
            className="input"
          >
            <option value="">Todas las ventas</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.code} value={m.code}>
                Solo {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {state.error && (
        <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
          {state.error}
        </p>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="btn-secondary">
          Cancelar
        </button>
        <SubmitButton className="btn-primary">Guardar</SubmitButton>
      </div>
    </form>
  );
}

function Empty({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/10 text-brand-600">
        {icon}
      </div>
      <h3 className="font-display text-base font-bold text-ink">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-ink-muted">{text}</p>
    </div>
  );
}
