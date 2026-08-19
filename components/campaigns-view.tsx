"use client";

import { useCallback, useState } from "react";
import {
  Plus,
  Pencil,
  Copy,
  Trash2,
  Play,
  Pause,
  Users2,
  Sparkles,
  Lock,
} from "lucide-react";
import { CampaignComposer, type Audience } from "./campaign-composer";
import {
  CampaignEditor,
  type CampaignItem,
  type CampaignService,
} from "./campaign-editor";
import {
  toggleCampaign,
  deleteCampaign,
  duplicateCampaign,
} from "@/app/campaign-actions";

type Tab = "enviar" | "campanas";

export function CampaignsView({
  audiences,
  campaigns,
  services,
}: {
  audiences: Audience[];
  campaigns: CampaignItem[];
  services: CampaignService[];
}) {
  const [tab, setTab] = useState<Tab>("enviar");
  // null = cerrado, "new" = alta, un id = edición de esa campaña.
  const [editing, setEditing] = useState<string | null>(null);

  const closeEditor = useCallback(() => setEditing(null), []);

  const editingCampaign =
    editing && editing !== "new" ? campaigns.find((c) => c.id === editing) ?? null : null;

  return (
    <div>
      <div className="mb-5 inline-flex rounded-xl bg-surface-2 p-1">
        <TabButton on={tab === "enviar"} onClick={() => setTab("enviar")}>
          Enviar
        </TabButton>
        <TabButton on={tab === "campanas"} onClick={() => setTab("campanas")}>
          Mis campañas
          <span className="ml-1.5 rounded-full bg-surface px-1.5 text-xs font-bold text-ink-muted">
            {campaigns.length}
          </span>
        </TabButton>
      </div>

      {tab === "enviar" ? (
        audiences.length === 0 ? (
          <EmptyState onCreate={() => { setTab("campanas"); setEditing("new"); }} />
        ) : (
          <CampaignComposer audiences={audiences} />
        )
      ) : (
        <div>
          {editing && (
            <CampaignEditor
              campaign={editingCampaign}
              services={services}
              onClose={closeEditor}
            />
          )}

          {!editing && (
            <div className="mb-4 flex justify-end">
              <button onClick={() => setEditing("new")} className="btn-primary">
                <Plus className="h-4 w-4" /> Nueva campaña
              </button>
            </div>
          )}

          <div className="grid gap-3 lg:grid-cols-2">
            {campaigns.map((c) => (
              <CampaignCard key={c.id} c={c} onEdit={() => setEditing(c.id)} />
            ))}
          </div>
        </div>
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
      className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition ${
        on ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink-soft"
      }`}
    >
      {children}
    </button>
  );
}

function CampaignCard({ c, onEdit }: { c: CampaignItem; onEdit: () => void }) {
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`card p-5 ${c.active ? "" : "opacity-70"}`}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-display font-bold text-ink">{c.name}</h3>
            {c.builtin && (
              <span className="badge bg-accent-500/15 text-accent-700 ring-accent-500/25 dark:text-accent-300">
                <Lock className="h-3 w-3" /> De fábrica
              </span>
            )}
            <span
              className={`badge ${
                c.active
                  ? "bg-brand-500/15 text-brand-700 ring-brand-500/25 dark:text-brand-300"
                  : "bg-ink-muted/15 text-ink-muted ring-ink-muted/25"
              }`}
            >
              {c.active ? "Activa" : "Pausada"}
            </span>
          </div>
          {c.description && (
            <p className="mt-1 text-sm text-ink-muted">{c.description}</p>
          )}
        </div>
      </div>

      <p className="mb-3 flex items-center gap-1.5 text-sm text-ink-soft">
        <Users2 className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
        {c.triggerLabel}
      </p>

      <p className="mb-4 text-sm">
        <span className="font-display text-lg font-bold text-brand-700 dark:text-brand-300">
          {c.reach}
        </span>{" "}
        <span className="text-ink-muted">
          {c.reach === 1 ? "cliente entra hoy" : "clientes entran hoy"}
        </span>
      </p>

      <div className="flex flex-wrap gap-2">
        <button onClick={onEdit} disabled={busy} className="btn-secondary !py-2 text-xs">
          <Pencil className="h-3.5 w-3.5" /> Editar
        </button>
        <button
          onClick={() => run(() => toggleCampaign(c.id, !c.active))}
          disabled={busy}
          className="btn-secondary !py-2 text-xs"
        >
          {c.active ? (
            <>
              <Pause className="h-3.5 w-3.5" /> Pausar
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" /> Activar
            </>
          )}
        </button>
        <button
          onClick={() => run(() => duplicateCampaign(c.id))}
          disabled={busy}
          className="btn-ghost !py-2 text-xs"
        >
          <Copy className="h-3.5 w-3.5" /> Duplicar
        </button>
        {!c.builtin && (
          <button
            onClick={() => {
              if (confirm(`¿Borrar la campaña “${c.name}”? No se puede deshacer.`)) {
                run(() => deleteCampaign(c.id));
              }
            }}
            disabled={busy}
            className="btn-ghost !py-2 text-xs text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
          >
            <Trash2 className="h-3.5 w-3.5" /> Borrar
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="card flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/10 text-brand-600">
        <Sparkles className="h-7 w-7" />
      </div>
      <h3 className="font-display text-base font-bold text-ink">No hay campañas activas</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">
        Creá una campaña o activá alguna de las que ya tenés para ver acá a quién podés
        contactar.
      </p>
      <button onClick={onCreate} className="btn-primary mt-5">
        <Plus className="h-4 w-4" /> Crear una campaña
      </button>
    </div>
  );
}
