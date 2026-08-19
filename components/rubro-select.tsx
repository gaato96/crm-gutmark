"use client";

import { RUBROS, modeForRubro, catalogWords } from "@/lib/rubros";
import { useState } from "react";

// Selector de rubro con una línea que anticipa qué va a ver el negocio. Sin
// eso, "Rubro" parece un dato de contacto más y en realidad decide el
// vocabulario de toda la interfaz.
export function RubroSelect({
  name = "rubro",
  defaultValue,
  label = "Rubro",
  showHint = true,
}: {
  name?: string;
  defaultValue?: string;
  label?: string;
  showHint?: boolean;
}) {
  const [rubro, setRubro] = useState(defaultValue ?? "");
  const words = rubro ? catalogWords(modeForRubro(rubro)) : null;

  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={rubro}
        onChange={(e) => setRubro(e.target.value)}
        required
        className="input"
      >
        <option value="" disabled>
          Elegí el rubro…
        </option>
        {RUBROS.map((r) => (
          <option key={r.code} value={r.code}>
            {r.label}
          </option>
        ))}
      </select>
      {showHint && words && (
        <p className="mt-1.5 text-xs text-ink-muted">
          Vas a cargar <strong>{words.plural}</strong> con precio, y el sistema los va a
          nombrar así en todas las pantallas.
        </p>
      )}
    </div>
  );
}
