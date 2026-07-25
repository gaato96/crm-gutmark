import Link from "next/link";
import { SubmitButton } from "./submit-button";

interface CustomerFormData {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  birthdate: Date | null;
  notes: string | null;
  tags: string[];
}

function toDateInput(d: Date | null): string {
  if (!d) return "";
  const dt = new Date(d);
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${dt.getFullYear()}-${m}-${day}`;
}

export function CustomerForm({
  action,
  customer,
  submitLabel,
  cancelHref,
}: {
  action: (formData: FormData) => void;
  customer?: CustomerFormData;
  submitLabel: string;
  cancelHref: string;
}) {
  return (
    <form action={action} className="card p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="name">
            Nombre y apellido *
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={customer?.name ?? ""}
            className="input"
            placeholder="Ej. María González"
          />
        </div>

        <div>
          <label className="label" htmlFor="phone">
            WhatsApp / Teléfono
          </label>
          <input
            id="phone"
            name="phone"
            defaultValue={customer?.phone ?? ""}
            className="input"
            placeholder="Ej. 5493815551234"
            inputMode="tel"
          />
          <p className="mt-1 text-xs text-ink-muted">Con código de país, sin espacios ni +.</p>
        </div>

        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={customer?.email ?? ""}
            className="input"
            placeholder="cliente@email.com"
          />
        </div>

        <div>
          <label className="label" htmlFor="birthdate">
            Fecha de cumpleaños
          </label>
          <input
            id="birthdate"
            name="birthdate"
            type="date"
            defaultValue={toDateInput(customer?.birthdate ?? null)}
            className="input"
          />
        </div>

        <div>
          <label className="label" htmlFor="tags">
            Etiquetas
          </label>
          <input
            id="tags"
            name="tags"
            defaultValue={customer?.tags.join(", ") ?? ""}
            className="input"
            placeholder="vip, premium, mayorista"
          />
          <p className="mt-1 text-xs text-ink-muted">Separadas por coma.</p>
        </div>

        <div className="sm:col-span-2">
          <label className="label" htmlFor="notes">
            Notas
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={customer?.notes ?? ""}
            className="input resize-none"
            placeholder="Preferencias, gustos, observaciones…"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Link href={cancelHref} className="btn-secondary">
          Cancelar
        </Link>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
