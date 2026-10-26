"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  MessageCircle,
  Check,
  CalendarClock,
  PhoneCall,
  Plus,
  Pencil,
  Trash2,
  X,
  Sparkles,
  Send,
  KeyRound,
  Copy,
  Star,
  Clock,
} from "lucide-react";
import {
  addAdminNote,
  snoozeFollowUp,
  saveAdminCampaign,
  toggleAdminCampaign,
  deleteAdminCampaign,
  createSuggestedAdminCampaigns,
  markAdminCampaignSent,
  updateBusinessCrm,
  deleteAdminNote,
  generateResetLink,
  updateFollowUpDays,
  type CrmFormState,
} from "@/app/admin-crm-actions";
import {
  ADMIN_AUDIENCES,
  ADMIN_VARIABLES,
  CRM_STAGES,
  NOTE_KINDS,
  HEALTH_META,
  audienceLabel,
  noteKindLabel,
  renderAdminMessage,
  type Health,
} from "@/lib/admin-crm-meta";
import { formatDate } from "@/lib/format";
import { SubmitButton } from "./submit-button";

const EMPTY: CrmFormState = {};

function waLink(phone: string | null, text: string): string | null {
  return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : null;
}

// --- Para contactar hoy ------------------------------------------------------------

export interface FollowUpRow {
  id: string;
  name: string;
  ownerName: string | null;
  phone: string | null; // ya normalizado para wa.me
  health: Health;
  reasons: string[];
  lastContactAt: string | null;
  isFounder: boolean;
  defaultMessage: string;
}

export function FollowUpList({ rows }: { rows: FollowUpRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="card px-5 py-8 text-center text-sm text-ink-muted">
        No hay negocios para contactar hoy. Cada contacto que registrás agenda el siguiente solo.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <FollowUpItem key={r.id} row={r} />
      ))}
    </ul>
  );
}

function FollowUpItem({ row }: { row: FollowUpRow }) {
  const [logging, setLogging] = useState(false);
  const [pending, startTransition] = useTransition();
  const h = HEALTH_META[row.health];
  const wa = waLink(row.phone, row.defaultMessage);

  return (
    <li className="card p-4">
      <div className="flex flex-wrap items-start gap-3">
        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${h.dot}`} title={h.label} />
        <div className="min-w-0 flex-1">
          <Link href={`/admin/negocios/${row.id}`} className="inline-flex items-center gap-1.5 font-semibold text-ink hover:underline">
            {row.isFounder && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />}
            {row.name}
          </Link>
          <div className="text-xs text-ink-muted">
            {row.ownerName ?? "Sin nombre"} · último contacto {row.lastContactAt ? formatDate(row.lastContactAt) : "nunca"}
          </div>
          {row.reasons.length > 0 && (
            <div className="mt-1 text-xs text-ink-soft">{row.reasons.join(" · ")}</div>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {wa ? (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-secondary !py-1.5 text-xs" onClick={() => setLogging(true)}>
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
          ) : (
            <span className="self-center text-xs text-ink-faint" title="Cargá el teléfono en la ficha del negocio">
              Sin teléfono
            </span>
          )}
          <button onClick={() => setLogging((v) => !v)} className="btn-primary !py-1.5 text-xs">
            <PhoneCall className="h-3.5 w-3.5" /> Registrar contacto
          </button>
          <button
            disabled={pending}
            onClick={() => startTransition(() => snoozeFollowUp(row.id, 3))}
            className="btn-ghost !py-1.5 text-xs"
            title="Volver a mostrarlo en 3 días"
          >
            <Clock className="h-3.5 w-3.5" /> En 3 días
          </button>
        </div>
      </div>
      {logging && <NoteForm businessId={row.id} defaultKind="whatsapp" onDone={() => setLogging(false)} compact />}
    </li>
  );
}

// --- Notas -------------------------------------------------------------------------

export function NoteForm({
  businessId,
  defaultKind = "nota",
  onDone,
  compact = false,
}: {
  businessId: string;
  defaultKind?: string;
  onDone?: () => void;
  compact?: boolean;
}) {
  const [state, action] = useActionState(addAdminNote.bind(null, businessId), EMPTY);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (!state.ok) return;
    setKey((k) => k + 1);
    onDone?.();
  }, [state, onDone]);

  return (
    <form key={key} action={action} className={`${compact ? "mt-3 border-t border-line-soft pt-3" : ""} space-y-2`}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select name="kind" defaultValue={defaultKind} className="input sm:!w-40">
          {NOTE_KINDS.filter((k) => k.code !== "campana").map((k) => (
            <option key={k.code} value={k.code}>
              {k.label}
            </option>
          ))}
        </select>
        <input name="body" required maxLength={4000} placeholder="Qué hablaron, qué quedó pendiente…" className="input flex-1" />
        <SubmitButton className="btn-primary shrink-0">Guardar</SubmitButton>
      </div>
      {state.error && <p className="text-sm text-rose-600">{state.error}</p>}
      <p className="text-xs text-ink-muted">Una llamada, WhatsApp, email o reunión agenda el próximo seguimiento solo.</p>
    </form>
  );
}

export interface NoteRow {
  id: string;
  kind: string;
  body: string;
  createdAt: string;
}

export function NotesTimeline({ businessId, notes }: { businessId: string; notes: NoteRow[] }) {
  const [pending, startTransition] = useTransition();
  if (notes.length === 0) return <p className="py-4 text-sm text-ink-muted">Todavía no hay notas ni contactos.</p>;
  return (
    <ol className="space-y-3">
      {notes.map((n) => (
        <li key={n.id} className="group flex gap-3">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent-500" />
          <div className="min-w-0 flex-1">
            <div className="text-xs text-ink-muted">
              <span className="font-semibold text-ink-soft">{noteKindLabel(n.kind)}</span> · {formatDate(n.createdAt)}
            </div>
            <p className="whitespace-pre-wrap text-sm text-ink">{n.body}</p>
          </div>
          <button
            disabled={pending}
            onClick={() => {
              if (confirm("¿Borrar esta nota?")) startTransition(() => deleteAdminNote(n.id, businessId));
            }}
            className="self-start text-ink-faint opacity-0 transition hover:text-rose-600 group-hover:opacity-100"
            aria-label="Borrar nota"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </li>
      ))}
    </ol>
  );
}

// --- Ficha del negocio: datos del CRM ---------------------------------------------

export function BusinessCrmForm({
  businessId,
  data,
}: {
  businessId: string;
  data: {
    crmStage: string;
    isFounder: boolean;
    trialEndsAt: string | null;
    nextFollowUpAt: string | null;
    phone: string | null;
  };
}) {
  const [state, action] = useActionState(updateBusinessCrm.bind(null, businessId), EMPTY);
  const day = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Etapa</label>
          <select name="crmStage" defaultValue={data.crmStage} className="input">
            {CRM_STAGES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">WhatsApp del dueño</label>
          <input name="phone" type="tel" defaultValue={data.phone ?? ""} className="input" placeholder="11 5555-5555" />
        </div>
        <div>
          <label className="label">Fin de la prueba</label>
          <input name="trialEndsAt" type="date" defaultValue={day(data.trialEndsAt)} className="input" />
        </div>
        <div>
          <label className="label">Próximo seguimiento</label>
          <input name="nextFollowUpAt" type="date" defaultValue={day(data.nextFollowUpAt)} className="input" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input type="checkbox" name="isFounder" defaultChecked={data.isFounder} /> Negocio fundador
      </label>
      <div className="flex items-center justify-end gap-3">
        {state.error && <span className="text-sm text-rose-600">{state.error}</span>}
        {state.ok && (
          <span className="inline-flex items-center gap-1 text-sm text-brand-700 dark:text-brand-300">
            <Check className="h-4 w-4" /> Guardado
          </span>
        )}
        <SubmitButton className="btn-primary !py-2 text-sm">Guardar</SubmitButton>
      </div>
    </form>
  );
}

export function ResetLinkButton({ businessId }: { businessId: string }) {
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <div className="space-y-2">
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await generateResetLink(businessId);
            setError(r.error ?? "");
            setLink(r.link ?? null);
          })
        }
        className="btn-secondary !py-2 text-sm"
      >
        <KeyRound className="h-4 w-4" /> {pending ? "Generando…" : "Link para cambiar la contraseña"}
      </button>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {link && (
        <div className="rounded-xl bg-surface-2 p-3">
          <p className="mb-1.5 text-xs text-ink-muted">Vale 24 horas y una sola vez. Mandáselo al dueño por WhatsApp.</p>
          <div className="flex gap-2">
            <input readOnly value={link} className="input flex-1 font-mono !text-xs" onFocus={(e) => e.currentTarget.select()} />
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(link);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="btn-secondary shrink-0 !px-3"
              aria-label="Copiar link"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Campañas del equipo ------------------------------------------------------------

export interface AdminCampaignRow {
  id: string;
  name: string;
  audience: string;
  message: string;
  everyDays: number;
  active: boolean;
  sentCount: number;
  pending: {
    businessId: string;
    name: string;
    phone: string | null;
    lastSentAt: string | null;
    vars: Record<string, string>;
  }[];
}

export function AdminCampaigns({ campaigns }: { campaigns: AdminCampaignRow[] }) {
  const [open, setOpen] = useState<string | null>(campaigns.find((c) => c.active && c.pending.length)?.id ?? null);
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      {editing && (
        <CampaignEditor
          campaign={editing === "new" ? null : campaigns.find((c) => c.id === editing) ?? null}
          onClose={() => setEditing(null)}
        />
      )}
      <div className="flex flex-wrap gap-2">
        {!editing && (
          <button onClick={() => setEditing("new")} className="btn-primary !py-2 text-sm">
            <Plus className="h-4 w-4" /> Nueva campaña
          </button>
        )}
        <button
          disabled={pending}
          onClick={() => startTransition(async () => void (await createSuggestedAdminCampaigns()))}
          className="btn-secondary !py-2 text-sm"
        >
          <Sparkles className="h-4 w-4" /> {campaigns.length ? "Sumar las sugeridas que falten" : "Crear campañas sugeridas"}
        </button>
      </div>

      {campaigns.length === 0 && !editing && (
        <p className="card px-5 py-8 text-center text-sm text-ink-muted">
          Armá mensajes para tus negocios — el seguimiento de cada 14 días, el rescate de los que dejaron
          de usarlo, el pedido de testimonio — y el sistema te dice a quién le toca cada uno.
        </p>
      )}

      {campaigns.map((c) => (
        <div key={c.id} className={`card overflow-hidden ${c.active ? "" : "opacity-60"}`}>
          <button
            onClick={() => setOpen(open === c.id ? null : c.id)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2"
          >
            <Send className="h-4 w-4 shrink-0 text-accent-600 dark:text-accent-300" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-ink">{c.name}</div>
              <div className="text-xs text-ink-muted">
                {audienceLabel(c.audience)} · cada {c.everyDays} días · {c.sentCount} enviados
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${
                c.pending.length ? "bg-accent-500/15 text-accent-700 dark:text-accent-300" : "bg-brand-500/15 text-brand-700 dark:text-brand-300"
              }`}
            >
              {c.pending.length ? `${c.pending.length} por enviar` : "Al día"}
            </span>
          </button>
          {open === c.id && (
            <div className="border-t border-line-soft px-4 py-3">
              <p className="mb-3 whitespace-pre-wrap rounded-xl bg-surface-2 p-3 text-sm text-ink-soft">{c.message}</p>
              {c.pending.length === 0 ? (
                <p className="text-sm text-ink-muted">Todos los de esta audiencia ya recibieron el mensaje en los últimos {c.everyDays} días.</p>
              ) : (
                <ul className="divide-y divide-line-soft">
                  {c.pending.map((p) => (
                    <PendingSend key={p.businessId} campaignId={c.id} template={c.message} row={p} />
                  ))}
                </ul>
              )}
              <div className="mt-3 flex flex-wrap gap-2 border-t border-line-soft pt-3">
                <button onClick={() => setEditing(c.id)} className="btn-ghost !py-1.5 text-xs">
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </button>
                <button
                  disabled={pending}
                  onClick={() => startTransition(() => toggleAdminCampaign(c.id, !c.active))}
                  className="btn-ghost !py-1.5 text-xs"
                >
                  {c.active ? "Pausar" : "Activar"}
                </button>
                <button
                  disabled={pending}
                  onClick={() => {
                    if (confirm(`¿Borrar "${c.name}"? El historial de envíos queda en cada negocio.`)) {
                      startTransition(() => deleteAdminCampaign(c.id));
                    }
                  }}
                  className="btn-ghost !py-1.5 text-xs text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Borrar
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PendingSend({
  campaignId,
  template,
  row,
}: {
  campaignId: string;
  template: string;
  row: AdminCampaignRow["pending"][number];
}) {
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const text = renderAdminMessage(template, row.vars);
  const wa = waLink(row.phone, text);
  const mark = () => {
    setDone(true);
    startTransition(() => markAdminCampaignSent(campaignId, row.businessId, text));
  };

  return (
    <li className={`py-3 ${done ? "opacity-50" : ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/admin/negocios/${row.businessId}`} className="font-semibold text-ink hover:underline">
          {row.name}
        </Link>
        <span className="text-xs text-ink-muted">
          {row.lastSentAt ? `último envío ${formatDate(row.lastSentAt)}` : "nunca recibió esta campaña"}
        </span>
        <div className="ml-auto flex gap-1.5">
          {wa ? (
            <a href={wa} target="_blank" rel="noopener noreferrer" onClick={mark} className="btn-primary !py-1.5 text-xs">
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
          ) : (
            <span className="self-center text-xs text-ink-faint">Sin teléfono</span>
          )}
          <button disabled={pending || done} onClick={mark} className="btn-secondary !py-1.5 text-xs">
            <Check className="h-3.5 w-3.5" /> {done ? "Enviado" : "Ya lo envié"}
          </button>
        </div>
      </div>
      <p className="mt-1 text-sm text-ink-soft">{text}</p>
    </li>
  );
}

function CampaignEditor({ campaign, onClose }: { campaign: AdminCampaignRow | null; onClose: () => void }) {
  const [state, action] = useActionState(saveAdminCampaign.bind(null, campaign?.id ?? null), EMPTY);
  const [message, setMessage] = useState(campaign?.message ?? "");
  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <form action={action} className="card space-y-3 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-ink">{campaign ? `Editar ${campaign.name}` : "Nueva campaña a negocios"}</h3>
        <button type="button" onClick={onClose} className="btn-ghost !p-2" aria-label="Cerrar">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-[2fr_2fr_1fr]">
        <div>
          <label className="label">Nombre</label>
          <input name="name" defaultValue={campaign?.name ?? ""} required maxLength={80} className="input" placeholder="Seguimiento quincenal" />
        </div>
        <div>
          <label className="label">A quién</label>
          <select name="audience" defaultValue={campaign?.audience ?? "todos"} className="input">
            {ADMIN_AUDIENCES.map((a) => (
              <option key={a.code} value={a.code} title={a.hint}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Cada (días)</label>
          <input name="everyDays" type="number" min={1} max={365} defaultValue={campaign?.everyDays ?? 14} className="input" />
        </div>
      </div>
      <div>
        <label className="label">Mensaje</label>
        <textarea
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          required
          maxLength={2000}
          className="input resize-y"
        />
        <div className="mt-1.5 flex flex-wrap gap-1">
          {ADMIN_VARIABLES.map((v) => (
            <button
              type="button"
              key={v.key}
              title={v.hint}
              onClick={() => setMessage((m) => `${m}{${v.key}}`)}
              className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-ink-soft ring-1 ring-line hover:bg-surface-3"
            >
              {`{${v.key}}`}
            </button>
          ))}
        </div>
      </div>
      {state.error && <p className="text-sm text-rose-600">{state.error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="btn-secondary">
          Cancelar
        </button>
        <SubmitButton className="btn-primary">{campaign ? "Guardar" : "Crear campaña"}</SubmitButton>
      </div>
    </form>
  );
}

export function FollowUpDaysSetting({ days }: { days: number }) {
  const [value, setValue] = useState(days);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-2 text-sm text-ink-soft">
      <CalendarClock className="h-4 w-4 text-ink-muted" />
      Contactar a cada negocio cada
      <input
        type="number"
        min={1}
        max={90}
        value={value}
        onChange={(e) => setValue(parseInt(e.target.value, 10) || 14)}
        className="input !w-16 !px-2 !py-1 text-center"
      />
      días
      {value !== days && (
        <button disabled={pending} onClick={() => startTransition(() => updateFollowUpDays(value))} className="btn-secondary !py-1 text-xs">
          Guardar
        </button>
      )}
    </div>
  );
}
