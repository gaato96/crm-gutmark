"use client";

import { useActionState, useEffect, useState } from "react";
import { MessageCircle, Mail, X, Lock } from "lucide-react";
import {
  TRIGGER_TYPES,
  TRIGGER_META,
  TRIGGER_UNITS,
  type TriggerType,
  isTriggerType,
} from "@/lib/campaigns";
import { SEGMENT_META, type Segment } from "@/lib/segmentation";
import { catalogWords } from "@/lib/rubros";
import { TEMPLATE_VARS } from "@/lib/messages";
import { createCampaign, updateCampaign, type CampaignFormState } from "@/app/campaign-actions";
import { SubmitButton } from "./submit-button";

// Lo que el editor necesita de una campaña ya existente. Todo serializable:
// viaja del Server Component al client.
export interface CampaignItem {
  id: string;
  name: string;
  description: string;
  active: boolean;
  builtin: string | null;
  triggerType: string;
  triggerValue: number | null;
  triggerUnit: string;
  segment: string | null;
  minSpend: number | null;
  serviceId: string | null;
  excludeInactive: boolean;
  whatsappBody: string;
  emailSubject: string;
  emailBody: string;
  reach: number;
  triggerLabel: string;
}

const EMPTY: CampaignFormState = {};

export interface CampaignService {
  id: string;
  name: string;
  recompraDays: number | null;
}

export function CampaignEditor({
  campaign,
  services,
  catalogMode,
  onClose,
}: {
  campaign: CampaignItem | null;
  services: CampaignService[];
  catalogMode: string;
  onClose: () => void;
}) {
  const words = catalogWords(catalogMode);
  const action = campaign ? updateCampaign.bind(null, campaign.id) : createCampaign;
  const [state, formAction] = useActionState(action, EMPTY);

  const initialTrigger: TriggerType =
    campaign && isTriggerType(campaign.triggerType) ? campaign.triggerType : "birthday";
  const [trigger, setTrigger] = useState<TriggerType>(initialTrigger);

  const meta = TRIGGER_META[trigger];

  // Para el disparador por servicio: el placeholder de días muestra la recompra
  // que el negocio ya cargó en ese servicio, así se ve qué valor va a usar si
  // deja el campo vacío.
  const [serviceId, setServiceId] = useState<string>(
    campaign?.serviceId ?? ""
  );
  const defaultServiceDays =
    services.find((sv) => sv.id === (serviceId || services[0]?.id))?.recompraDays ?? null;
  // Las de fábrica se editan en el texto pero no en el disparador: el resto de
  // la app las busca por `builtin` esperando esa semántica. El server hace
  // valer lo mismo, esto es solo para que se vea por qué está bloqueado.
  const lockedTrigger = Boolean(campaign?.builtin);

  // El server ya revalidó la ruta al guardar; cerrar deja ver la lista nueva.
  // Va en un efecto y no en el cuerpo del render: cerrar es actualizar estado
  // del padre, y hacerlo mientras React renderiza este componente es un error.
  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <div className="card mb-6 p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">
            {campaign ? `Editar “${campaign.name}”` : "Nueva campaña"}
          </h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            Definí a quién le llega y qué le vas a decir.
          </p>
        </div>
        <button onClick={onClose} className="btn-ghost !px-2 !py-2" aria-label="Cerrar">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form action={formAction} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="campaign-name">
              Nombre
            </label>
            <input
              id="campaign-name"
              name="name"
              defaultValue={campaign?.name ?? ""}
              maxLength={60}
              required
              placeholder="Aniversario de primera compra"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="campaign-description">
              Descripción <span className="font-normal text-ink-faint">(opcional)</span>
            </label>
            <input
              id="campaign-description"
              name="description"
              defaultValue={campaign?.description ?? ""}
              placeholder="Para qué sirve esta campaña"
              className="input"
            />
          </div>
        </div>

        {/* Disparador */}
        <fieldset className="rounded-xl border border-line bg-surface-2/40 p-4">
          <legend className="px-1.5 text-sm font-semibold text-ink-soft">¿A quién le llega?</legend>

          {lockedTrigger && (
            <p className="mb-3 flex items-start gap-2 rounded-lg bg-surface px-3 py-2 text-xs text-ink-muted">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Es una campaña de fábrica: podés cambiarle el texto, pero no a quién le llega. Si
              querés otro disparador, duplicala y editá la copia.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="campaign-trigger">
                Disparador
              </label>
              <select
                id="campaign-trigger"
                name="triggerType"
                value={trigger}
                onChange={(e) => setTrigger(e.target.value as TriggerType)}
                disabled={lockedTrigger}
                className="input disabled:opacity-60"
              >
                {TRIGGER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t === "service-recompra" ? words.triggerLabel : TRIGGER_META[t].label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-ink-muted">
                {trigger === "service-recompra" ? words.triggerHelp : meta.help}
              </p>
            </div>

            {meta.field === "days" && (
              <div>
                <label className="label" htmlFor="campaign-days">
                  {meta.daysLabel}
                </label>
                <div className="flex gap-2">
                  <input
                    id="campaign-days"
                    name="triggerValue"
                    type="number"
                    min={0}
                    max={3650}
                    defaultValue={campaign?.triggerValue ?? meta.defaultDays}
                    disabled={lockedTrigger}
                    className="input disabled:opacity-60"
                  />
                  {meta.allowsHours ? (
                    <select
                      name="triggerUnit"
                      defaultValue={campaign?.triggerUnit ?? "dias"}
                      disabled={lockedTrigger}
                      className="input w-32 disabled:opacity-60"
                      aria-label="Unidad de tiempo"
                    >
                      {TRIGGER_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u === "horas" ? "horas" : "días"}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="grid place-items-center px-2 text-sm text-ink-muted">
                      días
                    </span>
                  )}
                </div>
              </div>
            )}

            {meta.field === "segment" && (
              <div>
                <label className="label" htmlFor="campaign-segment">
                  Segmento
                </label>
                <select
                  id="campaign-segment"
                  name="segment"
                  defaultValue={campaign?.segment ?? "vip"}
                  disabled={lockedTrigger}
                  className="input disabled:opacity-60"
                >
                  {(Object.keys(SEGMENT_META) as Segment[]).map((s) => (
                    <option key={s} value={s}>
                      {SEGMENT_META[s].label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {meta.field === "service" && (
              <>
                <div>
                  <label className="label" htmlFor="campaign-service">
                    {words.singular.charAt(0).toUpperCase() + words.singular.slice(1)}
                  </label>
                  {services.length === 0 ? (
                    <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                      Todavía no cargaste nada. Cargá al menos un ítem en {words.nav} para
                      poder usar este disparador.
                    </p>
                  ) : (
                    <select
                      id="campaign-service"
                      name="serviceId"
                      value={serviceId || services[0]?.id || ""}
                      onChange={(e) => setServiceId(e.target.value)}
                      disabled={lockedTrigger}
                      className="input disabled:opacity-60"
                    >
                      {services.map((sv) => (
                        <option key={sv.id} value={sv.id}>
                          {sv.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="label" htmlFor="campaign-days">
                    {meta.daysLabel}
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="campaign-days"
                      name="triggerValue"
                      type="number"
                      min={0}
                      max={3650}
                      defaultValue={campaign?.triggerValue ?? ""}
                      placeholder={String(defaultServiceDays ?? "")}
                      disabled={lockedTrigger}
                      className="input disabled:opacity-60"
                    />
                    <select
                      name="triggerUnit"
                      defaultValue={campaign?.triggerUnit ?? "dias"}
                      disabled={lockedTrigger}
                      className="input w-32 disabled:opacity-60"
                      aria-label="Unidad de tiempo"
                    >
                      {TRIGGER_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u === "horas" ? "horas" : "días"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1.5 text-xs text-ink-muted">
                    En horas sirve para el rato justo después: “dos horas después del turno,
                    preguntale cómo le quedó”. Vacío = usa la recompra del ítem, en días.
                  </p>
                </div>
              </>
            )}

            {meta.field === "amount" && (
              <div>
                <label className="label" htmlFor="campaign-spend">
                  Gasto acumulado mínimo
                </label>
                <input
                  id="campaign-spend"
                  name="minSpend"
                  type="number"
                  min={0}
                  step={1000}
                  defaultValue={campaign?.minSpend ?? 100000}
                  disabled={lockedTrigger}
                  className="input disabled:opacity-60"
                />
              </div>
            )}
          </div>

          {(trigger === "days-since-purchase" || trigger === "days-since-signup") && (
            <label className="mt-3 flex items-start gap-2.5 text-sm text-ink-soft">
              <input
                type="checkbox"
                name="excludeInactive"
                defaultChecked={campaign?.excludeInactive ?? true}
                disabled={lockedTrigger}
                className="mt-0.5 h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-600"
              />
              <span>
                No incluir a los clientes ya inactivos
                <span className="block text-xs text-ink-muted">
                  El mensaje de “hace poco que no venís” no le cae bien a alguien que se fue hace
                  meses. Para esos conviene una campaña de reactivación aparte.
                </span>
              </span>
            </label>
          )}
        </fieldset>

        {/* Mensajes */}
        <div className="space-y-4">
          <div>
            <label className="label flex items-center gap-1.5" htmlFor="campaign-wa">
              <MessageCircle className="h-3.5 w-3.5" /> Mensaje de WhatsApp
            </label>
            <textarea
              id="campaign-wa"
              name="whatsappBody"
              rows={4}
              defaultValue={campaign?.whatsappBody ?? ""}
              placeholder="¡Hola {nombre}! …"
              className="input resize-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
            <div>
              <label className="label flex items-center gap-1.5" htmlFor="campaign-subject">
                <Mail className="h-3.5 w-3.5" /> Asunto del email
              </label>
              <input
                id="campaign-subject"
                name="emailSubject"
                defaultValue={campaign?.emailSubject ?? ""}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="campaign-email">
                Cuerpo del email
              </label>
              <textarea
                id="campaign-email"
                name="emailBody"
                rows={4}
                defaultValue={campaign?.emailBody ?? ""}
                className="input resize-none"
              />
            </div>
          </div>

          <div className="rounded-xl bg-surface-2 p-3.5">
            <p className="mb-2 text-xs font-semibold text-ink-soft">
              Variables — se reemplazan por los datos de cada cliente
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_VARS.map((v) => (
                <span
                  key={v.key}
                  title={v.label}
                  className="rounded-md bg-surface px-1.5 py-0.5 font-mono text-xs text-accent-700 ring-1 ring-inset ring-line dark:text-accent-300"
                >
                  {`{${v.key}}`}
                </span>
              ))}
            </div>
          </div>
        </div>

        {state.error && (
          <p className="rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-700 dark:text-rose-300">
            {state.error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <SubmitButton className="btn-primary">
            {campaign ? "Guardar cambios" : "Crear campaña"}
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
