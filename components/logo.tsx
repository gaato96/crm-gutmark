import Image from "next/image";

// Ícono generado por IA (ver CLAUDE.md → "Identidad de marca"): ya trae su
// propio fondo verde (#022c22), así que funciona como badge autocontenido en
// cualquier superficie sin necesitar transparencia. Si más adelante se decide
// sacarle el fondo, este es el único archivo a tocar para que el cambio se
// propague a todo el sistema.
const ICON_SRC = "/logo.png";

export function LogoMark({
  size = 36,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={ICON_SRC}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-xl ${className}`}
    />
  );
}

/**
 * Ícono + wordmark "Vuelvo". Decorativo por diseño: el texto visible al lado
 * ya dice el nombre, así que el ícono lleva `alt=""` para no duplicarlo en
 * lectores de pantalla.
 */
export function Logo({
  tone = "default",
  size = "md",
  className = "",
}: {
  /** "onBrand" es para fondos verdes fijos que no siguen el tema (ej. panel
   * de auth, tarjeta de fidelidad) — ahí el texto va blanco siempre. */
  tone?: "default" | "onBrand";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims = { sm: 28, md: 36, lg: 40 }[size];
  const textSize = { sm: "text-sm", md: "text-base", lg: "text-lg" }[size];
  const nameColor = tone === "onBrand" ? "text-white" : "text-ink";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={dims} />
      <span className={`font-display leading-none ${textSize} ${nameColor}`}>
        Vuelvo
      </span>
    </div>
  );
}
