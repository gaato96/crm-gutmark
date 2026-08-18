"use client";

import { useState } from "react";
import { MessageCircle, Mail, Copy, Check, Users2 } from "lucide-react";
import { whatsappLink, mailtoLink } from "@/lib/messages";
import { logContact } from "@/app/actions";
import { Avatar } from "@/components/ui";

export interface Recipient {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
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

export function CampaignComposer({ audiences }: { audiences: Audience[] }) {
  const [activeKey, setActiveKey] = useState(audiences[0]?.key ?? "");
  const active = audiences.find((a) => a.key === activeKey) ?? audiences[0];

  return (
    <div>
      {/* Selector de audiencia */}
      <div className="mb-4 flex flex-wrap gap-2">
        {audiences.map((a) => {
          const on = a.key === activeKey;
          return (
            <button
              key={a.key}
              onClick={() => setActiveKey(a.key)}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                on
                  ? "bg-brand-600 text-white"
                  : "bg-surface text-ink-soft ring-1 ring-inset ring-line hover:bg-surface-2"
              }`}
            >
              {a.label}
              <span
                className={`rounded-full px-1.5 text-xs font-bold ${
                  on ? "bg-surface/20" : "bg-surface-2 text-ink-muted"
                }`}
              >
                {a.recipients.length}
              </span>
            </button>
          );
        })}
      </div>

      {active && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-line-soft bg-surface-2/60 px-5 py-3.5">
            <Users2 className="h-4 w-4 text-ink-muted" />
            <p className="text-sm text-ink-soft">{active.description}</p>
          </div>

          {active.recipients.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-ink-muted">
              No hay clientes en esta audiencia por ahora.
            </div>
          ) : (
            <ul className="divide-y divide-line-soft">
              {active.recipients.map((r) => (
                <RecipientRow key={r.id} r={r} campaignId={active.campaignId} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function RecipientRow({ r, campaignId }: { r: Recipient; campaignId: string }) {
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(r.whatsappBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  // Registrar el contacto sin bloquear la apertura del chat: el link navega
  // igual, y si el registro falla no tiene sentido frenar el envío por eso.
  function mark(channel: string) {
    setSent(true);
    logContact(r.id, "campaign", channel, campaignId).catch(() => {});
  }

  return (
    <li className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={r.name} size="sm" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-ink">{r.name}</span>
            {sent && (
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand-700 dark:text-brand-300">
                <Check className="h-3 w-3" /> Contactado
              </span>
            )}
          </div>
          <div className="truncate text-xs text-ink-muted">
            {r.phone || r.email || "Sin contacto"}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <a
          href={whatsappLink(r.phone, r.whatsappBody)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => mark("whatsapp")}
          className={`btn-primary !py-2 text-xs ${!r.phone ? "pointer-events-none opacity-40" : ""}`}
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </a>
        <button onClick={copy} className="btn-secondary !py-2 text-xs">
          {copied ? <Check className="h-4 w-4 text-brand-600" /> : <Copy className="h-4 w-4" />}
        </button>
        <a
          href={mailtoLink(r.email, r.emailSubject, r.emailBody)}
          onClick={() => mark("email")}
          className={`btn-secondary !py-2 text-xs ${!r.email ? "pointer-events-none opacity-40" : ""}`}
        >
          <Mail className="h-4 w-4" />
        </a>
      </div>
    </li>
  );
}
