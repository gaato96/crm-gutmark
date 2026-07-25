"use client";

import { useState } from "react";
import { Cake, RotateCcw, MessageCircle, Mail, Check } from "lucide-react";
import { saveTemplate } from "@/app/actions";
import { SubmitButton } from "./submit-button";

export interface TemplateData {
  id: string;
  type: string;
  channel: string;
  subject: string;
  body: string;
}

const META: Record<string, { label: string; icon: React.ReactNode }> = {
  birthday: { label: "Cumpleaños", icon: <Cake className="h-4 w-4" /> },
  winback: { label: "Recompra / Volvé", icon: <RotateCcw className="h-4 w-4" /> },
};

export function TemplateEditor({ template }: { template: TemplateData }) {
  const [saved, setSaved] = useState(false);
  const action = saveTemplate.bind(null, template.id);
  const isEmail = template.channel === "email";
  const m = META[template.type] ?? { label: template.type, icon: null };

  return (
    <form
      action={async (fd) => {
        await action(fd);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }}
      className="card p-5"
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500/10 text-brand-600">
          {m.icon}
        </span>
        <div>
          <div className="text-sm font-bold text-ink">{m.label}</div>
          <div className="flex items-center gap-1 text-xs text-ink-muted">
            {isEmail ? <Mail className="h-3 w-3" /> : <MessageCircle className="h-3 w-3" />}
            {isEmail ? "Email" : "WhatsApp"}
          </div>
        </div>
      </div>

      {isEmail && (
        <div className="mb-3">
          <label className="label">Asunto</label>
          <input name="subject" defaultValue={template.subject} className="input" />
        </div>
      )}

      <div>
        <label className="label">Mensaje</label>
        <textarea
          name="body"
          rows={isEmail ? 6 : 4}
          defaultValue={template.body}
          className="input resize-none font-normal"
        />
        <p className="mt-1.5 text-xs text-ink-muted">
          Usá <code className="rounded bg-surface-2 px-1 text-brand-700 dark:text-brand-400">{"{nombre}"}</code> y{" "}
          <code className="rounded bg-surface-2 px-1 text-brand-700 dark:text-brand-400">{"{negocio}"}</code> como
          variables.
        </p>
      </div>

      <div className="mt-4 flex items-center justify-end gap-3">
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-600">
            <Check className="h-4 w-4" /> Guardado
          </span>
        )}
        <SubmitButton className="btn-secondary">Guardar plantilla</SubmitButton>
      </div>
    </form>
  );
}
