"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import {
  MessageSquareWarning,
  X,
  ImagePlus,
  CheckCircle2,
  Loader2,
  MessageCircleReply,
} from "lucide-react";
import { submitFeedback, listMyFeedback } from "@/app/feedback-actions";
import {
  FEEDBACK_KINDS,
  feedbackKindLabel,
  feedbackStatusMeta,
  type MyFeedbackRow,
} from "@/lib/feedback";
import { formatDate } from "@/lib/format";

// Achica la imagen en el navegador antes de mandarla: una captura de celular
// pesa 3 MB y lo que hace falta para entender un error entra en 200 KB.
async function compressImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const max = 1400;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.72);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function FeedbackButton({
  unread,
  variant = "sidebar",
  onOpen,
}: {
  // Respuestas del equipo que el dueño todavía no vio.
  unread: number;
  variant?: "sidebar" | "inline";
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [dot, setDot] = useState(unread > 0);

  useEffect(() => setDot(unread > 0), [unread]);

  return (
    <>
      <button
        type="button"
        data-tour="reportar"
        onClick={() => {
          onOpen?.();
          setOpen(true);
        }}
        className={
          variant === "sidebar"
            ? "nav-link relative w-full"
            : "btn-secondary relative"
        }
      >
        <MessageSquareWarning className="h-[18px] w-[18px] shrink-0" strokeWidth={2.2} />
        <span className="truncate" title="Reportar un problema o una idea">Reportar o sugerir</span>
        {dot && (
          <span
            className="ml-auto h-2.5 w-2.5 shrink-0 rounded-full bg-accent-600 ring-2 ring-surface"
            aria-label="Tenés una respuesta nueva"
          />
        )}
      </button>
      {open && (
        <FeedbackModal
          onClose={() => setOpen(false)}
          onSeen={() => setDot(false)}
          startOnList={dot}
        />
      )}
    </>
  );
}

function FeedbackModal({
  onClose,
  onSeen,
  startOnList,
}: {
  onClose: () => void;
  onSeen: () => void;
  startOnList: boolean;
}) {
  const pathname = usePathname();
  const [tab, setTab] = useState<"nuevo" | "mios">(startOnList ? "mios" : "nuevo");
  const [kind, setKind] = useState<string>("problema");
  const [message, setMessage] = useState("");
  const [shot, setShot] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [mine, setMine] = useState<MyFeedbackRow[] | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (tab !== "mios" || mine) return;
    listMyFeedback()
      .then((rows) => {
        setMine(rows);
        onSeen();
      })
      .catch(() => setMine([]));
  }, [tab, mine, onSeen]);

  function send() {
    setError("");
    startTransition(async () => {
      const res = await submitFeedback({
        kind,
        message,
        path: pathname,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        screenshot: shot,
      });
      if (!res.ok) {
        setError(res.error ?? "No se pudo enviar.");
        return;
      }
      setSent(true);
      setMine(null);
    });
  }

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
      <div aria-hidden="true" className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative flex min-h-full items-start justify-center p-4 sm:items-center">
        <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface shadow-pop animate-scale-in">
          <div className="flex items-center gap-3 border-b border-line-soft px-5 py-4">
            <MessageSquareWarning className="h-5 w-5 text-accent-600 dark:text-accent-300" />
            <h2 id="feedback-title" className="flex-1 font-display text-base font-bold text-ink">
              Contanos qué pasó
            </h2>
            <button onClick={onClose} className="btn-ghost !p-2" aria-label="Cerrar">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex gap-1 border-b border-line-soft px-5 pt-3">
            {(["nuevo", "mios"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`-mb-px border-b-2 px-3 pb-2 text-sm font-semibold transition ${
                  tab === t ? "border-accent-600 text-ink" : "border-transparent text-ink-muted hover:text-ink-soft"
                }`}
              >
                {t === "nuevo" ? "Nuevo reporte" : "Mis reportes"}
              </button>
            ))}
          </div>

          {tab === "nuevo" && sent && (
            <div className="px-5 py-8 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-brand-600" />
              <p className="font-display font-bold text-ink">¡Gracias! Ya nos llegó.</p>
              <p className="mt-1 text-sm text-ink-muted">
                Te respondemos acá mismo: cuando haya novedades, el botón muestra un punto.
              </p>
              <div className="mt-5 flex justify-center gap-2">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setSent(false);
                    setMessage("");
                    setShot(null);
                  }}
                >
                  Mandar otro
                </button>
                <button className="btn-primary" onClick={onClose}>
                  Listo
                </button>
              </div>
            </div>
          )}

          {tab === "nuevo" && !sent && (
            <div className="space-y-4 px-5 py-5">
              <div className="grid grid-cols-3 gap-2">
                {FEEDBACK_KINDS.map((k) => (
                  <button
                    key={k.code}
                    type="button"
                    onClick={() => setKind(k.code)}
                    className={`rounded-xl px-2 py-2.5 text-xs font-semibold ring-1 ring-inset transition ${
                      kind === k.code
                        ? "bg-accent-600 text-white ring-accent-600"
                        : "bg-surface-2 text-ink-soft ring-line hover:bg-surface-3"
                    }`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
              <div>
                <label className="label" htmlFor="fb-message">
                  {kind === "idea" ? "¿Qué te gustaría que haga el sistema?" : kind === "duda" ? "¿Qué no se entiende?" : "¿Qué estabas haciendo y qué pasó?"}
                </label>
                <textarea
                  id="fb-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={4000}
                  autoFocus
                  className="input resize-none"
                  placeholder={
                    kind === "idea"
                      ? "Ej.: poder mandar el mensaje de cumpleaños a todos juntos"
                      : "Ej.: toqué Guardar en una venta y no pasó nada"
                  }
                />
              </div>

              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    try {
                      setShot(await compressImage(f));
                    } catch {
                      setError("No se pudo leer la imagen.");
                    }
                  }}
                />
                {shot ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={shot} alt="Captura adjunta" className="max-h-40 w-full rounded-xl object-contain ring-1 ring-line" />
                    <button
                      onClick={() => setShot(null)}
                      className="absolute right-2 top-2 rounded-full bg-surface/90 p-1 text-ink-muted ring-1 ring-line hover:text-rose-600"
                      aria-label="Quitar captura"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost !px-0 text-sm">
                    <ImagePlus className="h-4 w-4" /> Adjuntar una captura (opcional)
                  </button>
                )}
              </div>

              <p className="text-xs text-ink-muted">
                Se adjunta solo la pantalla en la que estás ({pathname}) y tu dispositivo, para
                poder reproducirlo.
              </p>

              {error && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600">{error}</p>}

              <div className="flex justify-end gap-2">
                <button onClick={onClose} className="btn-secondary">
                  Cancelar
                </button>
                <button onClick={send} disabled={pending || message.trim().length < 5} className="btn-primary">
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {pending ? "Enviando…" : "Enviar"}
                </button>
              </div>
            </div>
          )}

          {tab === "mios" && (
            <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
              {mine === null ? (
                <p className="py-8 text-center text-sm text-ink-muted">Cargando…</p>
              ) : mine.length === 0 ? (
                <p className="py-8 text-center text-sm text-ink-muted">Todavía no mandaste ningún reporte.</p>
              ) : (
                <ul className="space-y-3">
                  {mine.map((r) => {
                    const st = feedbackStatusMeta(r.status);
                    return (
                      <li key={r.id} className="rounded-xl border border-line p-3">
                        <div className="mb-1 flex items-center gap-2 text-xs text-ink-muted">
                          <span className="font-semibold text-ink-soft">{feedbackKindLabel(r.kind)}</span>
                          <span>· {formatDate(r.createdAt)}</span>
                          <span className={`badge ml-auto ${st.cls}`}>{st.label}</span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm text-ink">{r.message}</p>
                        {r.reply && (
                          <div className="mt-2 rounded-lg bg-accent-500/10 p-2.5 text-sm text-ink">
                            <div className="mb-0.5 flex items-center gap-1 text-xs font-semibold text-accent-700 dark:text-accent-300">
                              <MessageCircleReply className="h-3.5 w-3.5" /> Respuesta del equipo
                            </div>
                            <p className="whitespace-pre-wrap">{r.reply}</p>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
