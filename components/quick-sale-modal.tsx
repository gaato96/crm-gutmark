"use client";

import { useEffect, useRef, useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Search,
  UserPlus,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ShoppingBag,
  Phone,
} from "lucide-react";
import {
  searchCustomers,
  quickSale,
  quickNewCustomerSale,
  CustomerSearchResult,
} from "@/app/actions";
import { Avatar } from "@/components/ui";

type Stage = "pick" | "amount" | "new-customer" | "done";

function money(n: string) {
  const digits = n.replace(/[^\d]/g, "");
  if (!digits) return "";
  return new Intl.NumberFormat("es-AR").format(Number(digits));
}

export function QuickSaleModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("pick");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [selected, setSelected] = useState<CustomerSearchResult | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [doneMessage, setDoneMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const searchRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const newNameRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    setStage("pick");
    setQuery("");
    setResults([]);
    setHighlight(0);
    setSelected(null);
    setAmount("");
    setDescription("");
    setNewName("");
    setNewPhone("");
    setError("");
    setDoneMessage("");
  }, []);

  function handleClose() {
    onClose();
    setTimeout(reset, 200);
  }

  // Cargar resultados iniciales / al tipear (debounce)
  useEffect(() => {
    if (!open || stage !== "pick") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearching(true);
    debounceRef.current = setTimeout(() => {
      searchCustomers(query).then((r) => {
        setResults(r);
        setHighlight(0);
        setSearching(false);
      });
    }, 180);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open, stage]);

  useEffect(() => {
    if (open && stage === "pick") {
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open, stage]);

  useEffect(() => {
    if (stage === "amount") {
      requestAnimationFrame(() => amountRef.current?.focus());
    }
    if (stage === "new-customer") {
      requestAnimationFrame(() => newNameRef.current?.focus());
    }
  }, [stage]);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function pickCustomer(c: CustomerSearchResult) {
    setSelected(c);
    setStage("amount");
  }

  function onSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[highlight]) pickCustomer(results[highlight]);
    }
  }

  function submitAmount(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const cents = Number(amount.replace(/[^\d]/g, ""));
    if (!cents) {
      setError("Ingresá un monto.");
      return;
    }
    setError("");
    startTransition(async () => {
      try {
        const res = await quickSale(selected.id, cents, description);
        setDoneMessage(`Venta registrada a ${res.customerName.split(" ")[0]}`);
        setStage("done");
        router.refresh();
      } catch {
        setError("No se pudo registrar la venta. Intentá de nuevo.");
      }
    });
  }

  function submitNewCustomer(e: React.FormEvent) {
    e.preventDefault();
    const cents = Number(amount.replace(/[^\d]/g, ""));
    if (!newName.trim()) {
      setError("Ingresá el nombre del cliente.");
      return;
    }
    if (!cents) {
      setError("Ingresá un monto.");
      return;
    }
    setError("");
    startTransition(async () => {
      try {
        const res = await quickNewCustomerSale({
          name: newName,
          phone: newPhone,
          amount: cents,
          description,
        });
        setDoneMessage(`${res.customerName.split(" ")[0]} agregado con su primera compra`);
        setStage("done");
        router.refresh();
      } catch {
        setError("No se pudo guardar. Revisá los datos e intentá de nuevo.");
      }
    });
  }

  function registerAnother() {
    reset();
    requestAnimationFrame(() => searchRef.current?.focus());
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[10vh] sm:items-center sm:pt-0">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface shadow-pop animate-scale-in">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-line-soft px-5 py-4">
          {stage === "amount" && (
            <button
              onClick={() => {
                setStage("pick");
                setError("");
              }}
              className="rounded-lg p-1 text-ink-muted transition hover:bg-surface-2 hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-500/10 text-brand-600">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <h2 className="flex-1 text-sm font-bold text-ink">
            {stage === "pick" && "Nueva venta"}
            {stage === "amount" && selected?.name}
            {stage === "new-customer" && "Cliente nuevo + venta"}
            {stage === "done" && "¡Listo!"}
          </h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-2 hover:text-ink"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* STAGE: buscar / elegir cliente */}
        {stage === "pick" && (
          <div>
            <div className="relative border-b border-line-soft p-3">
              <Search className="pointer-events-none absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onSearchKeyDown}
                placeholder="Buscar cliente por nombre o teléfono…"
                className="w-full rounded-lg border-0 bg-transparent py-2 pl-8 pr-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500/40"
              />
            </div>

            <div className="max-h-72 overflow-y-auto p-2">
              {searching ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-ink-faint" />
                </div>
              ) : results.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-ink-muted">
                  {query ? "Sin resultados." : "Empezá a escribir para buscar."}
                </p>
              ) : (
                results.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => pickCustomer(c)}
                    onMouseEnter={() => setHighlight(i)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                      highlight === i ? "bg-brand-500/10" : "hover:bg-surface-2"
                    }`}
                  >
                    <Avatar name={c.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink">{c.name}</div>
                      <div className="truncate text-xs text-ink-muted">
                        {c.phone || c.email || "Sin contacto"}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="border-t border-line-soft p-2">
              <button
                onClick={() => setStage("new-customer")}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-surface-2"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold-500/15 text-gold-600">
                  <UserPlus className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold text-ink">
                  Cliente nuevo{query ? `: "${query}"` : ""}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* STAGE: monto para cliente existente */}
        {stage === "amount" && selected && (
          <form onSubmit={submitAmount} className="p-5">
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-surface-2 p-3">
              <Avatar name={selected.name} />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-ink">{selected.name}</div>
                <div className="truncate text-xs text-ink-muted">
                  {selected.phone || selected.email || "Sin contacto"}
                </div>
              </div>
            </div>

            <label className="label">Monto de la venta</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-faint">
                $
              </span>
              <input
                ref={amountRef}
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(money(e.target.value))}
                placeholder="0"
                className="input pl-7 text-lg font-bold tabular-nums"
              />
            </div>

            <label className="label mt-3">Detalle (opcional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Perfume + crema"
              className="input"
            />

            {error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}

            <button type="submit" disabled={isPending} className="btn-primary mt-5 w-full">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
              Registrar venta
            </button>
          </form>
        )}

        {/* STAGE: cliente nuevo + venta */}
        {stage === "new-customer" && (
          <form onSubmit={submitNewCustomer} className="p-5">
            <label className="label">Nombre *</label>
            <input
              ref={newNameRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre del cliente"
              className="input"
            />

            <label className="label mt-3">Teléfono (opcional)</label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="5493810000000"
                inputMode="tel"
                className="input pl-9"
              />
            </div>

            <label className="label mt-3">Monto de la venta</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-faint">
                $
              </span>
              <input
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(money(e.target.value))}
                placeholder="0"
                className="input pl-7 text-lg font-bold tabular-nums"
              />
            </div>

            {error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setStage("pick")}
                className="btn-secondary"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button type="submit" disabled={isPending} className="btn-primary flex-1">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Guardar y registrar venta
              </button>
            </div>
          </form>
        )}

        {/* STAGE: listo */}
        {stage === "done" && (
          <div className="px-6 py-10 text-center animate-fade-in">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/10 text-brand-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <p className="font-semibold text-ink">{doneMessage}</p>
            <div className="mt-6 flex justify-center gap-2">
              <button onClick={handleClose} className="btn-secondary">
                Cerrar
              </button>
              <button onClick={registerAnother} className="btn-primary">
                Registrar otra venta
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
