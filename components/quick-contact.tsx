"use client";

import { useState } from "react";
import { MessageCircle, Mail, Copy, Check } from "lucide-react";
import { whatsappLink, mailtoLink } from "@/lib/messages";

export function QuickContact({
  phone,
  email,
  whatsappBody,
  emailSubject,
  emailBody,
  reason,
}: {
  phone: string | null;
  email: string | null;
  whatsappBody: string;
  emailSubject: string;
  emailBody: string;
  reason: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(whatsappBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="rounded-xl border border-line bg-surface-2/60 p-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        Mensaje sugerido · {reason}
      </div>
      <p className="mb-3 whitespace-pre-line rounded-lg bg-surface p-3 text-sm text-ink-soft ring-1 ring-line-soft">
        {whatsappBody}
      </p>
      <div className="flex flex-wrap gap-2">
        <a
          href={whatsappLink(phone, whatsappBody)}
          target="_blank"
          rel="noopener noreferrer"
          className={`btn-primary flex-1 ${!phone ? "pointer-events-none opacity-40" : ""}`}
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </a>
        <button onClick={copy} className="btn-secondary">
          {copied ? (
            <>
              <Check className="h-4 w-4 text-brand-600" /> Copiado
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" /> Copiar
            </>
          )}
        </button>
        <a
          href={mailtoLink(email, emailSubject, emailBody)}
          className={`btn-secondary ${!email ? "pointer-events-none opacity-40" : ""}`}
        >
          <Mail className="h-4 w-4" /> Email
        </a>
      </div>
    </div>
  );
}
