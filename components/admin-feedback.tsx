"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ImageIcon, MonitorSmartphone, Check } from "lucide-react";
import { setFeedbackStatus, replyFeedback } from "@/app/feedback-actions";
import { FEEDBACK_STATUS, feedbackKindLabel, feedbackStatusMeta } from "@/lib/feedback";
import { formatDate, formatTime } from "@/lib/format";

export interface FeedbackRow {
  id: string;
  businessId: string;
  businessName: string;
  kind: string;
  message: string;
  path: string;
  userAgent: string;
  viewport: string;
  screenshot: string | null;
  fromImpersonation: boolean;
  status: string;
  reply: string | null;
  createdAt: string;
  seenAt: string | null;
}

// Un dispositivo legible a partir del user agent: alcanza con saber si fue
// un celular y qué navegador, que es lo que cambia cómo se ve la pantalla.
function deviceLabel(ua: string): string {
  const os = /iPhone|iPad/.test(ua) ? "iPhone/iPad" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "Mac" : "Otro";
  const br = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : /Firefox\//.test(ua) ? "Firefox" : "";
  return `${os}${br ? ` · ${br}` : ""}`;
}

export function FeedbackInbox({ rows, showBusiness = true }: { rows: FeedbackRow[]; showBusiness?: boolean }) {
  if (rows.length === 0) {
    return <p className="card px-5 py-10 text-center text-sm text-ink-muted">No hay reportes en esta vista.</p>;
  }
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <FeedbackItem key={r.id} row={r} showBusiness={showBusiness} />
      ))}
    </ul>
  );
}

function FeedbackItem({ row, showBusiness }: { row: FeedbackRow; showBusiness: boolean }) {
  const [reply, setReply] = useState(row.reply ?? "");
  const [shot, setShot] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const st = feedbackStatusMeta(row.status);

  return (
    <li className="card p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
        <span className={`badge ${st.cls}`}>{st.label}</span>
        <span className="font-semibold text-ink-soft">{feedbackKindLabel(row.kind)}</span>
        {showBusiness && (
          <Link href={`/admin/negocios/${row.businessId}`} className="font-semibold text-ink hover:underline">
            {row.businessName}
          </Link>
        )}
        <span>
          {formatDate(row.createdAt)} {formatTime(row.createdAt)}
        </span>
        {row.fromImpersonation && <span className="badge bg-surface-3 text-ink-muted ring-line">Cargado por el equipo</span>}
        <select
          value={row.status}
          disabled={pending}
          onChange={(e) => startTransition(() => setFeedbackStatus(row.id, e.target.value))}
          className="input ml-auto !w-auto !py-1 text-xs"
          aria-label="Estado"
        >
          {FEEDBACK_STATUS.map((s) => (
            <option key={s.code} value={s.code}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <p className="whitespace-pre-wrap text-sm text-ink">{row.message}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
        <span className="font-mono">{row.path || "—"}</span>
        <span className="inline-flex items-center gap-1" title={row.userAgent}>
          <MonitorSmartphone className="h-3.5 w-3.5" /> {deviceLabel(row.userAgent)} · {row.viewport}
        </span>
        {row.screenshot && (
          <button onClick={() => setShot((v) => !v)} className="inline-flex items-center gap-1 font-semibold text-accent-700 hover:underline dark:text-accent-300">
            <ImageIcon className="h-3.5 w-3.5" /> {shot ? "Ocultar captura" : "Ver captura"}
          </button>
        )}
      </div>
      {shot && row.screenshot && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={row.screenshot} alt="Captura enviada" className="mt-2 max-h-96 rounded-xl ring-1 ring-line" />
      )}
      <div className="mt-3 space-y-2 border-t border-line-soft pt-3">
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={2}
          placeholder="Respuesta para el negocio (la ve en el botón Reportar o sugerir)"
          className="input resize-y text-sm"
        />
        <div className="flex flex-wrap items-center justify-end gap-2">
          {row.reply && <span className="mr-auto text-xs text-ink-muted">{row.seenAt ? "El negocio ya vio la respuesta" : "Todavía no la vio"}</span>}
          {saved && (
            <span className="inline-flex items-center gap-1 text-xs text-brand-700 dark:text-brand-300">
              <Check className="h-3.5 w-3.5" /> Enviada
            </span>
          )}
          <button
            disabled={pending || !reply.trim()}
            onClick={() =>
              startTransition(async () => {
                await replyFeedback(row.id, reply, false);
                setSaved(true);
              })
            }
            className="btn-secondary !py-1.5 text-xs"
          >
            Responder
          </button>
          <button
            disabled={pending || !reply.trim()}
            onClick={() =>
              startTransition(async () => {
                await replyFeedback(row.id, reply, true);
                setSaved(true);
              })
            }
            className="btn-primary !py-1.5 text-xs"
          >
            Responder y resolver
          </button>
        </div>
      </div>
    </li>
  );
}
