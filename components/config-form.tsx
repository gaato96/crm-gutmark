"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Check, Store, SlidersHorizontal, Palette, ImagePlus, Trash2, Mail } from "lucide-react";
import { updateBusiness } from "@/app/actions";
import {
  updateBusinessProfile,
  updateAppearance,
  setWeeklySummary,
  type SettingsState,
} from "@/app/settings-actions";
import { ACCENT_PRESETS, businessInitial } from "@/lib/appearance";
import { SubmitButton } from "./submit-button";
import { RubroSelect } from "./rubro-select";

export interface BusinessData {
  name: string;
  rubro: string;
  inactivityDays: number;
  recompraDays: number;
  vipMinSpend: number;
}

export interface ProfileData {
  name: string;
  rubro: string;
  displayName: string | null;
  ownerName: string | null;
  phone: string | null;
  instagram: string | null;
  address: string | null;
}

const EMPTY: SettingsState = {};

function Saved({ show, text = "Cambios guardados" }: { show: boolean; text?: string }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 dark:text-brand-300">
      <Check className="h-4 w-4" /> {text}
    </span>
  );
}

// Muestra el "guardado" un rato después de cada envío exitoso.
function useFlash(ok: boolean | undefined, state: unknown) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!ok) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 2200);
    return () => clearTimeout(t);
  }, [ok, state]);
  return show;
}

// --- Negocio ----------------------------------------------------------------------

export function BusinessProfileForm({ data, impersonating }: { data: ProfileData; impersonating: boolean }) {
  const [state, action] = useActionState(updateBusinessProfile, EMPTY);
  const saved = useFlash(state.ok, state);
  const [greeting, setGreeting] = useState(data.displayName ?? "");

  return (
    <form action={action} className="space-y-6">
      <div className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Store className="h-5 w-5 text-brand-600" />
          <h2 className="font-bold text-ink">Datos del negocio</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">Nombre del negocio</label>
            <input id="name" name="name" defaultValue={data.name} className="input" required maxLength={80} />
          </div>
          <RubroSelect defaultValue={data.rubro} />
          <div>
            <label className="label" htmlFor="displayName">
              Cómo te saluda el panel <span className="font-normal text-ink-faint">(opcional)</span>
            </label>
            <input
              id="displayName"
              name="displayName"
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              maxLength={40}
              placeholder={data.name}
              className="input"
            />
            <p className="mt-1 text-xs text-ink-muted">
              En Inicio vas a ver: <strong className="text-ink-soft">Hola, {greeting.trim() || data.name}</strong>
            </p>
          </div>
          <div>
            <label className="label" htmlFor="ownerName">
              Tu nombre <span className="font-normal text-ink-faint">(opcional)</span>
            </label>
            <input
              id="ownerName"
              name="ownerName"
              defaultValue={data.ownerName ?? ""}
              maxLength={60}
              disabled={impersonating}
              className="input disabled:opacity-60"
              placeholder="Juan Pérez"
            />
            {impersonating && (
              <p className="mt-1 text-xs text-ink-muted">No se cambia mientras ves la cuenta como admin.</p>
            )}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-1 font-bold text-ink">Contacto</h2>
        <p className="mb-4 text-sm text-ink-muted">
          Para que el equipo de Vuelvo pueda ayudarte y para tener tus datos a mano.
        </p>
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="phone">WhatsApp del negocio</label>
            <input id="phone" name="phone" type="tel" defaultValue={data.phone ?? ""} maxLength={30} placeholder="11 5555-5555" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="instagram">Instagram</label>
            <input id="instagram" name="instagram" defaultValue={data.instagram ?? ""} maxLength={40} placeholder="@tunegocio" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="address">Dirección</label>
            <input id="address" name="address" defaultValue={data.address ?? ""} maxLength={120} placeholder="Av. Siempre Viva 742" className="input" />
          </div>
        </div>
      </div>

      {state.error && <p className="rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-600">{state.error}</p>}
      <div className="flex items-center justify-end gap-3">
        <Saved show={saved} />
        <SubmitButton>Guardar</SubmitButton>
      </div>
    </form>
  );
}

// --- Apariencia ---------------------------------------------------------------------

// Achica el logo a 256 px en el navegador: es lo más grande que se muestra y
// así pesa ~30 KB en vez de los megas de un PNG exportado de Canva.
async function resizeLogo(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const size = 256;
    const scale = Math.min(1, size / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    // WebP mantiene la transparencia y pesa poco; si el navegador no lo
    // soporta, toDataURL devuelve PNG.
    return canvas.toDataURL("image/webp", 0.9);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function AppearanceForm({
  businessName,
  accentColor,
  logoUrl,
}: {
  businessName: string;
  accentColor: string;
  logoUrl: string | null;
}) {
  const [state, action] = useActionState(updateAppearance, EMPTY);
  const saved = useFlash(state.ok, state);
  const [accent, setAccent] = useState(accentColor);
  const [logo, setLogo] = useState<string>(""); // "" = sin cambios, "remove" o data URL
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const preview = logo === "remove" ? null : logo || logoUrl;
  const preset = ACCENT_PRESETS.find((p) => p.code === accent) ?? ACCENT_PRESETS[0];

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="logo" value={logo} />
      <input type="hidden" name="accentColor" value={accent} />

      <div className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <ImagePlus className="h-5 w-5 text-brand-600" />
          <h2 className="font-bold text-ink">Logo</h2>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl bg-surface-2 font-display text-2xl font-bold text-accent-700 ring-1 ring-line dark:text-accent-300">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Logo del negocio" className="h-full w-full object-cover" />
            ) : (
              businessInitial(businessName)
            )}
          </div>
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setError("");
                try {
                  setLogo(await resizeLogo(f));
                } catch {
                  setError("No se pudo leer la imagen. Probá con un PNG o JPG.");
                }
                e.target.value = "";
              }}
            />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary !py-2 text-sm">
                <ImagePlus className="h-4 w-4" /> {preview ? "Cambiar" : "Subir logo"}
              </button>
              {preview && (
                <button type="button" onClick={() => setLogo("remove")} className="btn-ghost !py-2 text-sm text-rose-600">
                  <Trash2 className="h-4 w-4" /> Quitar
                </button>
              )}
            </div>
            <p className="text-xs text-ink-muted">Cuadrado, PNG o JPG. Se ve en el menú y en Inicio.</p>
            {error && <p className="text-xs text-rose-600">{error}</p>}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="mb-1 flex items-center gap-2">
          <Palette className="h-5 w-5 text-brand-600" />
          <h2 className="font-bold text-ink">Color del panel</h2>
        </div>
        <p className="mb-4 text-sm text-ink-muted">
          Pinta los resaltados, “Tu plan de hoy” y las etiquetas. Los botones de acción siguen en
          verde para que siempre sepas qué se toca.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ACCENT_PRESETS.map((p) => (
            <button
              key={p.code}
              type="button"
              onClick={() => setAccent(p.code)}
              aria-pressed={accent === p.code}
              className={`flex items-center gap-3 rounded-xl p-2.5 text-left text-sm font-semibold ring-1 ring-inset transition ${
                accent === p.code ? "bg-surface-2 text-ink ring-2 ring-ink/40" : "text-ink-soft ring-line hover:bg-surface-2"
              }`}
            >
              <span className="flex shrink-0 overflow-hidden rounded-lg ring-1 ring-black/5">
                <span className="h-8 w-4" style={{ background: p.scale[400] }} />
                <span className="h-8 w-4" style={{ background: p.scale[600] }} />
                <span className="h-8 w-4" style={{ background: p.scale[800] }} />
              </span>
              {p.label}
            </button>
          ))}
        </div>

        {/* Vista previa con los colores del preset elegido, sin esperar a guardar. */}
        <div
          className="mt-5 flex items-center gap-4 rounded-2xl px-5 py-4 text-white"
          style={{ background: `linear-gradient(135deg, ${preset.scale[600]}, ${preset.scale[800]})` }}
        >
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-80">Tu plan de hoy</div>
            <div className="font-display text-2xl font-bold">12 clientes para contactar</div>
          </div>
        </div>
      </div>

      {state.error && <p className="rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-600">{state.error}</p>}
      <div className="flex items-center justify-end gap-3">
        <Saved show={saved} />
        <SubmitButton>Guardar apariencia</SubmitButton>
      </div>
    </form>
  );
}

// --- Reglas ------------------------------------------------------------------------

export function ConfigForm({ business }: { business: BusinessData }) {
  const [saved, setSaved] = useState(false);

  return (
    <form
      action={async (fd) => {
        await updateBusiness(fd);
        setSaved(true);
        setTimeout(() => setSaved(false), 2200);
      }}
      className="space-y-6"
    >
      {/* Nombre y rubro viajan ocultos: updateBusiness los espera, y se editan
          en la pestaña Negocio. */}
      <input type="hidden" name="name" value={business.name} />
      <input type="hidden" name="rubro" value={business.rubro} />
      <div className="card p-6">
        <div className="mb-1 flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-brand-600" />
          <h2 className="font-bold text-ink">Reglas de segmentación</h2>
        </div>
        <p className="mb-4 text-sm text-ink-muted">
          Ajustá estos valores según tu tipo de negocio. Definen cómo se clasifican tus clientes.
        </p>
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className="label">Días para "inactivo"</label>
            <input
              name="inactivityDays"
              type="number"
              min="1"
              defaultValue={business.inactivityDays}
              className="input"
            />
            <p className="mt-1 text-xs text-ink-muted">Sin comprar más de estos días.</p>
          </div>
          <div>
            <label className="label">Días para recompra</label>
            <input
              name="recompraDays"
              type="number"
              min="1"
              defaultValue={business.recompraDays}
              className="input"
            />
            <p className="mt-1 text-xs text-ink-muted">Tiempo esperado entre compras.</p>
          </div>
          <div>
            <label className="label">Gasto mínimo VIP</label>
            <input
              name="vipMinSpend"
              type="number"
              min="0"
              step="any"
              defaultValue={business.vipMinSpend}
              className="input"
            />
            <p className="mt-1 text-xs text-ink-muted">Gasto acumulado para ser VIP.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Saved show={saved} />
        <SubmitButton>Guardar configuración</SubmitButton>
      </div>
    </form>
  );
}

// --- Cuenta ------------------------------------------------------------------------

export function WeeklySummaryToggle({ enabled, email }: { enabled: boolean; email: string }) {
  const [on, setOn] = useState(enabled);
  const [pending, startTransition] = useTransition();
  return (
    <div className="card flex items-start gap-4 p-6">
      <Mail className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
      <div className="min-w-0 flex-1">
        <h2 className="font-bold text-ink">Resumen semanal por email</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Los lunes a la mañana te llega a <strong className="text-ink-soft">{email}</strong> cuánto
          vendiste la semana pasada, cuántos clientes volvieron por tus mensajes y a cuántos tenés
          para escribirles hoy.
        </p>
        <a
          href="/configuracion/resumen"
          target="_blank"
          rel="noopener"
          className="mt-2 inline-block text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400"
        >
          Ver cómo llega con tus números →
        </a>
      </div>
      <label className="relative inline-flex shrink-0 cursor-pointer items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={on}
          disabled={pending}
          onChange={(e) => {
            const v = e.target.checked;
            setOn(v);
            startTransition(() => setWeeklySummary(v));
          }}
          aria-label="Recibir el resumen semanal"
        />
        <span className="h-6 w-11 rounded-full bg-surface-3 transition peer-checked:bg-brand-500 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </label>
    </div>
  );
}
