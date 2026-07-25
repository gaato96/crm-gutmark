"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("gf-theme", next ? "dark" : "light");
    } catch {}
  }

  // Placeholder estable para evitar mismatch de hidratación
  if (!mounted) {
    return (
      <span
        className={
          compact
            ? "grid h-9 w-9 place-items-center"
            : "inline-flex h-9 w-9 rounded-xl"
        }
        aria-hidden
      />
    );
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={dark ? "Modo claro" : "Modo oscuro"}
      className="group relative grid h-9 w-9 place-items-center rounded-xl text-ink-muted ring-1 ring-inset ring-line transition hover:bg-surface-2 hover:text-ink"
    >
      <Sun
        className={`absolute h-[18px] w-[18px] transition-all duration-300 ${
          dark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        }`}
        strokeWidth={2.2}
      />
      <Moon
        className={`absolute h-[18px] w-[18px] transition-all duration-300 ${
          dark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
        }`}
        strokeWidth={2.2}
      />
    </button>
  );
}
