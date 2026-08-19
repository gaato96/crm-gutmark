"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Tags, RotateCcw, EyeOff, Eye } from "lucide-react";
import {
  createService,
  updateService,
  toggleService,
  deleteService,
  type ServiceFormState,
} from "@/app/service-actions";
import { formatMoney } from "@/lib/format";
import { catalogWords, ITEM_KINDS, itemKindLabel, defaultItemKind } from "@/lib/rubros";
import { SubmitButton } from "./submit-button";

export interface ServiceItem {
  id: string;
  name: string;
  kind: string;
  description: string;
  price: number;
  category: string;
  recompraDays: number | null;
  active: boolean;
  timesSold: number;
}

const EMPTY: ServiceFormState = {};

export function ServicesView({
  services,
  recompraDaysDefault,
  catalogMode,
}: {
  services: ServiceItem[];
  recompraDaysDefault: number;
  catalogMode: string;
}) {
  const words = catalogWords(catalogMode);
  const [editing, setEditing] = useState<string | null>(null);
  const close = useCallback(() => setEditing(null), []);

  const current =
    editing && editing !== "new" ? services.find((s) => s.id === editing) ?? null : null;

  const activos = services.filter((s) => s.active);
  const inactivos = services.filter((s) => !s.active);

  return (
    <div>
      {editing && (
        <ServiceEditor
          service={current}
          recompraDaysDefault={recompraDaysDefault}
          catalogMode={catalogMode}
          onClose={close}
        />
      )}

      {!editing && (
        <div className="mb-4 flex justify-end">
          <button onClick={() => setEditing("new")} className="btn-primary">
            <Plus className="h-4 w-4" /> {words.nuevo}
          </button>
        </div>
      )}

      {services.length === 0 && !editing ? (
        <EmptyState words={words} onCreate={() => setEditing("new")} />
      ) : (
        <div className="space-y-6">
          {activos.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activos.map((s) => (
                <ServiceCard
                  key={s.id}
                  s={s}
                  recompraDaysDefault={recompraDaysDefault}
                  catalogMode={catalogMode}
                  onEdit={() => setEditing(s.id)}
                />
              ))}
            </div>
          )}

          {inactivos.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-ink-muted">
                Desactivados — no aparecen al vender
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {inactivos.map((s) => (
                  <ServiceCard
                    key={s.id}
                    s={s}
                    recompraDaysDefault={recompraDaysDefault}
                    catalogMode={catalogMode}
                    onEdit={() => setEditing(s.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ServiceCard({
  s,
  recompraDaysDefault,
  catalogMode,
  onEdit,
}: {
  s: ServiceItem;
  recompraDaysDefault: number;
  catalogMode: string;
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

  const soldLabel =
    s.timesSold === 0
      ? "Todavía no se vendió"
      : `Vendido ${s.timesSold} ${s.timesSold === 1 ? "vez" : "veces"}`;

  return (
    <div className={`card p-4 ${s.active ? "" : "opacity-70"}`}>
      <div className="mb-1 flex items-start justify-between gap-2">
        <h3 className="min-w-0 flex-1 truncate font-display font-bold text-ink">{s.name}</h3>
        <span className="shrink-0 font-display font-bold text-brand-700 dark:text-brand-300">
          {formatMoney(s.price)}
        </span>
      </div>

      <div className="mb-2 flex flex-wrap gap-1.5">
        {catalogMode === "ambos" && (
          <span
            className={`badge ${
              s.kind === "producto"
                ? "bg-sky-500/15 text-sky-700 ring-sky-500/25 dark:text-sky-300"
                : "bg-accent-500/15 text-accent-700 ring-accent-500/25 dark:text-accent-300"
            }`}
          >
            {itemKindLabel(s.kind)}
          </span>
        )}
        {s.category && (
          <span className="badge bg-surface-2 text-ink-muted ring-line">{s.category}</span>
        )}
      </div>

      {s.description && <p className="mb-2 text-sm text-ink-muted">{s.description}</p>}

      <p className="mb-2 flex items-center gap-1.5 text-xs text-ink-muted">
        <RotateCcw className="h-3.5 w-3.5 shrink-0" />
        {s.recompraDays
          ? `Se repite cada ${s.recompraDays} días`
          : `Sin recompra propia (usa los ${recompraDaysDefault} días generales)`}
      </p>

      <p className="mb-3 text-xs text-ink-faint">{soldLabel}</p>

      {note && <p className="mb-2 text-xs text-amber-700 dark:text-amber-300">{note}</p>}

      <div className="flex flex-wrap gap-2">
        <button onClick={onEdit} disabled={busy} className="btn-secondary !py-1.5 text-xs">
          <Pencil className="h-3.5 w-3.5" /> Editar
        </button>
        <button
          onClick={() => run(() => toggleService(s.id, !s.active))}
          disabled={busy}
          className="btn-ghost !py-1.5 text-xs"
        >
          {s.active ? (
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
            const msg = s.timesSold
              ? `"${s.name}" ya tiene ${s.timesSold} venta(s). Borrarlo perdería ese historial, así que se va a desactivar. ¿Seguimos?`
              : `¿Borrar "${s.name}"? No se puede deshacer.`;
            if (!confirm(msg)) return;
            run(async () => {
              const r = await deleteService(s.id);
              if (r.deactivated) {
                setNote("Tenía ventas asociadas, así que se desactivó en vez de borrarse.");
              }
            });
          }}
          disabled={busy}
          className="btn-ghost !py-1.5 text-xs text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
        >
          <Trash2 className="h-3.5 w-3.5" /> Borrar
        </button>
      </div>
    </div>
  );
}

function ServiceEditor({
  service,
  recompraDaysDefault,
  catalogMode,
  onClose,
}: {
  service: ServiceItem | null;
  recompraDaysDefault: number;
  catalogMode: string;
  onClose: () => void;
}) {
  const words = catalogWords(catalogMode);
  const action = service ? updateService.bind(null, service.id) : createService;
  const [state, formAction] = useActionState(action, EMPTY);

  // Cerrar es actualizar estado del padre: va en un efecto, no en el render.
  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <div className="card mb-6 p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">
            {service ? `Editar ${service.name}` : words.nuevo}
          </h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            El precio queda predefinido para no tipearlo en cada venta.
          </p>
        </div>
        <button onClick={onClose} className="btn-ghost !px-2 !py-2" aria-label="Cerrar">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <div>
            <label className="label" htmlFor="svc-name">
              Nombre
            </label>
            <input
              id="svc-name"
              name="name"
              defaultValue={service?.name ?? ""}
              maxLength={80}
              required
              placeholder={words.ejemplo}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="svc-price">
              Precio
            </label>
            <input
              id="svc-price"
              name="price"
              type="number"
              min={0}
              step="any"
              defaultValue={service?.price ?? ""}
              required
              placeholder="8000"
              className="input"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="svc-category">
              Categoría <span className="font-normal text-ink-faint">(opcional)</span>
            </label>
            <input
              id="svc-category"
              name="category"
              defaultValue={service?.category ?? ""}
              placeholder="Cortes"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="svc-recompra">
              {words.recompraLabel}{" "}
              <span className="font-normal text-ink-faint">(opcional)</span>
            </label>
            <input
              id="svc-recompra"
              name="recompraDays"
              type="number"
              min={1}
              max={3650}
              defaultValue={service?.recompraDays ?? ""}
              placeholder={String(recompraDaysDefault)}
              className="input"
            />
            <p className="mt-1.5 text-xs text-ink-muted">
              {words.recompraHelp} Vacío = usa los {recompraDaysDefault} días
              generales de Configuración.
            </p>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="svc-description">
            Descripción <span className="font-normal text-ink-faint">(opcional)</span>
          </label>
          <input
            id="svc-description"
            name="description"
            defaultValue={service?.description ?? ""}
            className="input"
          />
        </div>

        {state.error && (
          <p className="rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-700 dark:text-rose-300">
            {state.error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <SubmitButton className="btn-primary">
            {service ? "Guardar cambios" : words.nuevo}
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}

function EmptyState({
  words,
  onCreate,
}: {
  words: ReturnType<typeof catalogWords>;
  onCreate: () => void;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/10 text-brand-600">
        <Tags className="h-7 w-7" />
      </div>
      <h3 className="font-display text-base font-bold text-ink">{words.emptyTitle}</h3>
      <p className="mt-1 max-w-md text-sm text-ink-muted">
        {words.emptyText}
      </p>
      <button onClick={onCreate} className="btn-primary mt-5">
        <Plus className="h-4 w-4" /> Cargar el primero
      </button>
    </div>
  );
}
