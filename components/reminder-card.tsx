"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, Mail, Copy, Check, CheckCircle2 } from "lucide-react";
import { whatsappLink, mailtoLink } from "@/lib/messages";
import { logContact } from "@/app/actions";
import { Avatar } from "@/components/ui";

export function ReminderCard({
  id,
  name,
  phone,
  email,
  hint,
  reason,
  whatsappBody,
  emailSubject,
  emailBody,
}: {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  hint: string;
  reason: string;
  whatsappBody: string;
  emailSubject: string;
  emailBody: string;
}) {
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(whatsappBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  async function markDone() {
    setBusy(true);
    try {
      await logContact(id, reason, "manual");
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-brand-500/20 bg-brand-500/10 px-4 py-3 animate-fade-in">
        <CheckCircle2 className="h-5 w-5 text-brand-600" />
        <span className="text-sm font-medium text-brand-700 dark:text-brand-400">
          Contactaste a {name.split(" ")[0]} ✓
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Avatar name={name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <Link href={`/clientes/${id}`} className="truncate font-semibold text-ink hover:underline">
              {name}
            </Link>
            <span className="shrink-0 text-xs font-semibold text-gold-600">{hint}</span>
          </div>
          <p className="mt-2 line-clamp-3 whitespace-pre-line rounded-lg bg-surface-2 p-2.5 text-xs text-ink-soft">
            {whatsappBody}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={whatsappLink(phone, whatsappBody)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={markDone}
          className={`btn-primary flex-1 !py-2 text-xs ${!phone ? "pointer-events-none opacity-40" : ""}`}
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </a>
        <button onClick={copy} className="btn-secondary !py-2 text-xs">
          {copied ? <Check className="h-4 w-4 text-brand-600" /> : <Copy className="h-4 w-4" />}
        </button>
        <a
          href={mailtoLink(email, emailSubject, emailBody)}
          onClick={markDone}
          className={`btn-secondary !py-2 text-xs ${!email ? "pointer-events-none opacity-40" : ""}`}
        >
          <Mail className="h-4 w-4" />
        </a>
        <button
          onClick={markDone}
          disabled={busy}
          className="btn-ghost !py-2 text-xs text-ink-muted"
        >
          <Check className="h-4 w-4" /> Ya lo hice
        </button>
      </div>
    </div>
  );
}
