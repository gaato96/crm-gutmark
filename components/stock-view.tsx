"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import {
  Package,
  PackagePlus,
  PackageMinus,
  AlertTriangle,
  Search,
  Plus,
  Trash2,
  Settings2,
  ClipboardList,
  Copy,
  Check,
  History,
  Wallet,
  CheckCircle2,
} from "lucide-react";
import {
  registerStockPurchase,
  registerStockAdjustment,
  saveStockSettings,
  enableStockTracking,
  type StockFormState,
} from "@/app/stock-actions";
import { formatMoney, formatDate, formatTime } from "@/lib/format";
import { matchesSearch } from "@/lib/search";
import {
  STOCK_KINDS,
  STOCK_LEVEL_META,
  stockLevel,
  stockKindLabel,
  marginPct,
  suggestedReorder,
  type StockItemRow,
  type StockMovementRow,
} from "@/lib/stock";
import { SubmitButton } from "./submit-button";

type Tab = "inventario" | "cargar" | "reponer" | "movimientos";

const TAB_HINT: Record<Tab, string> = {
  inventario: "Lo que hay en el local de cada producto. Las ventas lo descuentan solas.",
  cargar: "Cuando llega mercadería del proveedor. Si la pagaste con la plata del cajón, se descuenta de la caja.",
  reponer: "Lo que está por debajo del mínimo, con un pedido listo para mandarle al proveedor.",
  movimientos: "Todo lo que entró y salió, con el saldo que quedó después de cada movimiento.",
};

const EMPTY: StockFormState = {};

export function StockView({
  items,
  movements,
  hasCaja,
  cajaAbierta,
  businessName,
}: {
  items: StockItemRow[];
  movements: StockMovementRow[];
  hasCaja: boolean;
  cajaAbierta: boolean;
  businessName: string;
}) {
  const [tab, setTab] = useState<Tab>("inventario");
  const tracked = items.filter((i) => i.trackStock && i.active);
  const untracked = items.filter((i) => !i.trackStock && i.active);
  const toReorder = tracked.filter((i) => stockLevel(i.stock, i.minStock) !== "ok");

  const inventoryValue = tracked.reduce((s, i) => s + Math.max(0, i.stock) * (i.cost ?? 0), 0);
  const saleValue = tracked.reduce((s, i) => s + Math.max(0, i.stock) * i.price, 0);
  const sinCosto = tracked.filter((i) => i.cost === null).length;

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Productos con stock" value={String(tracked.length)} icon={<Package className="h-4 w-4" />} />
        <Kpi
          label="Para reponer"
          value={String(toReorder.length)}
          tone={toReorder.length > 0 ? "warn" : undefined}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <Kpi
          label="Invertido en mercadería"
          value={formatMoney(inventoryValue)}
          hint={sinCosto > 0 ? `${sinCosto} sin costo cargado` : "A precio de costo"}
          icon={<Wallet className="h-4 w-4" />}
        />
        <Kpi
          label="Si vendés todo"
          value={formatMoney(saleValue)}
          hint="A precio de venta"
          icon={<PackagePlus className="h-4 w-4" />}
        />
      </div>

      <div className="inline-flex max-w-full overflow-x-auto rounded-xl bg-surface-2 p-1">
        <TabButton on={tab === "inventario"} onClick={() => setTab("inventario")}>
          Inventario
        </TabButton>
        <TabButton on={tab === "cargar"} onClick={() => setTab("cargar")}>
          Cargar mercadería
        </TabButton>
        <TabButton on={tab === "reponer"} onClick={() => setTab("reponer")}>
          Reponer{toReorder.length > 0 ? ` (${toReorder.length})` : ""}
        </TabButton>
        <TabButton on={tab === "movimientos"} onClick={() => setTab("movimientos")}>
          Movimientos
        </TabButton>
      </div>
      <p className="mb-5 mt-2 text-sm text-ink-muted">{TAB_HINT[tab]}</p>

      {items.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-16 text-center">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/10 text-brand-600">
            <Package className="h-7 w-7" />
          </div>
          <h3 className="font-display text-base font-bold text-ink">Todavía no cargaste productos</h3>
          <p className="mt-1 max-w-md text-sm text-ink-muted">
            El stock se lleva sobre los productos de tu catálogo. Cargalos primero con su precio y
            después volvé acá para cargar cuántos tenés.
          </p>
          <a href="/catalogo" className="btn-primary mt-5">
            <Plus className="h-4 w-4" /> Ir al catálogo
          </a>
        </div>
      ) : (
        <>
          {tab === "inventario" && <InventarioTab items={items} untracked={untracked} />}
          {tab === "cargar" && (
            <CargarTab
              items={items.filter((i) => i.active)}
              hasCaja={hasCaja}
              cajaAbierta={cajaAbierta}
              onDone={() => setTab("movimientos")}
            />
          )}
          {tab === "reponer" && <ReponerTab items={toReorder} businessName={businessName} />}
          {tab === "movimientos" && <MovimientosTab movements={movements} />}
        </>
      )}
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
      className={`shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
        on ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink-soft"
      }`}
    >
      {children}
    </button>
  );
}

function Kpi({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  tone?: "warn";
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <span
          className={`grid h-7 w-7 place-items-center rounded-lg ${
            tone === "warn"
              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
              : "bg-brand-500/12 text-brand-700 dark:text-brand-300"
          }`}
        >
          {icon}
        </span>
        {label}
      </div>
      <div className="mt-2 break-words font-display text-xl font-bold tabular-nums text-ink">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-ink-muted">{hint}</div>}
    </div>
  );
}

// --- Inventario -----------------------------------------------------------------

function InventarioTab({ items, untracked }: { items: StockItemRow[]; untracked: StockItemRow[] }) {
  const [query, setQuery] = useState("");
  const [onlyAlerts, setOnlyAlerts] = useState(false);
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = useMemo(
    () =>
      items.filter((i) => {
        if (!i.trackStock) return false;
        if (onlyAlerts && stockLevel(i.stock, i.minStock) === "ok") return false;
        return !query.trim() || matchesSearch(`${i.name} ${i.category} ${i.sku}`, query);
      }),
    [items, query, onlyAlerts]
  );

  return (
    <div className="space-y-4">
      {untracked.length > 0 && (
        <div className="card flex flex-col gap-3 border-l-4 border-l-accent-500 p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">
              {untracked.length === 1
                ? "1 producto del catálogo todavía no lleva control de stock"
                : `${untracked.length} productos del catálogo todavía no llevan control de stock`}
            </p>
            <p className="text-xs text-ink-muted">
              {untracked.slice(0, 4).map((i) => i.name).join(", ")}
              {untracked.length > 4 ? "…" : ""}
            </p>
          </div>
          <button
            className="btn-accent shrink-0 !py-2 text-sm"
            disabled={pending}
            onClick={() => startTransition(async () => void (await enableStockTracking(untracked.map((i) => i.id))))}
          >
            {pending ? "Activando…" : "Controlar stock de todos"}
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, categoría o código…"
            className="input !pl-9"
          />
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={onlyAlerts} onChange={(e) => setOnlyAlerts(e.target.checked)} />
          Solo para reponer
        </label>
      </div>

      {visible.length === 0 ? (
        <p className="card px-5 py-10 text-center text-sm text-ink-muted">
          {items.some((i) => i.trackStock)
            ? "Ningún producto coincide."
            : "Activá el control de stock de tus productos para empezar."}
        </p>
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-line-soft">
            {visible.map((i) => {
              const level = stockLevel(i.stock, i.minStock);
              const margin = marginPct(i.price, i.cost);
              return (
                <li key={i.id} className={i.active ? "" : "opacity-60"}>
                  <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-semibold text-ink">{i.name}</span>
                        <span className={`badge ${STOCK_LEVEL_META[level].cls}`}>
                          {STOCK_LEVEL_META[level].label}
                        </span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-ink-muted">
                        <span>Precio {formatMoney(i.price)}</span>
                        <span>{i.cost !== null ? `Costo ${formatMoney(i.cost)}` : "Sin costo"}</span>
                        {margin !== null && <span>Margen {Math.round(margin)}%</span>}
                        <span>{i.sold30} vendidos en 30 días</span>
                        {i.sku && <span className="font-mono">#{i.sku}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-display text-2xl font-bold tabular-nums ${
                          level === "sin-stock" ? "text-rose-600" : "text-ink"
                        }`}
                      >
                        {i.stock}
                      </div>
                      <div className="text-[11px] text-ink-muted">
                        {i.minStock !== null ? `mín. ${i.minStock}` : "sin mínimo"}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          setConfiguring(null);
                          setAdjusting(adjusting === i.id ? null : i.id);
                        }}
                        className="btn-secondary !px-3 !py-1.5 text-xs"
                      >
                        <PackageMinus className="h-3.5 w-3.5" /> Ajustar
                      </button>
                      <button
                        onClick={() => {
                          setAdjusting(null);
                          setConfiguring(configuring === i.id ? null : i.id);
                        }}
                        className="btn-ghost !px-2 !py-1.5"
                        aria-label={`Configurar ${i.name}`}
                      >
                        <Settings2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {adjusting === i.id && <AdjustForm item={i} onClose={() => setAdjusting(null)} />}
                  {configuring === i.id && <SettingsForm item={i} onClose={() => setConfiguring(null)} />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function AdjustForm({ item, onClose }: { item: StockItemRow; onClose: () => void }) {
  const [state, action] = useActionState(registerStockAdjustment, EMPTY);
  const [kind, setKind] = useState("ajuste");
  const manual = STOCK_KINDS.filter((k) => k.manual && k.code !== "compra");

  useEffect(() => {
    if (state.ok) {
      const t = setTimeout(onClose, 1400);
      return () => clearTimeout(t);
    }
  }, [state.ok, onClose]);

  return (
    <form action={action} className="space-y-3 border-t border-line-soft bg-surface-2/50 px-4 py-4">
      <input type="hidden" name="serviceId" value={item.id} />
      <div className="grid gap-3 sm:grid-cols-[1.3fr_1fr_1.5fr]">
        <div>
          <label className="label">Qué pasó</label>
          <select name="kind" value={kind} onChange={(e) => setKind(e.target.value)} className="input">
            {manual.map((k) => (
              <option key={k.code} value={k.code}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{kind === "ajuste" ? "Cuántos contaste" : "Cantidad"}</label>
          <input
            name="quantity"
            type="number"
            min={kind === "ajuste" ? 0 : 1}
            step={1}
            defaultValue={kind === "ajuste" ? item.stock : ""}
            key={kind}
            required
            className="input"
          />
        </div>
        <div>
          <label className="label">
            Nota <span className="font-normal text-ink-faint">(opcional)</span>
          </label>
          <input name="note" maxLength={200} className="input" placeholder="Ej.: se rompió al acomodar" />
        </div>
      </div>
      {kind === "ajuste" && (
        <p className="text-xs text-ink-muted">
          El sistema dice que hay <strong>{item.stock}</strong>. Escribí lo que hay de verdad en el
          estante y se guarda la diferencia.
        </p>
      )}
      <FormFooter state={state} onClose={onClose} submit="Guardar" />
    </form>
  );
}

function SettingsForm({ item, onClose }: { item: StockItemRow; onClose: () => void }) {
  const [state, action] = useActionState(saveStockSettings.bind(null, item.id), EMPTY);

  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <form action={action} className="space-y-3 border-t border-line-soft bg-surface-2/50 px-4 py-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label">Stock mínimo</label>
          <input name="minStock" type="number" min={0} defaultValue={item.minStock ?? ""} className="input" placeholder="Sin alerta" />
          <p className="mt-1 text-xs text-ink-muted">Debajo de esto, te avisa que repongas.</p>
        </div>
        <div>
          <label className="label">Costo unitario</label>
          <input name="cost" type="number" min={0} step="any" defaultValue={item.cost ?? ""} className="input" placeholder="Lo que te sale a vos" />
          <p className="mt-1 text-xs text-ink-muted">Se actualiza solo al cargar mercadería.</p>
        </div>
        <div>
          <label className="label">Código</label>
          <input name="sku" defaultValue={item.sku} maxLength={40} className="input" placeholder="Interno o de barras" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input type="checkbox" name="trackStock" defaultChecked={item.trackStock} />
        Controlar el stock de este producto (cada venta descuenta)
      </label>
      <FormFooter state={state} onClose={onClose} submit="Guardar" />
    </form>
  );
}

function FormFooter({
  state,
  onClose,
  submit,
}: {
  state: StockFormState;
  onClose: () => void;
  submit: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {state.error && <p className="mr-auto text-sm text-rose-600">{state.error}</p>}
      {state.ok && state.message && (
        <p className="mr-auto inline-flex items-center gap-1 text-sm font-medium text-brand-700 dark:text-brand-300">
          <CheckCircle2 className="h-4 w-4" /> {state.message}
        </p>
      )}
      <button type="button" onClick={onClose} className="btn-ghost !py-2 text-sm">
        Cancelar
      </button>
      <SubmitButton className="btn-primary !py-2 text-sm">{submit}</SubmitButton>
    </div>
  );
}

// --- Cargar mercadería -------------------------------------------------------------

interface Line {
  key: string;
  serviceId: string;
  quantity: string;
  unitCost: string;
}

function newLine(): Line {
  return { key: Math.random().toString(36).slice(2), serviceId: "", quantity: "", unitCost: "" };
}

function CargarTab({
  items,
  hasCaja,
  cajaAbierta,
  onDone,
}: {
  items: StockItemRow[];
  hasCaja: boolean;
  cajaAbierta: boolean;
  onDone: () => void;
}) {
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [supplier, setSupplier] = useState("");
  const [note, setNote] = useState("");
  const [payFromCash, setPayFromCash] = useState(false);
  const [result, setResult] = useState<StockFormState>({});
  const [pending, startTransition] = useTransition();
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const total = lines.reduce(
    (s, l) => s + (parseFloat(l.unitCost) || 0) * (parseInt(l.quantity, 10) || 0),
    0
  );

  function update(key: string, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function submit() {
    setResult({});
    startTransition(async () => {
      const res = await registerStockPurchase({
        lines: lines
          .filter((l) => l.serviceId)
          .map((l) => ({
            serviceId: l.serviceId,
            quantity: parseInt(l.quantity, 10) || 0,
            unitCost: l.unitCost.trim() === "" ? null : parseFloat(l.unitCost),
          })),
        supplier,
        note,
        payFromCash,
      });
      setResult(res);
      if (res.ok) {
        setLines([newLine()]);
        setSupplier("");
        setNote("");
        setPayFromCash(false);
        setTimeout(onDone, 1500);
      }
    });
  }

  return (
    <div className="card space-y-4 p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">
            Proveedor <span className="font-normal text-ink-faint">(opcional)</span>
          </label>
          <input value={supplier} onChange={(e) => setSupplier(e.target.value)} maxLength={80} className="input" placeholder="Distribuidora Sur" />
        </div>
        <div>
          <label className="label">
            Nota <span className="font-normal text-ink-faint">(opcional)</span>
          </label>
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} className="input" placeholder="Factura 0001-00012345" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="hidden grid-cols-[1fr_6rem_8rem_2rem] gap-2 px-1 text-xs font-semibold text-ink-muted sm:grid">
          <span>Producto</span>
          <span>Cantidad</span>
          <span>Costo c/u</span>
          <span />
        </div>
        {lines.map((l) => {
          const item = byId.get(l.serviceId);
          return (
            <div key={l.key} className="grid grid-cols-[1fr_auto] gap-2 rounded-xl border border-line p-2 sm:grid-cols-[1fr_6rem_8rem_2rem] sm:border-0 sm:p-0">
              <select
                value={l.serviceId}
                onChange={(e) => {
                  const it = byId.get(e.target.value);
                  update(l.key, {
                    serviceId: e.target.value,
                    unitCost: l.unitCost || (it?.cost != null ? String(it.cost) : ""),
                  });
                }}
                className="input col-span-2 sm:col-span-1"
                aria-label="Producto"
              >
                <option value="">Elegí un producto…</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} {i.trackStock ? `(hay ${i.stock})` : ""}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                step={1}
                value={l.quantity}
                onChange={(e) => update(l.key, { quantity: e.target.value })}
                placeholder="Cant."
                className="input"
                aria-label="Cantidad"
              />
              <input
                type="number"
                min={0}
                step="any"
                value={l.unitCost}
                onChange={(e) => update(l.key, { unitCost: e.target.value })}
                placeholder={item?.cost != null ? String(item.cost) : "Costo"}
                className="input"
                aria-label="Costo unitario"
              />
              <button
                type="button"
                onClick={() => setLines((prev) => (prev.length > 1 ? prev.filter((x) => x.key !== l.key) : [newLine()]))}
                className="grid place-items-center text-ink-faint hover:text-rose-600"
                aria-label="Quitar renglón"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
        <button type="button" onClick={() => setLines((p) => [...p, newLine()])} className="btn-ghost !py-1.5 text-sm">
          <Plus className="h-4 w-4" /> Otro producto
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl bg-surface-2 p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          <span className="text-ink-muted">Total de la compra: </span>
          <span className="font-display text-lg font-bold tabular-nums text-ink">{formatMoney(total)}</span>
        </div>
        {hasCaja && (
          <label className={`flex items-center gap-2 text-sm ${cajaAbierta ? "text-ink-soft" : "text-ink-faint"}`}>
            <input
              type="checkbox"
              checked={payFromCash}
              disabled={!cajaAbierta}
              onChange={(e) => setPayFromCash(e.target.checked)}
            />
            Pagado con la plata de la caja
            {!cajaAbierta && <span className="text-xs">(no hay caja abierta)</span>}
          </label>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {result.error && <p className="mr-auto text-sm text-rose-600">{result.error}</p>}
        {result.ok && (
          <p className="mr-auto inline-flex items-center gap-1 text-sm font-medium text-brand-700 dark:text-brand-300">
            <CheckCircle2 className="h-4 w-4" /> {result.message}
          </p>
        )}
        <button onClick={submit} disabled={pending} className="btn-primary">
          <PackagePlus className="h-4 w-4" /> {pending ? "Guardando…" : "Cargar al stock"}
        </button>
      </div>
    </div>
  );
}

// --- Reponer ------------------------------------------------------------------------

function ReponerTab({ items, businessName }: { items: StockItemRow[]; businessName: string }) {
  const [copied, setCopied] = useState(false);

  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center px-6 py-14 text-center">
        <CheckCircle2 className="mb-3 h-10 w-10 text-brand-600" />
        <h3 className="font-display text-base font-bold text-ink">No hay nada para reponer</h3>
        <p className="mt-1 max-w-sm text-sm text-ink-muted">
          Cuando un producto baje de su mínimo o se quede sin stock, aparece acá.
        </p>
      </div>
    );
  }

  // El pedido sale listo para pegar en el WhatsApp del proveedor.
  const pedido = [
    `Hola! Te paso el pedido de ${businessName}:`,
    ...items.map((i) => `• ${i.name}: ${Math.max(suggestedReorder(i.stock, i.minStock), 1)} u.`),
    "Gracias!",
  ].join("\n");

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <ul className="divide-y divide-line-soft">
          {items.map((i) => {
            const level = stockLevel(i.stock, i.minStock);
            return (
              <li key={i.id} className="flex items-center gap-3 px-4 py-3">
                <AlertTriangle className={`h-4 w-4 shrink-0 ${level === "sin-stock" ? "text-rose-600" : "text-amber-600"}`} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-ink">{i.name}</div>
                  <div className="text-xs text-ink-muted">
                    Hay {i.stock}
                    {i.minStock !== null ? ` · mínimo ${i.minStock}` : ""} · {i.sold30} vendidos en 30 días
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-bold tabular-nums text-ink">
                    {Math.max(suggestedReorder(i.stock, i.minStock), 1)} u.
                  </div>
                  <div className="text-[11px] text-ink-muted">sugerido</div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="card p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <ClipboardList className="h-4 w-4 text-brand-600" /> Pedido para el proveedor
          </h3>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(pedido);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            }}
            className="btn-secondary !py-1.5 text-xs"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
        <pre className="whitespace-pre-wrap rounded-lg bg-surface-2 p-3 font-sans text-sm text-ink-soft">{pedido}</pre>
        <p className="mt-2 text-xs text-ink-muted">
          La cantidad sugerida deja el doble del mínimo. Ajustala antes de mandarlo.
        </p>
      </div>
    </div>
  );
}

// --- Movimientos ------------------------------------------------------------------

function MovimientosTab({ movements }: { movements: StockMovementRow[] }) {
  if (movements.length === 0) {
    return (
      <div className="card flex flex-col items-center px-6 py-14 text-center">
        <History className="mb-3 h-10 w-10 text-ink-faint" />
        <p className="text-sm text-ink-muted">Todavía no hay movimientos de stock.</p>
      </div>
    );
  }
  return (
    <div className="card overflow-hidden">
      <ul className="divide-y divide-line-soft">
        {movements.map((m) => (
          <li key={m.id} className="flex items-center gap-3 px-4 py-2.5">
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                m.quantity >= 0
                  ? "bg-brand-500/12 text-brand-700 dark:text-brand-300"
                  : "bg-rose-500/10 text-rose-600"
              }`}
            >
              {m.quantity >= 0 ? <PackagePlus className="h-4 w-4" /> : <PackageMinus className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-ink">{m.serviceName}</div>
              <div className="truncate text-xs text-ink-muted">
                {stockKindLabel(m.kind)} · {formatDate(m.createdAt)} {formatTime(m.createdAt)}
                {m.supplier ? ` · ${m.supplier}` : ""}
                {m.unitCost !== null && m.kind === "compra" ? ` · ${formatMoney(m.unitCost)} c/u` : ""}
                {m.paidFromCash ? " · pagado con la caja" : ""}
                {m.note ? ` · ${m.note}` : ""}
              </div>
            </div>
            <div className="text-right">
              <div className={`font-bold tabular-nums ${m.quantity >= 0 ? "text-brand-700 dark:text-brand-300" : "text-rose-600"}`}>
                {m.quantity > 0 ? "+" : ""}
                {m.quantity}
              </div>
              <div className="text-[11px] tabular-nums text-ink-muted">quedan {m.stockAfter}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

