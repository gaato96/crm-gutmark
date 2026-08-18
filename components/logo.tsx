import Image from "next/image";

// Logo vectorial, generado desde el PDF del manual de marca con
// scripts/pdf-to-svg.cjs (ver CLAUDE.md → "Identidad de marca").
//
// Hay dos variantes y elegir mal se nota:
//   - logo.svg      trae su badge violeta propio. Es el default y sirve sobre
//                   cualquier superficie, clara u oscura.
//   - logo-mark.svg es solo la marca, sin badge, con fondo transparente. Va
//                   en superficies que YA son violetas, donde el badge se
//                   recortaría contra un fondo del mismo color.
const ICON_SRC = "/logo.svg";
const ICON_SRC_MARK = "/logo-mark.svg";

export function LogoMark({
  size = 36,
  variant = "badge",
  className = "",
}: {
  size?: number;
  /** "plain" = sin badge, para superficies violetas. */
  variant?: "badge" | "plain";
  className?: string;
}) {
  return (
    <Image
      src={variant === "plain" ? ICON_SRC_MARK : ICON_SRC}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
    />
  );
}

/**
 * Ícono + wordmark "Vuelvo CRM". Decorativo por diseño: el texto visible al
 * lado ya dice el nombre, así que el ícono lleva `alt=""` para no duplicarlo
 * en lectores de pantalla.
 *
 * El manual de marca pide el nombre completo "Vuelvo CRM", con "CRM" en menor
 * jerarquía — es el descriptor de categoría, no parte del nombre hablado.
 */
export function Logo({
  tone = "default",
  size = "md",
  byline = false,
  className = "",
}: {
  /** "onBrand" es para fondos de marca fijos que no siguen el tema (panel de
   * auth, tarjeta de fidelidad) — ahí el texto va blanco siempre. */
  tone?: "default" | "onBrand";
  size?: "sm" | "md" | "lg";
  /** Agrega "Desarrollado por GUTMARK" debajo. La arquitectura de marca del
   * manual es GUTMARK (marca madre) → Vuelvo (producto); se muestra donde hay
   * que presentar el producto (landing, login), no dentro del panel, donde el
   * usuario ya sabe dónde está. */
  byline?: boolean;
  className?: string;
}) {
  const dims = { sm: 28, md: 36, lg: 40 }[size];
  const textSize = { sm: "text-sm", md: "text-base", lg: "text-lg" }[size];
  const onBrand = tone === "onBrand";
  const nameColor = onBrand ? "text-white" : "text-ink";
  const crmColor = onBrand ? "text-white/70" : "text-ink-muted";
  const bylineColor = onBrand ? "text-white/60" : "text-ink-faint";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={dims} variant={onBrand ? "plain" : "badge"} />
      <div className="leading-none">
        <span className={`font-display font-bold ${textSize} ${nameColor}`}>
          Vuelvo{" "}
          <span className={`font-semibold ${crmColor}`}>CRM</span>
        </span>
        {byline && (
          <span className={`mt-1 block text-[0.625rem] font-medium ${bylineColor}`}>
            Desarrollado por GUTMARK
          </span>
        )}
      </div>
    </div>
  );
}
