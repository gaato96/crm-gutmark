"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// Input de contraseña con botón de ojo para mostrar/ocultar. Envuelve un
// <input> normal así que sigue viajando en el FormData de un Server Action
// como cualquier campo de texto — lo único que cambia es el `type`.
export function PasswordInput({
  id,
  name,
  required,
  minLength,
  autoComplete,
  placeholder,
  autoFocus,
  className = "",
}: {
  id: string;
  name: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={`input pr-10 ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute inset-y-0 right-0 grid w-10 place-items-center text-ink-faint transition hover:text-ink-muted"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
