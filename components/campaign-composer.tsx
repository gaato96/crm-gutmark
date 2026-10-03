"use client";

import { useState } from "react";
import {
  MessageCircle,
  Mail,
  Copy,
  Check,
  Users2,
  CheckCircle2,
  ChevronDown,
  Undo2,
  RotateCw,
  PartyPopper,
  Eye,
  EyeOff,
} from "lucide-react";
import { whatsappLink, mailtoLink } from "@/lib/messages";
import { logContact, undoContact } from "@/app/actions";
import { Avatar } from "@/components/ui";

// Registro de que ya se le escribió en este ciclo. Viene de ContactLog (ver
// contactCoversCycle en lib/campaigns.ts), así que sobrevive a cerrar la
// pestaña o entrar desde otro dispositivo.
export interface SentInfo {
  // null mientras el registro todavía viaja al servidor.
  id: string | null;
  at: string;
  channel: string;
}

export interface Recipient {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  hint?: string;
  sent: SentInfo | null;
  whatsappBody: string;
  emailSubject: string;
  emailBody: string;
}

export interface Audience {
  key: string;
  // Campaña que generó esta audiencia, para poder registrar el contacto.
  campaignId: string;
  label: string;
  description: string;
  recipients: Recipient[];
}

// Cambios hechos en esta visita, por encima de lo que vino del servidor. La
// clave es campaña + cliente: la misma persona puede estar en dos campañas, y
// mandarle el saludo de cumpleaños no la saca de la de recompra.
type Overrides = Record<string, SentInfo | null>;

export function CampaignComposer({ audiences }: { audiences: Audience[] }) {
  const [activeKey, setActiveKey] = useState(audiences[0]?.key ?? "");
  const [overrides, setOverrides] = useState<Overrides>({});
  const active = audiences.find((a) => a.key === activeKey) ?? audiences[0];

  function sentFor(a: Audience, r: Recipient): SentInfo | null {
    const k = `${a.campaignId}:${r.id}`;
    return k in overrides ? overrides[k] : r.sent;
  }

  function setSent(a: Audience, r: Recipient, info: SentInfo | null) {
    setOverrides((prev) => ({ ...prev, [`${a.campaignId}:${r.id}`]: info }));
  }

  return (
    <div>
      {/* Selector de audiencia: el número es lo que FALTA mandar, no el total.
          Cuando no falta nadie, la campaña muestra un tilde. */}
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Campañas activas">
        {audiences.map((a) => {
          const on = a.key === active?.key;
          const pending = a.recipients.filter((r) => !sentFor(a, r)).length;
          const done = a.recipients.length > 0 && pending === 0;
          return (
            <button
              key={a.key}
              role="tab"
              aria-selected={on}
              onClick={() => setActiveKey(a.key)}
              className={`inline-flex min-h-[40px] items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                on
                  ? "bg-accent-600 text-white shadow-sm shadow-accent-600/25"
                  : "bg-surface text-ink-soft ring-1 ring-inset ring-line hover:bg-surface-2"
              }`}
            >
              {a.label}
              {done ? (
                <CheckCircle2
                  aria-label="Todos enviados"
                  className={`h-4 w-4 ${on ? "text-white" : "text-brand-600"}`}
                />
              ) : (
                <span
                  className={`rounded-full px-1.5 text-xs font-bold tabular-nums ${
                    on ? "bg-white/20 text-white" : "bg-surface-2 text-ink-muted"
                  }`}
                  aria-label={`${pending} por enviar`}
                >
                  {pending}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {active && (
        <AudiencePanel
          key={active.key}
          audience={active}
          sentFor={(r) => sentFor(active, r)}
          setSent={(r, info) => setSent(active, r, info)}
        />
      )}
    </div>
  );
}

function AudiencePanel({
  audience,
  sentFor,
  setSent,
}: {
  audience: Audience;
  sentFor: (r: Recipient) => SentInfo | null;
  setSent: (r: Recipient, info: SentInfo | null) => void;
}) {
  const [showSent, setShowSent] = useState(false);
  const pending = audience.recipients.filter((r) => !sentFor(r));
  const sent = audience.recipients.filter((r) => sentFor(r));
  const total = audience.recipients.length;
  const pct = total ? Math.round((sent.length / total) * 100) : 0;

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line-soft bg-surface-2/60 px-5 py-4">
        <div className="flex items-start gap-3">
          <Users2 className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
          <p className="text-sm text-ink-soft">{audience.description}</p>
        </div>
        {total > 0 && (
          <div className="mt-3">
            <div className="mb-1.5 flex items-baseline justify-between text-xs">
              <span className="font-semibold text-ink-soft">
                <span className="tabular-nums text-ink">{sent.length}</span> de{" "}
                <span className="tabular-nums">{total}</span> enviados
              </span>
              <span className="tabular-nums text-ink-muted">{pct}%</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-surface-3"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Avance de la campaña"
            >
              <div
                className="h-full rounded-full bg-brand-500 transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {total === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-ink-muted">
          No hay clientes en esta audiencia por ahora.
        </div>
      ) : pending.length === 0 ? (
        <div className="flex flex-col items-center px-5 py-10 text-center">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/10 text-brand-700 dark:text-brand-300">
            <PartyPopper className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="font-display font-bold text-ink">¡Listo! Le escribiste a todos.</p>
          <p className="mt-1 max-w-sm text-sm text-ink-muted">
            Cuando alguien nuevo entre en esta campaña, aparece acá solo.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line-soft">
          {pending.map((r) => (
            <PendingRow
              key={r.id}
              r={r}
              campaignId={audience.campaignId}
              onSent={(info) => setSent(r, info)}
            />
          ))}
        </ul>
      )}

      {sent.length > 0 && (
        <div className="border-t border-line">
          <button
            onClick={() => setShowSent((s) => !s)}
            aria-expanded={showSent}
            className="flex w-full items-center justify-between px-5 py-3.5 text-left text-sm font-semibold text-ink-soft transition hover:bg-surface-2"
          >
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-brand-600" aria-hidden="true" />
              Enviados
              <span className="rounded-full bg-surface-2 px-1.5 text-xs font-bold tabular-nums text-ink-muted">
                {sent.length}
              </span>
            </span>
            <ChevronDown
              className={`h-4 w-4 text-ink-muted transition-transform ${showSent ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
          {showSent && (
            <ul className="divide-y divide-line-soft bg-surface-2/30">
              {sent.map((r) => (
                <SentRow
                  key={r.id}
                  r={r}
                  info={sentFor(r)!}
                  campaignId={audience.campaignId}
                  onChange={(info) => setSent(r, info)}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// Registra el contacto sin frenar la apertura del chat: el link navega igual.
// Se marca como enviado al instante (optimista) y, si el registro falla, se
// vuelve atrás para no mentir sobre a quién se le escribió.
function markSentHandler(
  r: Recipient,
  campaignId: string,
  onSent: (info: SentInfo | null) => void,
  previous: SentInfo | null = null
) {
  return (channel: string) => {
    onSent({ id: null, at: new Date().toISOString(), channel });
    logContact(r.id, "campaign", channel, campaignId)
      .then((res) => onSent({ id: res.id, at: res.at, channel }))
      .catch(() => onSent(previous));
  };
}

function PendingRow({
  r,
  campaignId,
  onSent,
}: {
  r: Recipient;
  campaignId: string;
  onSent: (info: SentInfo | null) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState(false);
  const mark = markSentHandler(r, campaignId, onSent);

  async function copy() {
    try {
      await navigator.clipboard.writeText(r.whatsappBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <li className="px-5 py-3.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar name={r.name} size="sm" />
          <div className="min-w-0">
            <a
              href={`/clientes/${r.id}`}
              className="block truncate text-sm font-semibold text-ink hover:underline"
            >
              {r.name}
            </a>
            <div className="truncate text-xs text-ink-muted">
              {r.hint ? <span className="font-medium text-accent-700 dark:text-accent-300">{r.hint}</span> : null}
              {r.hint ? " · " : ""}
              {r.phone || r.email || "Sin contacto"}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <a
            href={whatsappLink(r.phone, r.whatsappBody)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => mark("whatsapp")}
            aria-disabled={!r.phone}
            className={`btn-primary min-h-[40px] flex-1 !py-2 text-xs sm:flex-none ${!r.phone ? "pointer-events-none opacity-40" : ""}`}
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp
          </a>
          <button
            onClick={() => setPreview((p) => !p)}
            className="btn-secondary min-h-[40px] !px-3 !py-2 text-xs"
            aria-label={preview ? "Ocultar mensaje" : "Ver mensaje"}
            title={preview ? "Ocultar mensaje" : "Ver mensaje"}
          >
            {preview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            onClick={copy}
            className="btn-secondary min-h-[40px] !px-3 !py-2 text-xs"
            aria-label="Copiar mensaje"
            title="Copiar mensaje"
          >
            {copied ? <Check className="h-4 w-4 text-brand-600" /> : <Copy className="h-4 w-4" />}
          </button>
          <a
            href={mailtoLink(r.email, r.emailSubject, r.emailBody)}
            onClick={() => mark("email")}
            aria-label="Enviar por email"
            title="Enviar por email"
            aria-disabled={!r.email}
            className={`btn-secondary min-h-[40px] !px-3 !py-2 text-xs ${!r.email ? "pointer-events-none opacity-40" : ""}`}
          >
            <Mail className="h-4 w-4" />
          </a>
          <button
            onClick={() => mark("manual")}
            className="btn-ghost min-h-[40px] !px-3 !py-2 text-xs"
            title="Ya se lo mandé por otro lado"
          >
            <Check className="h-4 w-4" aria-hidden="true" /> Ya lo envié
          </button>
        </div>
      </div>
      {preview && (
        <p className="mt-3 whitespace-pre-line rounded-xl bg-surface-2 p-3 text-xs leading-relaxed text-ink-soft animate-fade-in sm:ml-11">
          {r.whatsappBody}
        </p>
      )}
    </li>
  );
}

function SentRow({
  r,
  info,
  campaignId,
  onChange,
}: {
  r: Recipient;
  info: SentInfo;
  campaignId: string;
  onChange: (info: SentInfo | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const resend = markSentHandler(r, campaignId, onChange, info);

  async function undo() {
    if (!info.id) return;
    setBusy(true);
    try {
      await undoContact(info.id);
      onChange(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="flex flex-col gap-2.5 px-5 py-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={r.name} size="sm" />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-ink-soft">{r.name}</div>
          <div className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 dark:text-brand-300">
            <Check className="h-3 w-3" aria-hidden="true" />
            {channelLabel(info.channel)} · {relativeTime(info.at)}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        {r.phone && (
          <a
            href={whatsappLink(r.phone, r.whatsappBody)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => resend("whatsapp")}
            className="btn-ghost min-h-[40px] !py-2 text-xs"
          >
            <RotateCw className="h-3.5 w-3.5" aria-hidden="true" /> Reenviar
          </a>
        )}
        <button
          onClick={undo}
          disabled={busy || !info.id}
          className="btn-ghost min-h-[40px] !py-2 text-xs text-ink-muted"
          title="No lo llegué a mandar"
        >
          <Undo2 className="h-3.5 w-3.5" aria-hidden="true" /> Deshacer
        </button>
      </div>
    </li>
  );
}

function channelLabel(channel: string): string {
  if (channel === "whatsapp") return "Por WhatsApp";
  if (channel === "email") return "Por email";
  return "Enviado";
}

function relativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.floor((startToday - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000);
  if (diffDays <= 0) return `hoy ${time}`;
  if (diffDays === 1) return `ayer ${time}`;
  return `hace ${diffDays} días`;
}
